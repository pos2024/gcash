import React, { useState, useEffect } from 'react';
import db from '../firebase';
import { collection, addDoc, writeBatch, Timestamp, getDocs, doc, getDoc } from 'firebase/firestore';

const AddProduct = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [unitType, setUnitType] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [bulkPricing, setBulkPricing] = useState([{ quantity: '', price: '', description: '' }]);
  const [wholesalePricing, setWholesalePricing] = useState({ pricePerUnit: '' });
  const [stock, setStock] = useState('');
  const [unitsPerCase, setUnitsPerCase] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSoldByPiece, setIsSoldByPiece] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const fetchCategories = async () => {
    const categorySnapshot = await getDocs(collection(db, 'categories'));
    const categoriesList = categorySnapshot.docs.map(doc => doc.id);
    setCategories(categoriesList);
  };

  const fetchSubcategories = async (category) => {
    if (!category) return;
    const categoryRef = doc(db, 'categories', category);
    const categoryDoc = await getDoc(categoryRef);
    const subcategoriesList = categoryDoc.exists() ? categoryDoc.data().subcategories : [];
    setSubcategories(subcategoriesList);
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    fetchSubcategories(selectedCategory);
  };

  const handleBulkPricingChange = (index, field, value) => {
    const updatedBulkPricing = [...bulkPricing];
    updatedBulkPricing[index][field] = value;
    updatedBulkPricing[index].bulkPricePerUnit = 
      updatedBulkPricing[index].price && updatedBulkPricing[index].quantity
        ? (parseFloat(updatedBulkPricing[index].price) / parseInt(updatedBulkPricing[index].quantity)).toFixed(2)
        : '';
    setBulkPricing(updatedBulkPricing);
  };

  const handleAddBulkPricing = () => {
    setBulkPricing([...bulkPricing, { quantity: '', price: '', description: '', bulkPricePerUnit: '' }]);
  };

  const handleRemoveBulkPricing = (index) => {
    const updatedBulkPricing = bulkPricing.filter((_, i) => i !== index);
    setBulkPricing(updatedBulkPricing);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);
      const productRef = collection(db, 'products');
      const stockInUnits = isSoldByPiece ? parseInt(stock) : parseInt(stock) * parseInt(unitsPerCase);

      const newProduct = {
        name,
        category,
        subcategory,
        brand,
        unitType,
        pricing: {
          pricePerUnit: parseFloat(pricePerUnit),
          bulkPricing
        },
        wholesalePricing: {
          pricePerUnit: parseFloat(wholesalePricing.pricePerUnit)
        },
        stock: parseInt(stock),
        unitsPerCase: isSoldByPiece ? 1 : parseInt(unitsPerCase),
        stockInUnits,
        imageUrl,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(productRef, newProduct);
      batch.commit();

      setLoading(false);
      setName('');
      setCategory('');
      setSubcategory('');
      setBrand('');
      setUnitType('');
      setPricePerUnit('');
      setBulkPricing([{ quantity: '', price: '', description: '' }]);
      setWholesalePricing({ pricePerUnit: '' });
      setStock('');
      setUnitsPerCase('');
      setImageUrl('');
      setIsSoldByPiece(false);
      alert('Product added successfully!');
    } catch (error) {
      setLoading(false);
      setError('Error adding product');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow-lg">
      <h2 className="text-2xl font-semibold text-center mb-6">Add New Product</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subcategory</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              disabled={!category}
            >
              <option value="">Select Subcategory</option>
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Type</label>
            <input
              type="text"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price Per Unit</label>
            <input
              type="number"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bulk Pricing</label>
            {bulkPricing.map((bulk, index) => (
              <div key={index} className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={bulk.quantity}
                    onChange={(e) => handleBulkPricingChange(index, 'quantity', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={bulk.price}
                    onChange={(e) => handleBulkPricingChange(index, 'price', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={bulk.description}
                    onChange={(e) => handleBulkPricingChange(index, 'description', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <span className="p-2 text-gray-600">
                    {bulk.bulkPricePerUnit ? `₱${bulk.bulkPricePerUnit} / unit` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBulkPricing(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddBulkPricing}
              className="bg-green-500 text-white p-2 rounded mt-2"
            >
              Add Bulk Pricing
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Wholesale Pricing</label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Price Per Unit"
                value={wholesalePricing.pricePerUnit}
                onChange={(e) => setWholesalePricing({ ...wholesalePricing, pricePerUnit: e.target.value })}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Units per Case</label>
            <input
              type="number"
              value={unitsPerCase}
              onChange={(e) => setUnitsPerCase(e.target.value)}
              required={!isSoldByPiece}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
              disabled={isSoldByPiece}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sold by Piece</label>
            <input
              type="checkbox"
              checked={isSoldByPiece}
              onChange={() => setIsSoldByPiece(!isSoldByPiece)}
              className="mt-1 p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`mt-4 w-full p-2 ${loading ? 'bg-gray-400' : 'bg-blue-500'} text-white font-semibold rounded`}
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
