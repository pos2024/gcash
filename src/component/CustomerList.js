import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase'; 

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customerCollection = collection(firestore, 'customers');
        const customerSnapshot = await getDocs(customerCollection);
        const customerList = customerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomers(customerList);
      } catch (err) {
        setError('Failed to fetch customers.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return <div>Loading customers...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen  bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">Customer List With Card</h2>
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border-b p-4 text-left">Card Number</th>
              <th className="border-b p-4 text-left">Name</th>
              <th className="border-b p-4 text-left">Points</th>
              <th className="border-b p-4 text-left">Total Amount</th>
              <th className="border-b p-4 text-left">Unique ID</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td className="border-b p-4">{customer.cardNumber}</td>
                <td className="border-b p-4">{customer.name}</td>
                <td className="border-b p-4">{customer.points || 0}</td>
                <td className="border-b p-4">{customer.totalAmount || 0}</td>
                <td className="border-b p-4">{customer.uniqueID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;
