import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '../firebase';

const db = getFirestore(app);

const Register = () => {
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [uniqueID] = useState(new Date().toISOString()); 
  const [points] = useState(0); 
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, 'customers'), {
        uniqueID,
        name,
        points,
        cardNumber,
      });
      alert('Registration successful!');
     
      setName('');
      setCardNumber('');
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
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
            <p className="text-sm text-gray-600">Unique ID: <span className="font-medium">{uniqueID}</span></p>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">Points: <span className="font-medium">{points}</span></p>
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
