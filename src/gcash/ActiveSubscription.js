import React, { useState } from 'react';
import { getFirestore, doc, updateDoc, getDoc, addDoc, collection, increment } from 'firebase/firestore';
import db from '../firebase'; // Your Firestore configuration

const ActivateSubscription = () => {
  // State for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Customer email (you can pass this dynamically or get from auth)
  const customerEmail = "jomerdingle15@gmail.com";  // Replace with dynamic customer email

  // Handle activating the subscription
  const handleActivateSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const customerId = customerEmail.replace('@', '_').replace('.', '_'); // Convert email to customer ID
      const customerDocRef = doc(db, "customerss", customerId);  // Reference to the customer document

      // Check if the customer document exists
      const customerDoc = await getDoc(customerDocRef);
      
      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }

      // Update only the subscription_status in the customerss collection
      await updateDoc(customerDocRef, {
        subscription_status: "active", // Update the root subscription_status field
      });

      // Create the subscription document in the "subscriptions" collection
      const subscriptionData = {
        customer_id: customerId, // Customer ID
        start_date: new Date(),  // Current date as subscription start date
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month subscription duration
        subscription_type: "Subscription 1", // Example subscription type (could be dynamic)
        delivery_frequency: "weekly",
        gallons_per_week: 6, // 6 gallons per week
        total_gallons: 24, // Total gallons for the month (6 gallons/week * 4 weeks)
        gallons_remaining: 24, // Initially, all 24 gallons are remaining
        status: "active", // Subscription status (for the subscription document)
      };

      // Add subscription details to the "subscriptions" collection
      await addDoc(collection(db, "subscriptions"), subscriptionData);

      // Now, reward points for activating the subscription
      // You could also determine the points based on the subscription type or amount
      const pointsEarned = 10; // Example: 10 points for activation
      await updateDoc(customerDocRef, {
        "loyalty_points.points_balance": increment(pointsEarned), // Add points to balance
        "loyalty_points.points_history": [
          ...customerDoc.data().loyalty_points.points_history,
          {
            date: new Date(),
            points_earned: pointsEarned,
            points_redeemed: 0,
          },
        ], // Log the points in the history
      });

      alert("Subscription activated and points earned successfully!");

    } catch (err) {
      console.error("Error activating subscription:", err);
      setError("Failed to activate subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Activate Subscription</h2>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <button
          onClick={handleActivateSubscription}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "Activating..." : "Activate Subscription"}
        </button>
      </div>
    </div>
  );
};

export default ActivateSubscription;
