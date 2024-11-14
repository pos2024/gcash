import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import db from '../firebase';

const Pending = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalFee, setTotalFee] = useState(0);

  useEffect(() => {
    const fetchPendingTransactions = async () => {
      const q = query(collection(db, 'transactions'), where('status', 'in', ['pending', 'paid']));

      try {
        const querySnapshot = await getDocs(q);
        const transactions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPendingTransactions(transactions);

        const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        const feeTotal = transactions.reduce((sum, transaction) => sum + transaction.fee, 0);
        setTotalAmount(total);
        setTotalFee(feeTotal);
      } catch (error) {
        console.error('Error fetching pending transactions: ', error);
      }
    };

    fetchPendingTransactions();
  }, []);

  const handleMarkAsPaid = async (transactionId) => {
    const transactionRef = doc(db, 'transactions', transactionId);

    try {
      await updateDoc(transactionRef, {
        status: 'paid',
        datePaid: serverTimestamp(),
      });

      setPendingTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, status: 'paid', datePaid: { seconds: Date.now() / 1000 } } : transaction
        )
      );
    } catch (error) {
      console.error('Error updating transaction status: ', error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const transactionRef = doc(db, 'transactions', transactionId);

    try {
      await deleteDoc(transactionRef);

      setPendingTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== transactionId)
      );
    } catch (error) {
      console.error('Error deleting transaction: ', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate the total for pending transactions only
  const pendingTotal = pendingTransactions
    .filter((transaction) => transaction.status === 'pending')
    .reduce((sum, transaction) => sum + transaction.amount + transaction.fee, 0);

  return (
    <div className="p-4 max-w-5xl mx-auto bg-white rounded-lg shadow-md mt-32">
      <h1 className="text-2xl font-bold mb-4">Pending Transactions</h1>

      <table className="min-w-full table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border text-gray-600">Customer Name</th>
            <th className="px-4 py-2 border text-gray-600">Amount</th>
            <th className="px-4 py-2 border text-gray-600">Fee</th>
            <th className="px-4 py-2 border text-gray-600">Total</th>
            <th className="px-4 py-2 border text-gray-600">Status</th>
            <th className="px-4 py-2 border text-gray-600">Date Created</th>
            <th className="px-4 py-2 border text-gray-600">Date Paid</th>
            <th className="px-4 py-2 border text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingTransactions.length > 0 ? (
            pendingTransactions.map((transaction, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">{transaction.name}</td>
                <td className="px-4 py-2">₱{transaction.amount.toLocaleString()}</td>
                <td className="px-4 py-2">₱{transaction.fee.toLocaleString()}</td>
                <td className="px-4 py-2">
                  ₱{(transaction.amount + transaction.fee).toLocaleString()}
                </td>
                <td className={`px-4 py-2 ${transaction.status === 'pending' ? 'text-orange-500' : 'text-green-500'}`}>
                  {transaction.status}
                </td>
                <td className="px-4 py-2">{formatDate(transaction.dateCreated)}</td>
                <td className="px-4 py-2">{formatDate(transaction.datePaid)}</td>
                <td className="px-4 py-2">
  <div className="flex space-x-2 justify-center">
    <button
      onClick={() => handleMarkAsPaid(transaction.id)}
      className={`px-4 py-2 rounded ${transaction.status === 'paid' ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 text-white'}`}
      disabled={transaction.status === 'paid'}
    >
      {transaction.status === 'paid' ? 'Paid' : 'Pay'}
    </button>
    <button
      onClick={() => handleDeleteTransaction(transaction.id)}
      className="px-4 py-2 rounded bg-red-500 text-white"
    >
      Delete
    </button>
  </div>
</td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-4 py-2 text-center text-gray-500">No pending transactions</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 p-4 border-t">
     
        <p className="text-xl font-semibold">Pending Total  ₱{pendingTotal.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Pending;
