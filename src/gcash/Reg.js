import React, { useState } from 'react';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import db from '../firebase';

const Reg = () => {
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Handle registration submission
  const handleRegister = async (e) => {
    e.preventDefault();

    // Generate customer ID based on email (simple method)
    const customerId = email.replace('@', '_').replace('.', '_');

    // Default subscription status set to false (inactive)
    const customerData = {
      personal_details: {
        name: name,
        phone_number: phone,
        email: email,
        address: address,
      },
      subscription_status: "inactive", // Set subscription status to false or inactive by default
      delivery_schedule: [], // Empty initially, to be filled once they subscribe
      payment_details: {
        payment_method: "none", // No payment at registration
        amount_paid: 0,
        payment_date: Timestamp.fromDate(new Date()), // Registration date
        payment_status: "unpaid", // Initially unpaid
      },
      loyalty_points: {
        points_balance: 0,
        points_history: [],
      },
      referral_details: {
        referral_code: "",
        referrals_count: 0,
        referral_points: 0,
      },
    };

    try {
      // Save customer data to Firestore in the 'customers' collection
      await setDoc(doc(db, "customerss", customerId), customerData);
      alert("Registration successful! You can select your subscription later.");
    } catch (error) {
      console.error("Error registering customer:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Register</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reg;
