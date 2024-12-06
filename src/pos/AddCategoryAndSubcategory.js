import React, { useState } from 'react';
import { collection, doc, setDoc,getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import db from '../firebase'; // Your Firestore configuration

const AddCategoryAndSubcategory = () => {
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    const categorySnapshot = await getDocs(collection(db, "categories"));
    const categoriesList = categorySnapshot.docs.map(doc => doc.id);
    setCategories(categoriesList);
  };

  // Add new category
  const addCategory = async () => {
    if (categoryName.trim() === '') {
      setError('Category name cannot be empty');
      return;
    }
    const newCategoryRef = doc(db, 'categories', categoryName);
    await setDoc(newCategoryRef, { subcategories: [] });
    fetchCategories(); // Refresh categories list after adding
    setCategoryName('');
    setError('');
  };

  // Add subcategory to the selected category
  const addSubcategory = async () => {
    if (subcategoryName.trim() === '' || !selectedCategory) {
      setError('Subcategory name or category is missing');
      return;
    }
    const categoryRef = doc(db, 'categories', selectedCategory);
    await updateDoc(categoryRef, {
      subcategories: arrayUnion(subcategoryName)
    });
    setSubcategoryName('');
    setError('');
  };

  // Call fetchCategories when the component mounts
  React.useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Add Category & Subcategory</h2>
      <div className="space-y-4">
        {/* Add Category Form */}
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium">Category Name</label>
          <input
            id="categoryName"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={addCategory}
            className="mt-2 w-full py-2 px-4 bg-blue-500 text-white rounded-md"
          >
            Add Category
          </button>
        </div>

        {/* Add Subcategory Form */}
        <div>
          <label htmlFor="selectedCategory" className="block text-sm font-medium">Select Category</label>
          <select
            id="selectedCategory"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a Category</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subcategoryName" className="block text-sm font-medium">Subcategory Name</label>
          <input
            id="subcategoryName"
            type="text"
            value={subcategoryName}
            onChange={(e) => setSubcategoryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={addSubcategory}
            className="mt-2 w-full py-2 px-4 bg-green-500 text-white rounded-md"
          >
            Add Subcategory
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default AddCategoryAndSubcategory;
