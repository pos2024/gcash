import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import db from '../firebase';

const FundsManagement = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [amount, setAmount] = useState('');
  const [gcashAmount, setGcashAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [fundType, setFundType] = useState('cash');
  const [swapDirection, setSwapDirection] = useState('gcashToCash');
  const [description, setDescription] = useState('');
  const [logs, setLogs] = useState([]);
  const [funds, setFunds] = useState({ cashFund: 0, gcashFund: 0 });

  useEffect(() => {
    const fetchFunds = async () => {
      const fundsRef = doc(db, 'funds', 'currentFunds');
      const docSnap = await getDoc(fundsRef);
      if (docSnap.exists()) {
        setFunds(docSnap.data());
      }
    };
    fetchFunds();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      const fundsLogRef = collection(db, 'fundslog');
      const snapshot = await getDocs(fundsLogRef);
      const fetchedLogs = snapshot.docs.map(doc => doc.data());
      setLogs(fetchedLogs);
    };
    fetchLogs();
  }, []);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleAddFunds = async () => {
    const fundsRef = doc(db, 'funds', 'currentFunds');
    const docSnap = await getDoc(fundsRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let newCash = data.cashFund;
      let newGcash = data.gcashFund;

      if (fundType === 'cash') {
        newCash += parseFloat(amount);
      } else {
        newGcash += parseFloat(amount);
      }

      await updateDoc(fundsRef, {
        cashFund: newCash,
        gcashFund: newGcash,
      });

      await addFundLog(newCash, newGcash, 'Add Funds', description);

      setFunds({ cashFund: newCash, gcashFund: newGcash });
    }
  };

  const handleUpdateFunds = async () => {
    const fundsRef = doc(db, 'funds', 'currentFunds');
    await updateDoc(fundsRef, {
      cashFund: parseFloat(cashAmount),
      gcashFund: parseFloat(gcashAmount),
    });

    await addFundLog(parseFloat(cashAmount), parseFloat(gcashAmount), 'Update Funds', description);

    setFunds({ cashFund: parseFloat(cashAmount), gcashFund: parseFloat(gcashAmount) });
  };

  const handleSwapFunds = async () => {
    const fundsRef = doc(db, 'funds', 'currentFunds');
    const docSnap = await getDoc(fundsRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let newCash = data.cashFund;
      let newGcash = data.gcashFund;

      if (swapDirection === 'gcashToCash') {
        newCash += parseFloat(amount);
        newGcash -= parseFloat(amount);
      } else {
        newCash -= parseFloat(amount);
        newGcash += parseFloat(amount);
      }

      await updateDoc(fundsRef, {
        cashFund: newCash,
        gcashFund: newGcash,
      });

      await addFundLog(newCash, newGcash, 'Swap Funds', description);

      setFunds({ cashFund: newCash, gcashFund: newGcash });
    }
  };

  const addFundLog = async (newCash, newGcash, type, description) => {
    const fundsLogRef = doc(db, 'fundslog', new Date().toISOString());
    await setDoc(fundsLogRef, {
      updatedCashFund: newCash,
      updatedGcashFund: newGcash,
      description: description,
      updateTime: new Date().toISOString(),
      transactionType: type,
    });

    setLogs((prevLogs) => [
      ...prevLogs,
      {
        updatedCashFund: newCash,
        updatedGcashFund: newGcash,
        description: description,
        updateTime: new Date().toISOString(),
        transactionType: type,
      },
    ]);
  };

  return (
    <div className="mt-6 flex justify-center ml-32 bg-white p-4 rounded-md">
     <div>
     <h1 className="text-2xl font-bold mb-6">Funds Management</h1>

{/* Permanent Fund Display */}
<div className="mb-6">
  <div className="flex space-x-4">
    <div className="p-4 bg-gray-100 border rounded-md w-1/3">
      <h2 className="text-lg font-semibold">Cash Fund</h2>
      <p className="text-xl">{`₱ ${funds.cashFund.toFixed(2)}`}</p>
    </div>
    <div className="p-4 bg-gray-100 border rounded-md w-1/3">
      <h2 className="text-lg font-semibold">GCash Fund</h2>
      <p className="text-xl">{`₱ ${funds.gcashFund.toFixed(2)}`}</p>
    </div>
  </div>
</div>

{/* Select Action Form */}
<div className="mb-6">
  <select
    value={selectedOption}
    onChange={handleOptionChange}
    className="p-3 border border-gray-300 rounded-md w-full"
  >
    <option value="">Select Action</option>
    <option value="UpdateFunds">Update Funds</option>
    <option value="AddFunds">Add Funds</option>
    <option value="SwapFunds">Swap Funds</option>
  </select>
</div>

{/* Update Funds Form */}
{selectedOption === 'UpdateFunds' && (
  <div className="bg-gray-100 p-6 rounded-md shadow-md mb-6">
    <h2 className="text-xl font-semibold mb-4">Update Funds</h2>
    <div className="mb-4">
      <input
        type="number"
        value={gcashAmount}
        onChange={(e) => setGcashAmount(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full mb-4"
        placeholder="GCash Amount"
      />
      <input
        type="number"
        value={cashAmount}
        onChange={(e) => setCashAmount(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full"
        placeholder="Cash Amount"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full mt-4"
        placeholder="Description"
      />
    </div>
    <button
      onClick={handleUpdateFunds}
      className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4"
    >
      Update Funds
    </button>
  </div>
)}

{/* Add Funds Form */}
{selectedOption === 'AddFunds' && (
  <div className="bg-gray-100 p-6 rounded-md shadow-md mb-6">
    <h2 className="text-xl font-semibold mb-4">Add Funds</h2>
    <div className="mb-4">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full mb-4"
        placeholder="Amount"
      />
      <select
        value={fundType}
        onChange={(e) => setFundType(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full"
      >
        <option value="cash">Cash</option>
        <option value="gcash">GCash</option>
      </select>
    </div>
    <button
      onClick={handleAddFunds}
      className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4"
    >
      Add Funds
    </button>
  </div>
)}

{/* Swap Funds Form */}
{selectedOption === 'SwapFunds' && (
  <div className="bg-gray-100 p-6 rounded-md shadow-md mb-6">
    <h2 className="text-xl font-semibold mb-4">Swap Funds</h2>
    <div className="mb-4">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full mb-4"
        placeholder="Amount"
      />
      <select
        value={swapDirection}
        onChange={(e) => setSwapDirection(e.target.value)}
        className="p-3 border border-gray-300 rounded-md w-full"
      >
        <option value="gcashToCash">GCash to Cash</option>
        <option value="cashToGcash">Cash to GCash</option>
      </select>
    </div>
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="p-3 border border-gray-300 rounded-md w-full mt-4"
      placeholder="Description"
    />
    <button
      onClick={handleSwapFunds}
      className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4"
    >
      Swap Funds
    </button>
  </div>
)}

{/* Logs Table */}
<div className="bg-white p-6 rounded-md shadow-md">
  <h2 className="text-xl font-semibold mb-4">Logs</h2>
  <table className="w-full table-auto">
    <thead>
      <tr className="bg-gray-200">
        <th className="px-4 py-2">Update Time</th>
        <th className="px-4 py-2">Transaction Type</th>
        <th className="px-4 py-2">Description</th>
        <th className="px-4 py-2">GCash Fund</th>
        <th className="px-4 py-2">Cash Fund</th>
      </tr>
    </thead>
    <tbody>
{logs
.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime)) // Sort logs by updateTime in descending order
.map((log, index) => (
<tr key={index} className="border-b">
 <td className="px-4 py-2">
{new Date(log.updateTime).toLocaleString("en-US", {
year: "numeric",
month: "long",
day: "numeric",
hour: "2-digit",
minute: "2-digit",
hour12: true, // This makes the time in 12-hour format (AM/PM)
})}
</td>

  
  {/* Use ternary expressions to set color based on transaction type */}
  <td
    className={`px-4 py-2 ${
      log.transactionType === "Update Funds"
        ? "text-blue-500"
        : log.transactionType === "Add Funds"
        ? "text-green-500"
        : log.transactionType === "Swap Funds"
        ? "text-orange-500"
        : ""
    }`}
  >
    {log.transactionType}
  </td>
  
  <td className="px-4 py-2">{log.description}</td>
  <td className="px-4 py-2">{`₱ ${Number(log.updatedGcashFund || 0).toFixed(2)}`}</td>
  <td className="px-4 py-2">{`₱ ${Number(log.updatedCashFund || 0).toFixed(2)}`}</td>
</tr>
))}
</tbody>



  </table>
</div>
     </div>
    </div>
  );
};

export default FundsManagement;
