import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Import necessary functions
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

  useEffect(() => {
    const fetchFundsAndFees = async () => {
      try {
        // Fetch current funds (cashFund and gcashFund)
        const fundsRef = doc(db, 'funds', 'currentFunds');
        const fundsSnapshot = await getDoc(fundsRef);
        if (fundsSnapshot.exists()) {
          const fundsData = fundsSnapshot.data();
          setCashFund(fundsData.cashFund || 0);  // Set Cash Fund value
          setGcashFund(fundsData.gcashFund || 0);  // Set GCash Fund value
        }

        // Fetch all transactions and calculate total fees based on selected filter
        const transactionsRef = collection(db, 'transactions');
        let filteredTransactionsQuery = transactionsRef;

        if (filter !== 'all') {
          const today = new Date();
          let startDate = new Date(today.setHours(0, 0, 0, 0));
          let endDate = new Date(today.setHours(23, 59, 59, 999));

          if (filter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            startDate = new Date(yesterday.setHours(0, 0, 0, 0));
            endDate = new Date(yesterday.setHours(23, 59, 59, 999));
          }

          // Filter transactions by the dateCreated field
          filteredTransactionsQuery = query(
            transactionsRef,
            where("dateCreated", ">=", startDate),
            where("dateCreated", "<=", endDate)
          );
        }

        const transactionsSnapshot = await getDocs(filteredTransactionsQuery);
        let totalTransactionFee = 0;
        let transactionList = [];
        let totalPendingCash = 0; // Variable to store the total pending cash
        let totalPendingFee = 0; // Variable to store the total pending fee

        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const fee = data.fee;
          const status = data.status; // Status of the transaction
          const amount = data.amount; // Amount of the transaction
          
          if (typeof fee === 'number') {
            totalTransactionFee += fee;
            transactionList.push({
              ...data,
              id: doc.id,
            });

            // If the transaction is pending, add its amount to the totalPendingCash and its fee to the totalPendingFee
            if (status === 'pending') {
              totalPendingCash += amount;
              totalPendingFee += fee;
            }
          }
        });

        setTotalFee(totalTransactionFee);
        setTransactions(transactionList);
        setPendingCash(totalPendingCash); // Set the pending cash amount
        setPendingFee(totalPendingFee); // Set the pending fee amount
      } catch (error) {
        console.error("Error fetching funds or transactions:", error);
      }
    };

    fetchFundsAndFees();
  }, [filter]);  // Re-fetch when filter changes

  // Helper function to format Firebase timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();  // Format the date as a local string (MM/DD/YYYY, HH:MM AM/PM)
  };

  // Helper function to determine the text color based on transaction type
  const getTransactionTypeColor = (type) => {
    if (type === 'cash-in') {
      return 'text-green-500'; // Green color for cash-in
    } else if (type === 'cash-out') {
      return 'text-red-500'; // Red color for cash-out
    } else if (type === 'load') {
      return 'text-blue-500'; // Blue color for load
    }
    return 'text-black'; // Default color for other types
  };

  // Paginated transactions
  const startIndex = (page - 1) * itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  // Pagination controls
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

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
        <span className="text-orange-500 bg-orange-100 rounded-full px-1 py-1 text-sm font-medium ">
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

  {/* Total Fund */}
  <div className="border-t border-gray-200 pt-4 mt-4">
    <p className="text-xl font-bold text-gray-800 text-center">
      Total Fund: <span className="text-green-600">₱{(cashFund + gcashFund).toLocaleString()}</span>
    </p>
  </div>
</div>


        {/* Filter by Date */}
        <div className='bg-gray-100 p-2 rounded-md'>
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
              <th className="px-4 py-2 border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.length > 0 ? (
              currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="text-center">
                  <td className="px-4 py-2 border-b">
                    <span className={getTransactionTypeColor(transaction.type)}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b">{transaction.customerNumber}</td>
                  <td className="px-4 py-2 border-b">₱{transaction.amount.toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">₱{transaction.fee.toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">{formatDate(transaction.dateCreated)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center">No transactions available</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded-l"
            >
              Previous
            </button>
            <span className="px-4 py-2">{page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-blue-500 text-white rounded-r"
            >
              Next
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Total;
