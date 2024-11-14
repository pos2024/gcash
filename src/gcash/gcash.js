import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import db from '../firebase';
import FundManager from './FundManager';
import Total from './Total';
import { format } from 'date-fns';  // Importing date-fns to format the date
import Expenses from './Expenses';
import Pending from './Pending';
import FundsManagement from './FundsManagement';
import DailyTransaction from './DailyTransaction';


const Gcash = () => {
  const [cashFund, setCashFund] = useState(0);
  const [gcashFund, setGcashFund] = useState(0);
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [type, setType] = useState('cash-in');
  const [feeFund, setFeeFund] = useState('cash-fund');
  const [name, setName] = useState(''); // New state for name
  const [isPending, setIsPending] = useState(false); // State for checkbox status

  useEffect(() => {
    const fetchFunds = async () => {
      const fundsRef = doc(db, 'funds', 'currentFunds');
      const fundsSnapshot = await getDoc(fundsRef);
      if (fundsSnapshot.exists()) {
        setCashFund(fundsSnapshot.data().cashFund);
        setGcashFund(fundsSnapshot.data().gcashFund);
      }
    };

    fetchFunds();
  }, []);

  const calculateFee = (amt) => Math.ceil(amt / 500) * 5;

  const handleTransaction = async () => {
    if (!amount || !customerNumber) {
      alert('Please fill in all required fields.');
      return;
    }

    // Calculate the fee if not entered
    const computedFee = fee ? Number(fee) : calculateFee(Number(amount));
    const transactionAmount = Number(amount);

    let newCashFund = cashFund;
    let newGcashFund = gcashFund;

    // If "Pending" checkbox is checked, set the status to "pending"
    const status = isPending ? 'pending' : 'completed';

    if (type === 'cash-in') {
      // Cash-In: Add the fee to the selected fund, but deduct only the amount (without the fee) from the GCash fund
      if (feeFund === 'cash-fund') {
        newCashFund += (transactionAmount + computedFee); // Add fee to Cash Fund
      } else {
        newGcashFund += computedFee;  // Add fee to GCash Fund
      }
      newGcashFund -= transactionAmount; // Deduct only the amount (without the fee) from GCash Fund
    } else if (type === 'cash-out') {
      // Cash-Out: Deduct only the amount (without the fee) from Cash Fund
      if (cashFund < transactionAmount) {
        alert('Insufficient funds in Cash fund.');
        return;
      }
      newCashFund -= transactionAmount; // Deduct only the amount (without the fee) from Cash Fund

      // Add the fee to the selected fund (Cash Fund or GCash Fund)
      if (feeFund === 'cash-fund') {
        newCashFund += computedFee; // Add the fee to Cash Fund
      } else {
        newGcashFund += computedFee; // Add the fee to GCash Fund
      }

      // Add the full amount (without the fee) to GCash Fund
      newGcashFund += transactionAmount;
    } else if (type === 'load') {
      // Load: Deduct from GCash Fund and add the fee to the selected fund
      if (gcashFund < transactionAmount) {
        alert('Insufficient funds in GCash fund.');
        return;
      }
      newGcashFund -= transactionAmount; // Deduct amount from GCash Fund

      // Add the fee to the selected fund (Cash Fund or GCash Fund)
      if (feeFund === 'cash-fund') {
        newCashFund += computedFee; // Add fee to Cash Fund
      } else {
        newGcashFund += computedFee; // Add fee to GCash Fund
      }
    }

    // Save the transaction to the database
    const transactionDate = new Date();  // Current date and time

    const newTransaction = {
      amount: transactionAmount,
      fee: computedFee,
      customerNumber,
      type,
      status, // Added status field
      name: isPending ? name : '', // Only set the name if it's pending
      dateCreated: transactionDate,  // Add the timestamp as dateCreated
    };

    try {
      // Save the transaction to Firebase
      await addDoc(collection(db, 'transactions'), newTransaction);

      // Update the funds in Firebase based on feeFund selection
      const fundsRef = doc(db, 'funds', 'currentFunds');
      await updateDoc(fundsRef, {
        cashFund: newCashFund,
        gcashFund: newGcashFund,
      });

      // Update local state with the new values
      setCashFund(newCashFund);
      setGcashFund(newGcashFund);
    } catch (error) {
      console.error('Error processing transaction:', error);
    }

    // Reset fields after transaction
    setAmount('');
    setFee('');
    setCustomerNumber('');
    setType('cash-in');
    setFeeFund('cash-fund');
    setIsPending(false); // Reset checkbox status
    setName(''); // Reset name
  };

  return (
    <div
    className="p-4 flex flex-col space-y-2 h-1/2  bg-gradient-to-bl"
    style={{
      backgroundImage: "linear-gradient(to bottom left, #1c6ced, #5a9dff)",
    }}
  >
      <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">GCash Cash In/Out</h1>
        <p> Cash Fund: ₱{cashFund.toLocaleString()}</p>
        <p> GCash Fund: ₱{gcashFund.toLocaleString()}</p>

        <div>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter amount"
              required
            />
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter fee (optional)"
            />
            <input
              type="text"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Customer GCash number"
              required
            />
         <select
  value={type}
  onChange={(e) => setType(e.target.value)}
  className="w-full p-2 border rounded"
  style={{
    color: type === "cash-in" ? "green" : type === "cash-out" ? "orange" : "blue",
  }}
>
  <option value="cash-in" style={{ color: "green" }}>
    Cash In
  </option>
  <option value="cash-out" style={{ color: "orange" }}>
    Cash Out
  </option>
  <option value="load" style={{ color: "blue" }}>
    Load
  </option>
</select>


            {/* Fee Allocation Selector */}
            <div className="mt-4">
              <label className="mr-4">Select fee placement:</label>
              <label className="mr-4">
                <input
                  type="radio"
                  value="cash-fund"
                  checked={feeFund === 'cash-fund'}
                  onChange={() => setFeeFund('cash-fund')}
                />
                Cash Fund
              </label>
              <label>
                <input
                  type="radio"
                  value="gcash-fund"
                  checked={feeFund === 'gcash-fund'}
                  onChange={() => setFeeFund('gcash-fund')}
                />
                GCash Fund
              </label>
            </div>

            {/* Checkbox for Pending Status */}
            <div className="mt-4">
              <label className="mr-4">
                <input
                  type="checkbox"
                  checked={isPending}
                  onChange={() => setIsPending(!isPending)}
                />
                Pending 
              </label>
            </div>

            {/* Show Name input if Pending checkbox is checked */}
            {isPending && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter Name"
                required
              />
            )}

            <button
              onClick={handleTransaction}
              className="w-full bg-blue-500 text-white p-2 rounded-lg"
            >
              Process Transaction
            </button>
          </form>
        </div>

       
      </div>
   
 
     
    </div>
  );
};

export default Gcash;
