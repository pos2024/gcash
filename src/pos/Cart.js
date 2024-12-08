import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, orderBy,query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import db from '../firebase';
import CustomBundle from './CustomBundle';
import bg from '../assets/back2.png'

const Cart = () => {
  const [softDrinks, setSoftDrinks] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('perPcs');
  const [customQuantity, setCustomQuantity] = useState({}); // Store custom quantities by product ID


  const addCustomBundleToCart = (customBundleContent) => {
    const combinedName = customBundleContent
      .map(item => item.name)
      .join(' + ');

    const totalPrice = customBundleContent.reduce((acc, item) => {
      const itemPrice = parseFloat(item.price);  // Ensure it's parsed as a number
      console.log('Item Price:', itemPrice);  // Log item price to check if it’s 0
      return acc + (isNaN(itemPrice) ? 0 : itemPrice); // Avoid NaN if price is invalid
    }, 0);

    const totalQuantity = customBundleContent.reduce((acc, item) => acc + item.quantity, 0);

    const updatedCart = [
      {
        combinedName,
        totalPrice,
        quantity: totalQuantity,
      },
    ];

    setCart(prevCart => [...prevCart, ...updatedCart]);
  };






  // Fetch Soft Drinks from Firestore
  const fetchSoftDrinks = async () => {
    try {
      const softDrinksQuery = query(
        collection(db, 'products'),
        where('category', '==', 'Beverages'),
        where('subcategory', 'in', ['Soft drinks', 'Beer']),

  orderBy('category', 'asc'),
  orderBy('purchaseCount', 'desc')
      
      );
      const querySnapshot = await getDocs(softDrinksQuery);
      const softDrinksList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Product Data:', data); // Debugging data from Firestore
        return {
          id: doc.id,
          ...data,
        };
      });
      console.log(softDrinksList);
      setSoftDrinks(softDrinksList);
    } catch (error) {
      console.error('Error fetching soft drinks:', error);
    }
  };


  useEffect(() => {
    fetchSoftDrinks();
  }, []);

  // Toggle view
  const toggleView = (viewType) => {
    setView(viewType);
  };




  const addToCart = (product) => {
    console.log('Product:', product); // Check the product being added
    let priceToAdd = 0;
    let quantityToAdd = 1;
    let combinedName = product.name; // Default name
    let isBundle = false;

    if (view === 'perPcs') {
      priceToAdd = parseFloat(product.pricing?.pricePerUnit) || 0;
      console.log('Price per unit (perPcs):', priceToAdd); // Debugging price per unit
    } else if (view === 'perBundle') {
      isBundle = true;
      const bulkPricing = product.pricing?.bulkPricing[0]; // Get bulk pricing details
      if (bulkPricing) {
        const bulkPricePerUnit = parseFloat(bulkPricing.bulkPricePerUnit) || 0; // Price per unit for bulk
        const quantityInBundle = parseInt(bulkPricing.quantity, 10) || 1; // Quantity in the bundle

        priceToAdd = bulkPricePerUnit; // Set price per unit for bulk
        quantityToAdd = quantityInBundle; // Set quantity to the number of items in the bundle

        combinedName = `${product.name} (Bundle of ${quantityInBundle})`; // Display the bundle details

        console.log('Bulk Price Per Unit:', priceToAdd); // Debugging bulk price per unit
        console.log('Quantity in Bundle:', quantityToAdd); // Debugging bundle quantity
      }
    } else if (view === 'customBundle') {
      isBundle = true;
      const bulkPricing = product.pricing?.bulkPricing[0]; // Get bulk pricing details
      if (bulkPricing) {
        const bulkPricePerUnit = parseFloat(bulkPricing.bulkPricePerUnit) || 0; // Price per unit for bulk

        priceToAdd = bulkPricePerUnit; // Set price per unit for bulk
        quantityToAdd = 1; // Always add 1 quantity to the cart

        combinedName = `${product.name} (Custom Bundle)`; // Display the custom bundle details

        console.log('Custom Bundle Price Per Unit:', priceToAdd); // Debugging custom bundle price per unit
      }
    }

    if (quantityToAdd <= 0 || isNaN(priceToAdd)) {
      alert('Please enter valid pricing and quantity.');
      return;
    }

    const totalPriceToAdd = priceToAdd * quantityToAdd; // Calculate the total price based on bulk price and quantity
    console.log('Total Price to Add:', totalPriceToAdd); // Debugging total price

    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id && item.isBundle === isBundle);
      console.log('Existing Product:', existingProduct); // Debugging existing product search

      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id && item.isBundle === isBundle
            ? {
              ...item,
              quantity: item.quantity + quantityToAdd, // Increment quantity
              totalPrice: item.totalPrice + totalPriceToAdd, // Update total price
            }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            ...product,
            isBundle,
            combinedName,
            price: priceToAdd, // Store bulk price per unit
            quantity: quantityToAdd, // Store total quantity
            totalPrice: totalPriceToAdd, // Store the total price
          },
        ];
      }
    });
  };




  const updateQuantity = (productId, type) => {
    setCart(cart.map(item =>
      item.id === productId
        ? {
            ...item,
            quantity: type === 'increase' ? item.quantity + 1 : Math.max(item.quantity - 1, 1),
            totalPrice: (type === 'increase'
              ? item.totalPrice + item.price
              : Math.max(item.totalPrice - item.price, item.price)), // Recalculate totalPrice
          }
        : item
    ));
  };

  // Remove Item from Cart
  const removeItem = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Proceed to Checkout
  const proceedToCheckout = async () => {
    try {
      // Fix totalPrice calculation: Sum up item totalPrice directly
      const totalPrice = cart.reduce((total, item) => {
        return total + (parseFloat(item?.totalPrice) || 0);  // Just sum totalPrice
      }, 0);
  
      const saleData = {
        products: cart.map(item => ({
          productId: item.id || 'N/A',
          name: item.combinedName || item.name || 'Unnamed Product',
          price: item.price || 0,
          quantity: item.quantity || 1,
        })),
        totalPrice: totalPrice,
        date: new Date(),
        status: 'pending',
      };
  
      const salesRef = collection(db, 'sales');
      await addDoc(salesRef, saleData);
  
      // Update purchaseCount and stockInUnits for each item
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
  
        // Get the current product data
        const productSnapshot = await getDoc(productRef);
        const productData = productSnapshot.data();
        
        // Get the current purchaseCount and stockInUnits
        const currentPurchaseCount = productData?.purchaseCount || 0;
        const stockInUnits = parseFloat(productData?.stockInUnits) || 0;
        
        // Calculate the new purchaseCount (add quantity purchased)
        const newPurchaseCount = currentPurchaseCount + (parseInt(item.quantity) || 0);
  
        // Decrease stock based on the quantity purchased
        await updateDoc(productRef, {
          stockInUnits: stockInUnits - (parseInt(item.quantity) || 0),
          purchaseCount: newPurchaseCount,
        });
      }
  
      setCart([]);
    
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      alert('There was an error during checkout.');
    }
  };
  


  return (
    <div className='bg-gray-200 h-screen '>



      <div className="flex ">

      <div className="w-1/3 h-screen bg-gradient-to-r from-[#623288] to-[#4B0082] p-4">
  <h2 className="text-xl font-semibold text-white mb-4">Your Cart</h2>
  {cart.length === 0 ? (
    <p className="text-white">Your cart is empty.</p>
  ) : (
    <div className="bg-white p-4 rounded-md shadow-md">
      {cart.map((item, index) => (
        <div key={item.combinedName + index} className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-full"
            />
            <div className="ml-4">
              <p className="text-lg font-semibold text-gray-800">{item.combinedName || item.name}</p>
              <p className="text-gray-600">
                ₱{!isNaN(item.totalPrice) ? item.totalPrice.toFixed(2) : '0.00'} total
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateQuantity(item.id, 'decrease')}
              className="px-2 py-1 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400"
            >
              -
            </button>
            <span>{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, 'increase')}
              className="px-2 py-1 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400"
            >
              +
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="mt-4">
      <p className="text-xl text-green-500 font-semibold">
                  Total: ₱
                  {cart.reduce((total, item) => {
                    const itemTotalPrice = isNaN(item.totalPrice) ? 0 : item.totalPrice; // Use the total price directly
                    return total + itemTotalPrice;
                  }, 0).toFixed(2)}
                </p>

        <button
          onClick={proceedToCheckout}
          className="mt-4 w-full py-2 bg-[#623288] text-white rounded-md hover:bg-[#4B0082]"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )}
</div>
        
      <div className="w-full p-2 h-auto" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
  <div className="flex space-x-4 mb-6">
    <button
      onClick={() => toggleView('perPcs')}
      className={`px-6 py-3 rounded-lg transition-all duration-300 ${view === 'perPcs' ? 'bg-[#623288] text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-[#4B0082]'}`}
    >
      Per Pcs
    </button>
    <button
      onClick={() => toggleView('perBundle')}
      className={`px-6 py-3 rounded-lg transition-all duration-300 ${view === 'perBundle' ? 'bg-[#623288] text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-[#4B0082]'}`}
    >
      Per Bundle/Case
    </button>
    <button
      onClick={() => toggleView('customBundle')}
      className={`px-6 py-3 rounded-lg transition-all duration-300 ${view === 'customBundle' ? 'bg-[#623288] text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-[#4B0082]'}`}
    >
      Custom Case
    </button>
  </div>

  {/* Display for perPcs and perBundle view */}
  {(view === 'perPcs' || view === 'perBundle') && (
  <div className="grid grid-cols-6 gap-2">
    {softDrinks.map((product) => {
      let priceText = '';

      if (view === 'perPcs') {
        priceText = `₱${product.pricing?.pricePerUnit} per ${product.unitType}`;
      } else if (view === 'perBundle') {
        const bulkPricing = product.pricing?.bulkPricing[0];
        priceText = bulkPricing ? `₱${bulkPricing.bulkPricePerUnit} per ${bulkPricing.description}` : '';
      }

      return (
        <div key={product.id} className="bg-[#1a1818] rounded-md p-4 text-center text-white">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-32 h-32 object-cover mx-auto" // Adjusted size and style
          />
          <h3 className="mt-2 text-md font-semibold">{product.name}</h3>
        
          <button
            onClick={() => addToCart(product)}
            className="mt-2 px-4 py-2 bg-[#623288] text-white text-xs rounded-md hover:bg-[#4B0082]"
          >
            Add to Cart
          </button>
        </div>
      );
    })}
  </div>
)}


  {/* Display for customBundle view */}
  {view === 'customBundle' && (
  <>
    {/* Liter Grid (products with unitsPerCase === 12) */}
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-white">Liter</h3>
      <div className="grid grid-cols-4 gap-4">
        {softDrinks
          .filter((product) => product.unitType === 'Bottle' && product.unitsPerCase === 12)
          .map((product) => {
            let priceText = 'Custom Quantity';

            return (
              <div key={product.id} className="bg-[#1a1818] rounded-md p-4 text-center text-white">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-32 h-32 object-cover mx-auto" // Adjusted size and removed rounded-full
                />
                <h3 className="mt-2 text-md font-semibold">{product.name}</h3>
                <button
                  onClick={() => addToCart(product)}
                  className="mt-2 px-4 py-2 bg-[#623288] text-white text-xs rounded-md hover:bg-[#4B0082]"
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
      </div>
    </div>

    {/* Onz Grid (products with unitsPerCase === 24) */}
    <div>
      <h3 className="text-lg font-semibold text-white">Onz</h3>
      <div className="grid grid-cols-4 gap-4">
        {softDrinks
          .filter((product) => product.unitType === 'Bottle' && product.unitsPerCase === 24)
          .map((product) => {
            let priceText = 'Custom Quantity';

            return (
              <div key={product.id} className="bg-[#1a1818] rounded-md p-4 text-center text-white">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-32 h-32 object-cover mx-auto" // Adjusted size and removed rounded-full
                />
                <h3 className="mt-2 text-md font-semibold">{product.name}</h3>
                <button
                  onClick={() => addToCart(product)}
                  className="mt-2 px-4 py-2 bg-[#623288] text-white text-xs rounded-md hover:bg-[#4B0082]"
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
      </div>
    </div>
  </>
)}

</div>








      </div>




    </div>
  );
};

export default Cart;
