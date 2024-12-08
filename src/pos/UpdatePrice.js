import React, { useState, useEffect } from "react";
import db from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

const UpdatePrice = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const productsPerPage = 10;

  const fetchBeverages = async () => {
    try {
      const q = query(
        collection(db, "products"),
        where("category", "==", "Beverages")
      );
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching beverages:", error);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleUpdateClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleBulkPricingChange = (index, field, value) => {
    const updatedBulkPricing = [...selectedProduct.pricing.bulkPricing];
    const parsedValue =
      field === "quantity" || field === "price" ? parseFloat(value) || 0 : value;

    updatedBulkPricing[index][field] = parsedValue;

    if (field === "price" || field === "quantity") {
      const price = parseFloat(updatedBulkPricing[index].price || 0);
      const quantity = parseInt(updatedBulkPricing[index].quantity || 1, 10);
      updatedBulkPricing[index].bulkPricePerUnit =
        quantity > 0 ? parseFloat((price / quantity).toFixed(2)) : 0;
    }

    setSelectedProduct({
      ...selectedProduct,
      pricing: { ...selectedProduct.pricing, bulkPricing: updatedBulkPricing },
    });
  };

  const handleWholesalePriceChange = (value) => {
    const updatedWholesalePricing = {
      ...selectedProduct.wholesalePricing,
      pricePerUnit: parseFloat(value) || 0,
    };
    setSelectedProduct({
      ...selectedProduct,
      wholesalePricing: updatedWholesalePricing,
    });
  };

  const handlePricePerUnitChange = (value) => {
    const updatedPricing = {
      ...selectedProduct.pricing,
      pricePerUnit: parseFloat(value) || 0,
    };
    setSelectedProduct({
      ...selectedProduct,
      pricing: updatedPricing,
    });
  };

  const handleSaveChanges = async () => {
    try {
      const productRef = doc(db, "products", selectedProduct.id);
      await updateDoc(productRef, {
        "pricing.pricePerUnit": selectedProduct.pricing.pricePerUnit,
        "pricing.bulkPricing": selectedProduct.pricing.bulkPricing,
        "wholesalePricing.pricePerUnit": selectedProduct.wholesalePricing.pricePerUnit,
      });
      setShowModal(false);
      alert("Pricing updated successfully!");
      fetchBeverages(); // Refresh product list
    } catch (error) {
      console.error("Error updating pricing:", error);
    }
  };

  const paginate = (array) => {
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    return array.slice(start, end);
  };

  const nextPage = () => {
    if (currentPage < Math.ceil(filteredProducts.length / productsPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    fetchBeverages();
  }, []);

  return (
    <div className="p-4 mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl flex justify-center items-center font-bold mb-6">Beverages - Update Pricing</h1>

      <div className="flex  items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border  mx-auto border-gray-300 rounded w-1/3"
        />
      </div>

      <table className="w-2/3  mx-auto border border-gray-300 bg-white shadow-sm rounded">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-3 border">Image</th>
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Price Per Unit</th>
            <th className="p-3 border">Bulk Pricing</th>
            <th className="p-3 border">Wholesale Price Per Unit</th>
            <th className="p-3 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {paginate(filteredProducts).map((product) => (
            <tr key={product.id} className="text-center">
              <td className="p-3 border">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-cover mx-auto"
                />
              </td>
              <td className="p-3 border">{product.name}</td>
              <td className="p-3 border">{product.pricing.pricePerUnit}</td>
              <td className="p-3 border">
                {product.pricing.bulkPricing.map((bulk, index) => (
                  <div key={index} className="text-sm">
                    <p>
                      {bulk.quantity} pcs - ₱{bulk.price} ({bulk.description})
                    </p>
                  </div>
                ))}
              </td>
              <td className="p-3 border">
                {product.wholesalePricing?.pricePerUnit ?? "N/A"}
              </td>
              <td className="p-3 border">
                <button
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                  onClick={() => handleUpdateClick(product)}
                >
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between max-w-max mx-auto items-center mt-4">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Previous
        </button>
        <p>
          Page {currentPage} of{" "}
          {Math.ceil(filteredProducts.length / productsPerPage)}
        </p>
        <button
          onClick={nextPage}
          disabled={
            currentPage === Math.ceil(filteredProducts.length / productsPerPage)
          }
          className={`px-4 py-2 rounded ${
            currentPage ===
            Math.ceil(filteredProducts.length / productsPerPage)
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Next
        </button>
      </div>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-1/2">
            <h2 className="text-lg font-semibold mb-4">
              Update Pricing for {selectedProduct.name}
            </h2>
            <form>
              {/* Price Per Unit Field */}
              <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
              <label className="block text-sm font-medium mb-1">Price Per Bottle</label>
                <input
                  type="number"
                  placeholder="Price Per Unit"
                  value={selectedProduct.pricing?.pricePerUnit || ""}
                  onChange={(e) => handlePricePerUnitChange(e.target.value)}
                  className="p-2 border border-gray-300 rounded w-full"
                />
              </div>
                  {/* Wholesale Pricing Field */}
              <div className="">
                <label className="block text-sm font-medium mb-1">
                  Wholesale Price Per Unit
                </label>
                <input
                  type="number"
                  placeholder="Wholesale Price Per Unit"
                  value={selectedProduct.wholesalePricing?.pricePerUnit || ""}
                  onChange={(e) => handleWholesalePriceChange(e.target.value)}
                  className="p-2 border border-gray-300 rounded w-full"
                />
              </div>
              </div>

              {/* Bulk Pricing Fields */}
              {selectedProduct.pricing.bulkPricing.map((bulk, index) => (
                <div key={index} className="space-y-2 mb-4">
                  <h3 className="font-semibold">Per 1 Case/Bundle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="Description"
                        value={bulk.description}
                        onChange={(e) =>
                          handleBulkPricingChange(index, "description", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Number of bottle Per Case/Bundle
                      </label>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={bulk.quantity}
                        onChange={(e) =>
                          handleBulkPricingChange(index, "quantity", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        1 Case/Bundle Price
                      </label>
                      <input
                        type="number"
                        placeholder="Price"
                        value={bulk.price}
                        onChange={(e) =>
                          handleBulkPricingChange(index, "price", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm  font-medium mb-1">
                        1 Case/Bundle Price Per Unit
                      </label>
                      <input
                        type="number"
                        placeholder="Bulk Price Per Unit"
                        value={bulk.bulkPricePerUnit}
                        readOnly
                        className="p-2 border border-red-300 text-red-500 rounded w-full bg-red-100"
                      />
                    </div>
                  </div>
                </div>
              ))}

            
            </form>
            <div className="flex justify-end space-x-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdatePrice;
