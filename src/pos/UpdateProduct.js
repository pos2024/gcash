import React, { useState, useEffect } from 'react';
import db from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';

const UpdateProduct = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBeverages = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), where('category', '==', 'Beverages'));
      const querySnapshot = await getDocs(q);
      const beverages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(beverages);
    } catch (err) {
      setError('Failed to fetch products.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateClick = (product) => {
    setSelectedProduct({ ...product });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleFieldChange = (field, value) => {
    setSelectedProduct({ ...selectedProduct, [field]: value });
  };

  const handleBulkPricingChange = (index, field, value) => {
    const updatedBulkPricing = selectedProduct.bulkPricing.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    setSelectedProduct({ ...selectedProduct, bulkPricing: updatedBulkPricing });
  };

  const handleAddBulkPricing = () => {
    setSelectedProduct({
      ...selectedProduct,
      bulkPricing: [...(selectedProduct.bulkPricing || []), { quantity: '', price: '', description: '' }],
    });
  };

  const handleRemoveBulkPricing = (index) => {
    const updatedBulkPricing = selectedProduct.bulkPricing.filter((_, i) => i !== index);
    setSelectedProduct({ ...selectedProduct, bulkPricing: updatedBulkPricing });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productRef = doc(db, 'products', selectedProduct.id);
      await updateDoc(productRef, selectedProduct);
      alert('Product updated successfully!');
      fetchBeverages(); // Refresh the product list
      handleCloseModal();
    } catch (err) {
      setError('Failed to update product.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeverages();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-semibold text-center mb-6">Manage Beverages</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Category</th>
              <th className="border border-gray-300 p-2">Brand</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="border border-gray-300 p-2">{product.name}</td>
                <td className="border border-gray-300 p-2">{product.category}</td>
                <td className="border border-gray-300 p-2">{product.brand}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => handleUpdateClick(product)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for Updating Product */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96 overflow-y-auto max-h-screen">
            <h3 className="text-lg font-semibold mb-4">Update Product</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={selectedProduct.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <input
                    type="text"
                    value={selectedProduct.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Brand</label>
                  <input
                    type="text"
                    value={selectedProduct.brand}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium">Price Per Unit</label>
                  <input
                    type="number"
                    value={selectedProduct.pricePerUnit}
                    onChange={(e) => handleFieldChange('pricePerUnit', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                {/* Bulk Pricing */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Bulk Pricing</h4>
                  {selectedProduct.bulkPricing?.map((bulk, index) => (
                    <div key={index} className="space-y-2">
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={bulk.quantity}
                        onChange={(e) =>
                          handleBulkPricingChange(index, 'quantity', e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={bulk.price}
                        onChange={(e) =>
                          handleBulkPricingChange(index, 'price', e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={bulk.description}
                        onChange={(e) =>
                          handleBulkPricingChange(index, 'description', e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                        onClick={() => handleRemoveBulkPricing(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="bg-green-500 text-white px-4 py-2 rounded mt-4"
                    onClick={handleAddBulkPricing}
                  >
                    Add Bulk Pricing
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-500 text-white px-4 py-2 rounded"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full bg-gray-500 text-white px-4 py-2 mt-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProduct;
