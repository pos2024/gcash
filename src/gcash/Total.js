import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import db from '../firebase';

const Total = () => {
  const [totalFee, setTotalFee] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');  // Default to 'all' transactions
  const [page, setPage] = useState(1); // Pagination state
  const [cashFund, setCashFund] = useState(0); // Cash Fund
  const [gcashFund, setGcashFund] = useState(0); // GCash Fund
  const [pendingCash, setPendingCash] = useState(0); // Pending Cash Fund
  const [pendingFee, setPendingFee] = useState(0); // Pending Fee
  const itemsPerPage = 10; // Number of items to show per page
  const [undoTransaction, setUndoTransaction] = useState(null); // For handling undo action
  const [isConfirming, setIsConfirming] = useState(false); // For confirmation dialog

  useEffect(() => {
    const fetchFundsAndFees = async () => {
      try {
        // Fetching current funds from Firebase
        const fundsRef = doc(db, 'funds', 'currentFunds');
        const fundsSnapshot = await getDoc(fundsRef);
        if (fundsSnapshot.exists()) {
          const fundsData = fundsSnapshot.data();
          setCashFund(fundsData.cashFund || 0);
          setGcashFund(fundsData.gcashFund || 0);
        }
  
        // Fetching transactions with applied filter
        const transactionsRef = collection(db, 'transactions');
        let filteredTransactionsQuery = transactionsRef;
  
        // Apply date filter based on selected 'filter' value
        if (filter !== 'all') {
          const today = new Date();
          let startDate = new Date(today.setHours(0, 0, 0, 0));
          let endDate = new Date(today.setHours(23, 59, 59, 999));
  
          // If filter is 'yesterday'
          if (filter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            startDate = new Date(yesterday.setHours(0, 0, 0, 0));
            endDate = new Date(yesterday.setHours(23, 59, 59, 999));
          }
  
          // Apply date filter to the query
          filteredTransactionsQuery = query(
            filteredTransactionsQuery,
            where("dateCreated", ">=", startDate),
            where("dateCreated", "<=", endDate)
          );
        }
  
        // Fetch filtered transactions
        const transactionsSnapshot = await getDocs(filteredTransactionsQuery);
        let totalTransactionFee = 0;
        let transactionList = [];
        let totalPendingCash = 0;
        let totalPendingFee = 0;
  
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const fee = data.fee;
          const status = data.status;
          const amount = data.amount;
  
          // Filter transactions to include only those with 'completed' or 'pending' status
          if (typeof fee === 'number' && (status === 'completed' || status === 'pending')) {
            totalTransactionFee += fee;
            transactionList.push({
              ...data,
              id: doc.id,
            });
  
            if (status === 'pending') {
              totalPendingCash += amount;
              totalPendingFee += fee;
            }
          }
        });
  
        setTotalFee(totalTransactionFee);
        setTransactions(transactionList);
        setPendingCash(totalPendingCash);
        setPendingFee(totalPendingFee);
      } catch (error) {
        console.error("Error fetching funds or transactions:", error);
      }
    };
  
    fetchFundsAndFees();
  }, [filter]);  // Re-run effect when filter changes
  
  
  

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const getTransactionTypeColor = (type) => {
    if (type === 'cash-in') return 'text-green-500';
    if (type === 'cash-out') return 'text-red-500';
    if (type === 'load') return 'text-blue-500';
    return 'text-black';
  };

  const startIndex = (page - 1) * itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const handleUndo = async (transaction) => {
    setUndoTransaction(transaction);
    setIsConfirming(true); // Show confirmation dialog
  };

  const confirmUndo = async () => {
    if (undoTransaction) {
      const undoData = {
        ...undoTransaction,
        dateCreated: new Date(),
        type: 'undo',
        amount: -undoTransaction.amount,
        fee: -undoTransaction.fee,
        status: 'undotransact',  // Set the status to 'undotransact' for the undo transaction
      };
  
      try {
        // Create undo transaction in 'undoTransactions' collection
        await addDoc(collection(db, 'undoTransactions'), undoData);
  
        // Update the funds collection to reverse the amounts
        const fundsRef = doc(db, 'funds', 'currentFunds');
        const fundsSnapshot = await getDoc(fundsRef);
        if (fundsSnapshot.exists()) {
          const fundsData = fundsSnapshot.data();
  
          let updatedCashFund = fundsData.cashFund;
          let updatedGcashFund = fundsData.gcashFund;
  
          if (undoTransaction.type === 'cash-in') {
            // For cash-in: Deduct the amount and fee from the appropriate fund
            updatedCashFund -= (undoTransaction.amount + undoTransaction.fee);
            updatedGcashFund += undoTransaction.amount; // Re-add the amount to GCash Fund
          } else if (undoTransaction.type === 'cash-out') {
            // For cash-out: Add back the amount and fee to the appropriate fund
            updatedCashFund += undoTransaction.amount; // Re-add the amount to Cash Fund
            updatedGcashFund -= undoTransaction.amount; // Subtract the amount from GCash Fund
            updatedCashFund -= undoTransaction.fee; // Deduct the fee from Cash Fund (if any)
          } else if (undoTransaction.type === 'load') {
            // For load: Add back the amount to GCash Fund
            updatedGcashFund += undoTransaction.amount;
            updatedCashFund -= undoTransaction.fee; // If there was a fee, it should be added back to Cash Fund
          }
  
          // Update both cash fund and GCash fund
          await updateDoc(fundsRef, {
            cashFund: updatedCashFund,
            gcashFund: updatedGcashFund,
          });
        }
  
        // Update the original transaction status to 'undotransact'
        const transactionRef = doc(db, 'transactions', undoTransaction.id);
        await updateDoc(transactionRef, {
          status: 'undotransact',
        });
  
        setIsConfirming(false); // Close the confirmation dialog
        alert('Undo transaction completed.');
        setUndoTransaction(null); // Clear undo state
      } catch (error) {
        console.error('Error creating undo transaction:', error);
        setIsConfirming(false);
      }
    }
  };
  
  

  const cancelUndo = () => {
    setIsConfirming(false);
    setUndoTransaction(null);
  };

  return (
    <div className="mt-6 flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="bg-white shadow-lg rounded-lg p-6 mx-auto w-full max-w-lg m-4">
          <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">Transaction Fee Summary</h3>

          {/* Total Fee Collected */}
          <div className="mb-6">
            <p className="text-lg font-medium text-center text-gray-700">
              Total Fee : <span className="text-green-600 font-bold">₱{totalFee.toLocaleString()}</span>
            </p>
          </div>

          {/* Funds Information */}
          <div className="mb-4 border-t border-gray-200 pt-4">
            <p className="text-lg font-semibold text-gray-700 flex justify-between items-center">
              Cash Fund: <div>
                <span className="text-blue-600 font-bold">₱{cashFund.toLocaleString()}</span>
                {pendingCash > 0 && (
                  <span className="text-orange-500 bg-orange-100 rounded-full px-1 py-1 text-sm font-medium">
                    Pending: ₱{(pendingCash + pendingFee).toLocaleString()}
                  </span>
                )}
              </div>
            </p>
          </div>

          <div className="mb-4 border-t border-gray-200 pt-4">
            <p className="text-lg font-semibold text-gray-700 flex justify-between items-center">
              GCash Fund: <span className="text-blue-600 font-bold">₱{gcashFund.toLocaleString()}</span>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xl font-bold text-gray-800 text-center">
              Total Fund: <span className="text-green-600">₱{(cashFund + gcashFund).toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Filter by Date */}
        <div className="bg-gray-100 p-2 rounded-md">
          <div className="mb-4 text-center">
            <label className="mr-2">Filter Transactions:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
          </div>

          {/* Table for displaying transactions */}
          <table className="min-w-full table-auto border-collapse mx-auto bg-gray-100">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Transaction Type</th>
                <th className="px-4 py-2 border-b">Customer Number</th>
                <th className="px-4 py-2 border-b">Amount</th>
                <th className="px-4 py-2 border-b">Fee</th>
                <th className="px-4 py-2 border-b">Date Created</th>
                <th className="px-4 py-2 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="text-center">
                  <td className={`px-4 py-2 border-b ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </td>
                  <td className="px-4 py-2 border-b">{transaction.customerNumber}</td>
                  <td className="px-4 py-2 border-b">₱{transaction.amount.toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">₱{transaction.fee.toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">{formatDate(transaction.dateCreated)}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      className="text-red-600 font-semibold"
                      onClick={() => handleUndo(transaction)}
                    >
                      Undo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">{`Page ${page} of ${totalPages}`}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-center mb-4">Confirm Undo</h2>
            <p className="mb-4">Are you sure you want to undo this transaction?</p>
            <div className="flex justify-between">
              <button
                onClick={confirmUndo}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
              <button
                onClick={cancelUndo}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Total;
