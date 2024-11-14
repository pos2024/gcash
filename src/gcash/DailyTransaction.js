import React, { useEffect, useState } from "react";
import db from "../firebase";
import { collection, query, where, orderBy, getDocs, addDoc } from "firebase/firestore";
import { format } from "date-fns";

const DailyTransaction = () => {
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [isSaving, setIsSaving] = useState(false); // For button loading state

  // Function to fetch and update today's transaction data
  const updateDailyTransaction = async () => {
    const today = new Date();
    
    // Set the start and end of the day to query today's transactions
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0); // Start of today
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999); // End of today

    // Firestore reference to transactions
    const transactionsRef = collection(db, "transactions");
    const transactionsQuery = query(
      transactionsRef,
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<=", endOfDay)
    );

    // Fetch transactions for today
    const transactionsSnapshot = await getDocs(transactionsQuery);

    let totalFee = 0;
    let cashFund = 0;
    let gcashFund = 0;

    // Debugging: Log the total number of documents found
    console.log(`Found ${transactionsSnapshot.size} transactions for today.`);

    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Debugging: Log the transaction data for each document
      console.log(`Transaction data: ${JSON.stringify(data)}`);

      totalFee += data.fee || 0;
      cashFund += data.cashFund || 0;
      gcashFund += data.gcashFund || 0;
    });

    // If no transactions were found, log a message or handle accordingly
    if (transactionsSnapshot.empty) {
      console.log("No transactions found for today.");
    }

    // Save the daily totals to Firestore
    try {
      await addDoc(collection(db, "dailyupdate"), {
        date: today,
        totalFee,
        cashFund,
        gcashFund,
      });
      console.log("Today's transaction data has been updated.");
    } catch (error) {
      console.error("Error saving daily update:", error);
    }

    // Refresh the daily updates after saving
    fetchDailyUpdates();
  };

  // Function to load daily updates into state
  const fetchDailyUpdates = async () => {
    const dailyUpdateRef = collection(db, "dailyupdate");
    const dailyUpdateQuery = query(dailyUpdateRef, orderBy("date", "desc"));
    const snapshot = await getDocs(dailyUpdateQuery);

    const updates = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date.toDate(), // Convert Firestore timestamp to JS Date
        totalFee: data.totalFee,
        cashFund: data.cashFund,
        gcashFund: data.gcashFund,
      };
    });
    setDailyUpdates(updates);
  };

  // Trigger daily transaction update on button click
  const handleSaveClick = async () => {
    setIsSaving(true);
    await updateDailyTransaction();
    setIsSaving(false);
  };

  useEffect(() => {
    fetchDailyUpdates(); // Load the daily updates when the component mounts
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Daily Transaction Summary</h2>

      {/* Button to manually save today's transaction data */}
      <div className="text-center mb-6">
        <button
          onClick={handleSaveClick}
          className={`py-2 px-4 rounded-lg bg-blue-500 text-white ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Today's Transactions"}
        </button>
      </div>

      {/* Display today's total fee if available */}
      <div className="mb-6 text-center">
        <p className="text-xl font-semibold">
          Today's Total Fee: ₱{dailyUpdates.length > 0 ? dailyUpdates[0].totalFee.toLocaleString() : 0}
        </p>
      </div>

      {/* Table of all daily updates */}
      <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-left text-gray-600 uppercase text-sm">
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Total Fee</th>
            <th className="py-3 px-4">Cash Fund</th>
            <th className="py-3 px-4">GCash Fund</th>
          </tr>
        </thead>
        <tbody>
          {dailyUpdates.map(({ id, date, totalFee, cashFund, gcashFund }) => (
            <tr key={id} className="border-b text-gray-700">
              <td className="py-3 px-4">{format(date, "MMMM d, yyyy")}</td>
              <td className="py-3 px-4">₱{totalFee.toLocaleString()}</td>
              <td className="py-3 px-4">₱{cashFund.toLocaleString()}</td>
              <td className="py-3 px-4">₱{gcashFund.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyTransaction;
