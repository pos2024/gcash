import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore'; 
import db from '../firebase'; // Import your Firebase config

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      const productSnapshot = await getDocs(collection(db, "products"));
      const productList = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdate = (productId) => {
    console.log('Update product', productId);
  };

  const handleView = (productId) => {
    console.log('View product', productId);
  };

  const handleDelete = (productId) => {
    console.log('Delete product', productId);
  };

  // Filter products based on category and subcategory
  const filteredProducts = products.filter((product) => {
    return (
      (categoryFilter ? product.category === categoryFilter : true) &&
      (subcategoryFilter ? product.subcategory === subcategoryFilter : true)
    );
  });

  // Get unique categories and subcategories for the dropdowns
  const categories = [...new Set(products.map(product => product.category))];
  const subcategories = [...new Set(products.map(product => product.subcategory))];

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-white rounded shadow-lg">
      <h2 className="text-2xl font-semibold text-center mb-6">Product List</h2>

      {/* Filters */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded-md"
          >
            <option value="">Select Category</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded-md"
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((subcategory, index) => (
              <option key={index} value={subcategory}>{subcategory}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <table className="min-w-full table-auto border-collapse border border-gray-300 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Image</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Subcategory</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Brand</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Unit Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Price per Unit</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Wholesale Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Units per Case</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-center">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.subcategory}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.brand}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.unitType}</td>
                <td className="px-6 py-4 text-sm text-gray-600">₱{product.pricing?.pricePerUnit?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">₱{product.wholesalePricing?.pricePerUnit?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.unitsPerCase}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleView(product.id)}
                      className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleUpdate(product.id)}
                      className="px-4 py-2 text-white bg-yellow-500 hover:bg-yellow-600 rounded-md"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductsTable;
