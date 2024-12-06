import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import db from '../firebase'; // Assuming this is your Firebase config

const SoftDrinksTable = () => {
  const [softDrinks, setSoftDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Soft Drinks from Firestore
  const fetchSoftDrinks = async () => {
    try {
      const softDrinksQuery = query(
        collection(db, 'products'),
        where('category', '==', 'Beverages'),
        where('subcategory', '==', 'Soft drinks')
      );
      const querySnapshot = await getDocs(softDrinksQuery);
      const softDrinksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update the stock in Firestore based on stockInUnits and unitsPerCase
      softDrinksList.forEach(async (product) => {
        const updatedStock = Math.floor(product.stockInUnits / product.unitsPerCase);

        // Update Firestore with the new stock value only
        await updateDoc(doc(db, 'products', product.id), {
          stock: updatedStock,
        });
      });

      setSoftDrinks(softDrinksList);
    } catch (error) {
      console.error('Error fetching soft drinks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate stock display format (Case/Bundle and pcs bottle)
  const calculateStockDisplay = (stockInUnits, unitsPerCase) => {
    if (isNaN(stockInUnits) || isNaN(unitsPerCase) || unitsPerCase === 0) {
      return 'Invalid stock data';
    }

    const cases = Math.floor(stockInUnits / unitsPerCase); // Get the number of full cases
    const remainingUnits = stockInUnits % unitsPerCase; // Get the remainder (bottles left after full cases)

    if (remainingUnits > 0) {
      return `${cases} Case/Bundle (${remainingUnits} pcs bottle)`;
    } else {
      return `${cases} Case/Bundle`;
    }
  };

  // Function to handle the search query input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  useEffect(() => {
    fetchSoftDrinks();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  // Filter soft drinks based on the search query
  const filteredSoftDrinks = softDrinks.filter(product =>
    product.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">Soft Drinks Inventory</h2>

      {/* Search Input */}
      <div className="mb-4 flex justify-center">
        <input
          type="text"
          className="w-1/2 p-2 border rounded-lg shadow-sm"
          placeholder="Search by product name..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left border-b">Product Name</th>
              <th className="px-6 py-3 text-left border-b">Brand</th>
              <th className="px-6 py-3 text-left border-b">Price</th>
              <th className="px-6 py-3 text-left border-b">Stock</th>
              <th className="px-6 py-3 text-left border-b">Stock in Units</th>
              <th className="px-6 py-3 text-left border-b">Unit Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredSoftDrinks.map((product) => {
              const stockDisplay = calculateStockDisplay(product.stockInUnits, product.unitsPerCase);

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b">{product.name}</td>
                  <td className="px-6 py-4 border-b">{product.brand}</td>
                  <td className="px-6 py-4 border-b">₱{product.pricing?.pricePerUnit || 'N/A'}</td>
                  <td className="px-6 py-4 border-b">{stockDisplay}</td>
                  <td className="px-6 py-4 border-b">{product.stockInUnits}</td>
                  <td className="px-6 py-4 border-b">{product.unitType}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SoftDrinksTable;
