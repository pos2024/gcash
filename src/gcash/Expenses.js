import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import db from '../firebase';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [gcashFund, setGcashFund] = useState(0);
  const [cashFund, setCashFund] = useState(0);
  const [amount, setAmount] = useState('');
  const [fundType, setFundType] = useState('gcashFund');
  const [description, setDescription] = useState('');
  const [calculationResult, setCalculationResult] = useState('');

  // Fetch expenses and fund values when the component mounts
  useEffect(() => {
    const fetchExpensesAndFunds = async () => {
      try {
        // Fetch expenses
        const expenseCollection = collection(db, 'expense');
        const expenseSnapshot = await getDocs(expenseCollection);
        const expenseList = expenseSnapshot.docs.map(doc => doc.data());
        setExpenses(expenseList);

        // Fetch current fund values
        const fundsRef = doc(db, 'funds', 'currentFunds');
        const fundsSnapshot = await getDoc(fundsRef);
        if (fundsSnapshot.exists()) {
          const fundsData = fundsSnapshot.data();
          setGcashFund(fundsData.gcashFund);
          setCashFund(fundsData.cashFund);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchExpensesAndFunds();
  }, []);

  // Handle the expense transaction
  const handleAddExpense = async () => {
    if (!amount || !description) {
      alert('Please provide valid amount and description.');
      return;
    }

    let updatedGcashFund = gcashFund;
    let updatedCashFund = cashFund;
    const currentTime = new Date().toLocaleString();

    // Calculate the updated fund value
    let fundCalculation = '';
    let updatedFund = 0;
    if (fundType === 'gcashFund') {
      if (gcashFund < amount) {
        alert('Insufficient GCash fund');
        return;
      }
      updatedFund = gcashFund - amount;
      fundCalculation = `${amount} - ${gcashFund} = ${updatedFund}`;
      updatedGcashFund = updatedFund;
    } else {
      if (cashFund < amount) {
        alert('Insufficient Cash fund');
        return;
      }
      updatedFund = cashFund - amount;
      fundCalculation = `${amount} - ${cashFund} = ${updatedFund}`;
      updatedCashFund = updatedFund;
    }

    try {
      // Create a new expense record with updated fund
      const newExpense = {
        amount,
        fundType,
        description,
        transactionTime: currentTime,
        updatedGcashFund,
        updatedCashFund,
        calculation: fundCalculation,
      };
      
      // Save the new expense to Firestore
      await setDoc(doc(db, 'expense', Date.now().toString()), newExpense);

      // Update the fund values in Firestore
      const fundsRef = doc(db, 'funds', 'currentFunds');
      await updateDoc(fundsRef, {
        gcashFund: updatedGcashFund,
        cashFund: updatedCashFund,
      });

      // Update local state
      setExpenses(prevExpenses => [...prevExpenses, newExpense]);
      setGcashFund(updatedGcashFund);
      setCashFund(updatedCashFund);
      setAmount('');
      setDescription('');
      setCalculationResult(fundCalculation); // Update the calculation result
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  return (
    <div className="mt-6 flex justify-center ml-32 ">
     <div className="p-4 mt-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Expense Transactions</h2>

      <div className="mb-4">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="border p-2 mr-2"
        />
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Enter description"
          className="border p-2 mr-2"
        />
        <select
          value={fundType}
          onChange={e => setFundType(e.target.value)}
          className="border p-2"
        >
          <option value="gcashFund">GCash</option>
          <option value="cashFund">Cash</option>
        </select>
        <button
          onClick={handleAddExpense}
          className="bg-blue-500 text-white p-2 ml-2"
        >
          Add Expense
        </button>
      </div>

      <div className="mb-4">
        {calculationResult && (
          <p className="text-lg text-gray-700">
            Calculation: {calculationResult}
          </p>
        )}
      </div>

      <table className="min-w-full table-auto border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 border text-left">Amount</th>
            <th className="px-4 py-2 border text-left">Fund Type</th>
            <th className="px-4 py-2 border text-left">Description</th>
            <th className="px-4 py-2 border text-left">Transaction Time</th>
            <th className="px-4 py-2 border text-left">Updated GCash Fund</th>
            <th className="px-4 py-2 border text-left">Updated Cash Fund</th>
            <th className="px-4 py-2 border text-left">Calculation</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center px-4 py-2 text-gray-500">No transactions found.</td>
            </tr>
          ) : (
            expenses.map((expense, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border">{expense.amount}</td>
                <td className="px-4 py-2 border">{expense.fundType}</td>
                <td className="px-4 py-2 border">{expense.description}</td>
                <td className="px-4 py-2 border">{expense.transactionTime}</td>
                <td className="px-4 py-2 border">{expense.updatedGcashFund}</td>
                <td className="px-4 py-2 border">{expense.updatedCashFund}</td>
                <td className="px-4 py-2 border">{expense.calculation}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
   </div>
  );
};

export default Expenses;
