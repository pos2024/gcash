import React, { useState } from 'react';

const CustomBundle = ({ softDrinks, addCustomBundleToCart }) => {
    const [customBundle, setCustomBundle] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
  
    // Add product to the custom bundle or update quantity if it already exists
    const addToCustomBundle = (product) => {
        setCustomBundle((prevBundle) => {
          const existingProductIndex = prevBundle.findIndex(item => item.id === product.id);
          let updatedBundle = [...prevBundle];
          
          if (existingProductIndex >= 0) {
            updatedBundle[existingProductIndex].quantity += 1;
          } else {
            updatedBundle.push({ ...product, quantity: 1 });
          }
      
          // Ensure price calculation for each item in the custom bundle
          updatedBundle = updatedBundle.map(item => {
            const pricePerUnit = item.pricing?.bulkPricing[0]?.bulkPricePerUnit || 0; // Fallback to 0 if not found
            item.price = pricePerUnit * item.quantity;  // Calculate the price for the quantity
            return item;
          });
      
          // Recalculate total price for the bundle
          const newTotalPrice = updatedBundle.reduce((acc, item) => acc + (item.price || 0), 0);
          setTotalPrice(newTotalPrice);
      
          return updatedBundle;
        });
      };
      
    // Confirm the custom bundle and pass the content to the parent cart
    const confirmCustomBundle = () => {
      addCustomBundleToCart(customBundle); // Add the custom bundle content to the cart
      alert('Custom Bundle Confirmed and added to Cart!');
    };
  
    // Combine the names of the items in the custom bundle
    const combinedNames = customBundle.map(item => item.name).join(' + ');
  
    return (
      <div className="w-max">
        <h2 className="text-2xl font-semibold mb-6 text-center">Select Soft Drinks for Custom Bundle</h2>
        
        {/* Display Soft Drinks in a two-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {softDrinks.map((product) => (
            <div key={product.id} className="flex flex-col items-start p-4 border rounded-md shadow-md bg-gray-50 hover:bg-gray-100">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-xl font-semibold text-blue-600">₱{product.pricing?.bulkPricing[0]?.bulkPricePerUnit}</p>
              <button
                onClick={() => addToCustomBundle(product)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
              >
                Add to Custom Bundle
              </button>
            </div>
          ))}
        </div>
  
        {/* Display Custom Bundle Items */}
        <h3 className="text-lg font-semibold mt-8">Custom Bundle Contents</h3>
        <div className="space-y-4 mt-4">
          {customBundle.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-md shadow-md bg-white">
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-600">₱{item.pricing?.bulkPricing[0]?.bulkPricePerUnit}</p>
                <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
  
        {/* Display Combined Names and Total Price */}
        {customBundle.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold">Combined Name:</h4>
            <p>{combinedNames}</p>
            <h4 className="text-lg font-semibold mt-2">Total Price:</h4>
            <p>₱{totalPrice.toFixed(2)}</p>
          </div>
        )}
  
        {/* Confirm Custom Bundle Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={confirmCustomBundle}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Confirm Custom Bundle
          </button>
        </div>
      </div>
    );
  };
  
  export default CustomBundle;
  