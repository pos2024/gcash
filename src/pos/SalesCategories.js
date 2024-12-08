import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../firebase';

const SalesCategories = () => {
  const [salesCategories, setSalesCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchSalesCategories = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const salesData = [];

        const beverageProducts = productsSnapshot.docs.filter((docSnapshot) => {
          const product = docSnapshot.data();
          return product.category === 'Beverages';
        });

        for (const docSnapshot of beverageProducts) {
          const product = docSnapshot.data();
          const productName = product.name;
          const productImage = product.imageUrl || '';
          let totalQuantity = 0;
          let totalPrice = 0;
          let totalPricePerUnit = 0;
          let profit = 0;

          const salesSnapshot = await getDocs(collection(db, 'sales'));
          salesSnapshot.docs.forEach((saleDoc) => {
            const sale = saleDoc.data();
            const productInSale = sale.products.find(
              (item) => item.productId === docSnapshot.id
            );

            if (productInSale) {
              const saleDate = sale.date.toDate(); // Convert Firebase timestamp to JS Date
              if (
                (!startDate || saleDate >= new Date(startDate)) &&
                (!endDate || saleDate <= new Date(endDate))
              ) {
                const pricePerUnit = product.wholesalePricing?.pricePerUnit || 0;
                const quantitySold = productInSale.quantity;
                const saleTotalPrice = productInSale.price * quantitySold;

                totalQuantity += quantitySold;
                totalPrice += saleTotalPrice;
                totalPricePerUnit += pricePerUnit * quantitySold;
              }
            }
          });

          profit = totalPrice - totalPricePerUnit;

          salesData.push({
            productName,
            productImage,
            totalQuantity,
            totalPrice,
            totalPricePerUnit,
            profit,
          });
        }

        salesData.sort((a, b) => b.profit - a.profit);
        setSalesCategories(salesData);
        setFilteredCategories(salesData); // Initialize filtered data
      } catch (error) {
        console.error('Error fetching sales categories data:', error);
      }
    };

    fetchSalesCategories();
  }, [startDate, endDate]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === '') {
      setFilteredCategories(salesCategories);
    } else {
      const filtered = salesCategories.filter((category) =>
        category.productName.toLowerCase().includes(query)
      );
      setFilteredCategories(filtered);
    }

    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-6xl bg-gray-50 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Sales Categories (Beverages)</h1>

        {/* Filters */}
        <div className="mb-4 flex flex-col lg:flex-row justify-between items-center">
          {/* Search Bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by product name..."
            className="w-full lg:w-1/3 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 lg:mb-0"
          />
          {/* Date Filters */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">Product Name</th>
                <th className="px-4 py-2 text-left">Total Quantity</th>
                <th className="px-4 py-2 text-left">Total Price</th>
                <th className="px-4 py-2 text-left">Total Price Per Unit</th>
                <th className="px-4 py-2 text-left">Profit</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((category, index) => (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-2">
                    {category.productImage ? (
                      <img
                        src={category.productImage}
                        alt={category.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <span>No Image</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{category.productName}</td>
                  <td className="px-4 py-2 text-center">{category.totalQuantity}</td>
                  <td className="px-4 py-2 text-center">₱{category.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">₱{category.totalPricePerUnit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center text-green-600 font-bold">
                    ₱{category.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesCategories;
