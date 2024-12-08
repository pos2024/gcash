import React, { useState } from 'react';

const CustomBundle = ({ softDrinks, addCustomBundleToCart }) => {
  const [customBundle, setCustomBundle] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const addToCustomBundle = (product) => {
    setCustomBundle((prevBundle) => {
      const existingProductIndex = prevBundle.findIndex((item) => item.id === product.id);

      const updatedBundle = existingProductIndex >= 0
        ? prevBundle.map((item, index) => {
          if (index === existingProductIndex) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        })
        : [...prevBundle, { ...product, quantity: 1 }];

      const updatedBundleWithPrice = updatedBundle.map((item) => {
        const pricePerUnit = parseFloat(item.pricing?.bulkPricing[0]?.bulkPricePerUnit || 0);
        const quantity = parseInt(item.quantity, 10) || 0;
        return { ...item, price: pricePerUnit * quantity };
      });

      const newTotalPrice = updatedBundleWithPrice.reduce((acc, item) => acc + (item.price || 0), 0);
      setTotalPrice(newTotalPrice);

      return updatedBundleWithPrice;
    });
  };

  const confirmCustomBundle = () => {
    if (!Array.isArray(customBundle) || customBundle.length === 0) {
      alert('Custom bundle is invalid or empty!');
      return;
    }

    const bundleData = {
      isBundle: true,
      view: 'customBundle',
      components: customBundle.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      })),
      combinedName: customBundle.map((item) => item.name).join(' + '),
      totalPrice: totalPrice,
    };

    addCustomBundleToCart(bundleData);
    setCustomBundle([]);
    setTotalPrice(0);
    alert('Custom Bundle Confirmed and added to Cart!');
  };

  return (
    <div className="w-max flex space-x-4">
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Select Soft Drinks for Custom Bundle
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {softDrinks.map((product) => (
            <div
              key={product.id}
              className="flex flex-col items-start p-4 border rounded-md shadow-md bg-gray-50 hover:bg-gray-100"
            >
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-xl font-semibold text-blue-600">
                ₱{parseFloat(product.pricing?.bulkPricing[0]?.bulkPricePerUnit || 0).toFixed(2)}
              </p>
              <button
                onClick={() => addToCustomBundle(product)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
              >
                Add to Custom Bundle
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mt-8">Custom Bundle Contents</h3>
        <div className="space-y-4 mt-4">
          {customBundle.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-md shadow-md bg-white"
            >
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  ₱{parseFloat(item.pricing?.bulkPricing[0]?.bulkPricePerUnit || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {customBundle.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold">Combined Name:</h4>
            <p>{customBundle.map((item) => item.name).join(' + ')}</p>
            <h4 className="text-lg font-semibold mt-2">Total Price:</h4>
            <p>₱{totalPrice.toFixed(2)}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={confirmCustomBundle}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Confirm Custom Bundle
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomBundle;
