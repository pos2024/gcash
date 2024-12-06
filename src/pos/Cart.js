import { useState, useEffect } from 'react';
import { collection, getDocs,getDoc, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import db from '../firebase'; 
import CustomBundle from './CustomBundle';

const Cart = () => {
  const [softDrinks, setSoftDrinks] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('perPcs');
  const [customQuantity, setCustomQuantity] = useState({}); // Store custom quantities by product ID
  const [isCustomBundleModalOpen, setIsCustomBundleModalOpen] = useState(false);

  const addCustomBundleToCart = (customBundleContent) => {
    const combinedName = customBundleContent
      .map(item => item.name)  // Extract the names of the items
      .join(' + ');  // Combine them with ' + '
  
    const totalPrice = customBundleContent.reduce((acc, item) => acc + item.price, 0); // Sum the prices for total price
  
    const updatedCart = [
      {
        combinedName,
        totalPrice,
        quantity: customBundleContent.reduce((acc, item) => acc + item.quantity, 0), // Total quantity
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
        where('subcategory', '==', 'Soft drinks')
      );
      const querySnapshot = await getDocs(softDrinksQuery);
      const softDrinksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
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

  // Handle Custom Quantity Change
  const handleCustomQuantityChange = (productId, quantity) => {
    setCustomQuantity({ ...customQuantity, [productId]: parseInt(quantity, 10) || 0 });
  };

 // Open the Custom Bundle Modal
 const openCustomBundleModal = () => {
    setIsCustomBundleModalOpen(true);
  };

  // Close the Custom Bundle Modal
  const closeCustomBundleModal = () => {
    setIsCustomBundleModalOpen(false);
  };

  // Add to Cart
  const addToCart = (product) => {
    const existingProduct = cart.find(item => item.id === product.id);

    let priceToAdd = 0;
    let quantityToAdd = 1;

    if (view === 'perPcs') {
      priceToAdd = parseFloat(product.pricing?.pricePerUnit);
    } else if (view === 'perBundle') {
      const bulkPricePerUnit = parseFloat(product.pricing?.bulkPricing[0]?.bulkPricePerUnit);
      quantityToAdd = parseInt(product.pricing?.bulkPricing[0]?.quantity, 10);
      priceToAdd = bulkPricePerUnit;
    } 

    if (quantityToAdd <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (existingProduct) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantityToAdd }
          : item
      ));
    } else {
      setCart([...cart, { ...product, price: priceToAdd, quantity: quantityToAdd }]);
    }
  };

  // Update Cart Quantity
  const updateQuantity = (productId, type) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: type === 'increase' ? item.quantity + 1 : Math.max(item.quantity - 1, 1) }
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
      const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const saleData = {
        products: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice,
        date: new Date(),
        status: 'pending',
      };
      const salesRef = collection(db, 'sales');
      await addDoc(salesRef, saleData);

      // Decrement stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const productSnapshot = await getDoc(productRef);
        const productData = productSnapshot.data();
        const stockInUnits = parseFloat(productData.stockInUnits) || 0;
        await updateDoc(productRef, {
          stockInUnits: stockInUnits - item.quantity,
        });
      }
      setCart([]);
      alert('Checkout successful!');
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      alert('There was an error during checkout.');
    }
  };

  return (
    <div >
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => toggleView('perPcs')}
          className={`px-4 py-2 ${view === 'perPcs' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
        >
          Per Pcs
        </button>
        <button
          onClick={() => toggleView('perBundle')}
          className={`px-4 py-2 ${view === 'perBundle' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
        >
          Per Bundle/Case
        </button>
        <button
          onClick={openCustomBundleModal} // Open the custom bundle modal
          className="px-4 py-2 bg-blue-600 text-white"
        >
          Custom Bundle/Case
        </button>
      </div>

      <div className="flex">
        <div className="w-2/3 p-4 grid grid-cols-2 gap-4">
          {softDrinks.map((product) => {
            let priceText = '';

            if (view === 'perPcs') {
              priceText = `₱${product.pricing?.pricePerUnit} per ${product.unitType}`;
            } else if (view === 'perBundle') {
              const bulkPricing = product.pricing?.bulkPricing[0];
              priceText = bulkPricing ? `₱${bulkPricing.bulkPricePerUnit} per ${bulkPricing.description}` : '';
            } else if (view === 'customBundle') {
              priceText = 'Custom Quantity';
            }

            return (
              <div key={product.id} className="border rounded-md p-4 text-center">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-full mx-auto"
                />
                <h3 className="mt-2 text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600">{priceText}</p>
                {view === 'customBundle' && (
                  <button
                 
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Enter Custom Quantity
                  </button>
                )}
                <button
                  onClick={() => addToCart(product)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>

        <div className="w-1/3 p-4 border-l border-gray-300">
          <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div>
          {cart.map((item) => (
    <div key={item.id} className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-12 h-12 object-cover rounded-full"
        />
        <div className="ml-4">
          <p className="text-lg font-semibold">{item.combinedName || item.name}</p>
          <p className="text-gray-600">₱{item.totalPrice.toFixed(2)} total</p> {/* Ensure totalPrice is not NaN */}
        </div>
      </div>
      <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, 'decrease')}
                      className="px-2 py-1 bg-gray-300 rounded-full"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 'increase')}
                      className="px-2 py-1 bg-gray-300 rounded-full"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
    </div>
  ))}
              <div className="mt-4">
                <p className="text-xl font-semibold">Total: ₱{cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</p>
                <button
                  onClick={proceedToCheckout}
                  className="mt-4 w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

         {/* Custom Bundle Modal */}
         {isCustomBundleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-auto p-8 rounded-lg">
            <CustomBundle
              softDrinks={softDrinks}
              addCustomBundleToCart={addCustomBundleToCart} // Pass function to add bundle to cart
            />
            <div className="flex space-x-4 mt-4">
              <button
                onClick={closeCustomBundleModal}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Cart;
