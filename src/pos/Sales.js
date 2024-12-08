import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import db from '../firebase';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalPricePerUnit, setTotalPricePerUnit] = useState(0);
  const [priceDifference, setPriceDifference] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [salesPerPage] = useState(5);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const salesSnapshot = await getDocs(collection(db, 'sales'));
        const salesData = [];

        for (const docSnapshot of salesSnapshot.docs) {
          const sale = docSnapshot.data();
          const saleDate = sale.date.toDate().toLocaleString();

          let productsList = '';
          let totalQuantity = 0;
          let totalPricePerUnitForSale = 0;

          for (const item of sale.products) {
            const productRef = doc(db, 'products', item.productId);
            const productSnapshot = await getDoc(productRef);
            const productData = productSnapshot.data();
            const pricePerUnit = productData?.wholesalePricing?.pricePerUnit || 0;
            totalPricePerUnitForSale += pricePerUnit * item.quantity;
            productsList += `${item.name} (x${item.quantity}), `;
            totalQuantity += item.quantity;
          }

          productsList = productsList.slice(0, -2);

          salesData.push({
            saleDate,
            productsList,
            totalQuantity,
            totalPrice: sale.totalPrice,
            totalPricePerUnit: totalPricePerUnitForSale,
            priceDifference: sale.totalPrice - totalPricePerUnitForSale,
          });
        }

        setSales(salesData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    };

    fetchSalesData();
  }, []);

  useEffect(() => {
    const filtered = sales.filter((sale) => {
      const matchesSearchTerm =
        sale.productsList.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.saleDate.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDateRange =
        (startDate ? new Date(sale.saleDate) >= new Date(startDate) : true) &&
        (endDate ? new Date(sale.saleDate) <= new Date(endDate) : true);

      return matchesSearchTerm && matchesDateRange;
    });

    setFilteredSales(filtered);

    const totalPriceSum = filtered.reduce((acc, sale) => acc + sale.totalPrice, 0);
    const totalPricePerUnitSum = filtered.reduce((acc, sale) => acc + sale.totalPricePerUnit, 0);
    const priceDifferenceSum = totalPriceSum - totalPricePerUnitSum;

    setTotalPrice(totalPriceSum);
    setTotalPricePerUnit(totalPricePerUnitSum);
    setPriceDifference(priceDifferenceSum);
  }, [searchTerm, startDate, endDate, sales]);

  const indexOfLastSale = currentPage * salesPerPage;
  const indexOfFirstSale = indexOfLastSale - salesPerPage;
  const currentSales = filteredSales.slice(indexOfFirstSale, indexOfLastSale);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-6xl bg-gray-50 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Sales List</h1>

        {/* Filters */}
        <div className="mb-4 flex flex-col lg:flex-row justify-between items-center">
          <input
            type="text"
            placeholder="Search by product or date..."
            className="w-full lg:w-1/3 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 lg:mb-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Sale Date</th>
                <th className="px-4 py-2 text-left">Products</th>
                <th className="px-4 py-2 text-left">Total Quantity</th>
                <th className="px-4 py-2 text-left">Total Price</th>
                <th className="px-4 py-2 text-left">Total Price Per Unit</th>
                <th className="px-4 py-2 text-left">Profit</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale, index) => (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-2">{sale.saleDate}</td>
                  <td className="px-4 py-2">{sale.productsList}</td>
                  <td className="px-4 py-2 text-center">{sale.totalQuantity}</td>
                  <td className="px-4 py-2 text-center">₱{sale.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">₱{sale.totalPricePerUnit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center text-green-600 font-bold">
                    ₱{sale.priceDifference.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          {Array.from({ length: Math.ceil(filteredSales.length / salesPerPage) }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 ${
                currentPage === index + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 hover:bg-gray-400'
              } rounded-lg`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-6">
          <div className="flex justify-between text-lg">
            <span>Total of Total Price:</span>
            <span className="font-bold">₱{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Total of Total Price Per Unit:</span>
            <span className="font-bold">₱{totalPricePerUnit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg text-green-600">
            <span>Profit:</span>
            <span className="font-bold">₱{priceDifference.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
