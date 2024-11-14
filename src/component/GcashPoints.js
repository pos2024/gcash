import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase'; 

const GcashPoints = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!cardNumber || !amount || amount <= 0) {
      setMessage('Please fill in both fields with valid data.');
      return;
    }

    const pointsToAdd = calculatePoints(amount);
    
    try {
      setIsLoading(true);

      const q = query(collection(firestore, 'customers'), where('cardNumber', '==', cardNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage('Customer not found.');
        return;
      }

      querySnapshot.forEach(async (docSnapshot) => {
        const customerDoc = doc(firestore, 'customers', docSnapshot.id);
        const customerData = docSnapshot.data();
        
        const newPoints = (customerData.points || 0) + pointsToAdd;
        const newTotalAmount = (customerData.totalAmount || 0) + parseFloat(amount); 

        await updateDoc(customerDoc, { 
          points: newPoints, 
          totalAmount: newTotalAmount 
        });

        setMessage(`Successfully added ${pointsToAdd} points`);
       
        setCardNumber('');
        setAmount('');
      });
    } catch (error) {
      console.error('Error updating document: ', error);
      setMessage('Failed to add points. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePoints = (amount) => {
    if (amount >= 25000) {
      return (amount / 1000) * 1.25; 
    }
    return amount / 1000;
  };

  return (
    <div
      className="p-4 flex flex-col space-y-2 h-1/2 bg-gradient-to-bl"
      style={{
        backgroundImage: "linear-gradient(to bottom left, #1c6ced, #5a9dff)",
      }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">Add Gcash Points</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Card Number:</label>
            <input 
              type="text" 
              value={cardNumber} 
              onChange={(e) => setCardNumber(e.target.value)} 
              required 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Amount (in pesos):</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-gray-400' : 'bg-blue-600'} text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200`}
          >
            {isLoading ? 'Adding...' : 'Add Points'}
          </button>
          {message && <p className={`mt-4 text-center ${message.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default GcashPoints;
