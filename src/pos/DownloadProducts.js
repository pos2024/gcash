import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import db from '../firebase'; // Importing db

const DownloadProducts = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Function to handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Function to handle file upload for products
  const handleUpload = async (collectionName) => {
    if (!file) {
      alert('Please select a JSON file.');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Parse the JSON file content
        const data = JSON.parse(e.target.result);

        // Ensure data is an array and log it
        if (!Array.isArray(data)) {
          throw new Error('Invalid JSON format. Expected an array of objects.');
        }

        console.log('Uploading data:', data);  // Log the data for debugging

        // Insert data into Firestore collection
        const collectionRef = collection(db, collectionName);

        for (const item of data) {
          if (item && typeof item === 'object') {
            await addDoc(collectionRef, item); // Adding each item to the collection
          } else {
            console.error('Invalid item in data:', item);
          }
        }

        alert(`${collectionName} uploaded successfully!`);
      } catch (error) {
        console.error('Error uploading data:', error);
        alert(`Error uploading data: ${error.message}`);
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading the file:', error);
      alert('Error reading the file. Please try again with a valid JSON file.');
      setUploading(false);
    };

    reader.readAsText(file);
  };

  // Function to download the collection as JSON
  const downloadCollection = async (collectionName) => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(jsonBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading collection:', error);
    }
  };

  return (
    <div className="flex justify-center items-center p-6">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Download / Upload Products Collection</h1>

        <div className="space-y-4">
          {/* Download Button for Products */}
          <button
            onClick={() => downloadCollection('products')}
            className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Download Products Collection
          </button>

          {/* File Upload Section for Products */}
          <div className="space-y-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="p-2 border rounded w-full"
            />
            <button
              onClick={() => handleUpload('products')}
              className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Products Collection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadProducts;
