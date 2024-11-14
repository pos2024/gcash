import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc, getDocs, getDoc } from 'firebase/firestore';
import db from '../firebase';

const FundManager = () => {
  const [initialCashFund, setInitialCashFund] = useState('');
  const [initialGcashFund, setInitialGcashFund] = useState('');
  const [addCashFund, setAddCashFund] = useState('');
  const [addGcashFund, setAddGcashFund] = useState('');
  const [fundUpdateLogs, setFundUpdateLogs] = useState([]);
  const [transferDirection, setTransferDirection] = useState('gcashToCash'); // gcashToCash or cashToGcash
  const [amountToTransfer, setAmountToTransfer] = useState('');
  const [addDescription, setAddDescription] = useState(''); // New state for description
  const [swapDescription, setSwapDescription] = useState(''); // New state for swap description
  const [type, setType] = useState('swapfund'); // New state for "type"

  // Fetch fund update logs from Firestore
  useEffect(() => {
    const fetchFundUpdateLogs = async () => {
      try {
        const logCollection = collection(db, 'updatefundlog');
        const logSnapshot = await getDocs(logCollection);
        const logList = logSnapshot.docs.map(doc => doc.data());
        setFundUpdateLogs(logList);
      } catch (error) {
        console.error('Error fetching fund update logs:', error);
      }
    };

    fetchFundUpdateLogs();
  }, []);

  const updateFunds = async () => {
    if (!initialCashFund || !initialGcashFund) {
      alert('Please fill in both fund values.');
      return;
    }

    try {
      const fundsRef = doc(db, 'funds', 'currentFunds');
      const fundsDoc = await getDoc(fundsRef);

      if (!fundsDoc.exists()) {
        alert('No fund data found!');
        return;
      }

      const currentFunds = fundsDoc.data();

      const prevCashFund = currentFunds.cashFund;
      const prevGcashFund = currentFunds.gcashFund;

      // Update funds
      await updateDoc(fundsRef, {
        cashFund: Number(initialCashFund),
        gcashFund: Number(initialGcashFund),
      });

      const logEntry = {
        previousCashFund: prevCashFund,
        previousGcashFund: prevGcashFund,
        updatedCashFund: Number(initialCashFund),
        updatedGcashFund: Number(initialGcashFund),
        description: addDescription, // Add description to the log
        type: type, // Include type in the log
        updateTime: new Date().toLocaleString(),
      };

      await addDoc(collection(db, 'updatefundlog'), logEntry);

      alert('Funds updated and logged successfully.');

      setInitialCashFund('');
      setInitialGcashFund('');
      setAddDescription(''); // Clear description input

      const logSnapshot = await getDocs(collection(db, 'updatefundlog'));
      const logList = logSnapshot.docs.map(doc => doc.data());
      setFundUpdateLogs(logList);

    } catch (error) {
      console.error('Error updating funds:', error);
    }
  };

  const addFunds = async () => {
    if (!addCashFund && !addGcashFund) {
      alert('Please enter an amount for either Cash or GCash.');
      return;
    }

    try {
      const fundsRef = doc(db, 'funds', 'currentFunds');
      const fundsDoc = await getDoc(fundsRef);

      if (!fundsDoc.exists()) {
        alert('No fund data found!');
        return;
      }

      const currentFunds = fundsDoc.data();

      const updatedCashFund = addCashFund ? currentFunds.cashFund + Number(addCashFund) : currentFunds.cashFund;
      const updatedGcashFund = addGcashFund ? currentFunds.gcashFund + Number(addGcashFund) : currentFunds.gcashFund;

      await updateDoc(fundsRef, {
        cashFund: updatedCashFund,
        gcashFund: updatedGcashFund,
      });

      const logEntry = {
        previousCashFund: currentFunds.cashFund,
        previousGcashFund: currentFunds.gcashFund,
        updatedCashFund: updatedCashFund,
        updatedGcashFund: updatedGcashFund,
        description: addDescription, // Add description to the log
        type: type, // Include type in the log
        updateTime: new Date().toLocaleString(),
      };

      await addDoc(collection(db, 'updatefundlog'), logEntry);

      alert('Funds added and logged successfully.');

      setAddCashFund('');
      setAddGcashFund('');
      setAddDescription(''); // Clear description input

      const logSnapshot = await getDocs(collection(db, 'updatefundlog'));
      const logList = logSnapshot.docs.map(doc => doc.data());
      setFundUpdateLogs(logList);

    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const swapFunds = async () => {
    if (!amountToTransfer) {
      alert('Please enter an amount to transfer.');
      return;
    }

    try {
      const fundsRef = doc(db, 'funds', 'currentFunds');
      const fundsDoc = await getDoc(fundsRef);

      if (!fundsDoc.exists()) {
        alert('No fund data found!');
        return;
      }

      const currentFunds = fundsDoc.data();

      let updatedCashFund = currentFunds.cashFund;
      let updatedGcashFund = currentFunds.gcashFund;

      // Determine the direction of the transfer
      if (transferDirection === 'gcashToCash') {
        updatedCashFund += Number(amountToTransfer);
        updatedGcashFund -= Number(amountToTransfer);
      } else if (transferDirection === 'cashToGcash') {
        updatedCashFund -= Number(amountToTransfer);
        updatedGcashFund += Number(amountToTransfer);
      }

      // Update the funds in Firestore
      await updateDoc(fundsRef, {
        cashFund: updatedCashFund,
        gcashFund: updatedGcashFund,
      });

      const logEntry = {
        previousCashFund: currentFunds.cashFund,
        previousGcashFund: currentFunds.gcashFund,
        updatedCashFund,
        updatedGcashFund,
        description: swapDescription, // Add description to the log
        type: type, // Include type in the log
        updateTime: new Date().toLocaleString(),
      };

      await addDoc(collection(db, 'updatefundlog'), logEntry);

      alert('Funds swapped and logged successfully.');

      setAmountToTransfer('');
      setSwapDescription(''); // Clear description input

      const logSnapshot = await getDocs(collection(db, 'updatefundlog'));
      const logList = logSnapshot.docs.map(doc => doc.data());
      setFundUpdateLogs(logList);

    } catch (error) {
      console.error('Error swapping funds:', error);
    }
  };

  return (
    <div className="p-4 mt-6 bg-gray-100 rounded-lg">
      <div className="flex space-x-4">
        <div className="w-1/4 p-4 bg-gray-200">
          <h2 className="text-xl font-bold mb-2">Manage Initial Funds</h2>
          <input
            type="number"
            value={initialCashFund}
            onChange={(e) => setInitialCashFund(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Set initial cash fund"
          />
          <input
            type="number"
            value={initialGcashFund}
            onChange={(e) => setInitialGcashFund(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Set initial GCash fund"
          />
          <textarea
            value={addDescription}
            onChange={(e) => setAddDescription(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Description"
          />
          <button
            onClick={updateFunds}
            className="w-full bg-green-500 text-white py-2 rounded"
          >
            Update Funds
          </button>
        </div>

        <div className="w-1/4 p-4 bg-gray-200">
          <h2 className="text-xl font-bold mb-2">Add Gcash/Cash</h2>
          <input
            type="number"
            value={addCashFund}
            onChange={(e) => setAddCashFund(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Add to cash fund"
          />
          <input
            type="number"
            value={addGcashFund}
            onChange={(e) => setAddGcashFund(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Add to GCash fund"
          />
          <textarea
            value={addDescription}
            onChange={(e) => setAddDescription(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Description"
          />
          <button
            onClick={addFunds}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Add Funds
          </button>
        </div>

        <div className="w-1/4 p-4 bg-gray-200">
          <h2 className="text-xl font-bold mb-2">Swap Funds</h2>
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => setTransferDirection('gcashToCash')}
              className={`${
                transferDirection === 'gcashToCash'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500 text-white'
              } w-full py-2 rounded`}
            >
              GCash to Cash
            </button>
            <button
              onClick={() => setTransferDirection('cashToGcash')}
              className={`${
                transferDirection === 'cashToGcash'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500 text-white'
              } w-full py-2 rounded`}
            >
              Cash to GCash
            </button>
          </div>
          <input
            type="number"
            value={amountToTransfer}
            onChange={(e) => setAmountToTransfer(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Amount to transfer"
          />
          <textarea
            value={swapDescription}
            onChange={(e) => setSwapDescription(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Description"
          />
          <button
            onClick={swapFunds}
            className="w-full bg-red-500 text-white py-2 rounded"
          >
            Swap Funds
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Fund Update Logs</h2>
        <div className="space-y-4">
          {fundUpdateLogs.map((log, index) => (
            <div key={index} className="p-4 bg-white shadow-lg rounded-lg">
              <p>
                <strong>Previous Cash Fund:</strong> ₱{log.previousCashFund}
              </p>
              <p>
                <strong>Previous GCash Fund:</strong> ₱{log.previousGcashFund}
              </p>
              <p>
                <strong>Updated Cash Fund:</strong> ₱{log.updatedCashFund}
              </p>
              <p>
                <strong>Updated GCash Fund:</strong> ₱{log.updatedGcashFund}
              </p>
              <p>
                <strong>Description:</strong> {log.description}
              </p>
              <p>
                <strong>Type:</strong> {log.type}
              </p>
              <p>
                <strong>Update Time:</strong> {log.updateTime}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundManager;
