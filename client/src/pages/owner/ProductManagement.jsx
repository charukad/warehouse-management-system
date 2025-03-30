// client/src/pages/owner/ProductManagement.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// These imports will be used once you implement the corresponding functionality
// import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../store/slices/productSlice';

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productType, setProductType] = useState("all");

  // This would fetch products when the component mounts
  useEffect(() => {
    // Uncomment when you implement the product slice with thunks
    // dispatch(fetchProducts());
  }, [dispatch]);

  // For now, we'll use dummy data until the API is connected
  const dummyProducts = [
    {
      _id: "1",
      product_name: "Sweet Treat A",
      product_code: "STA001",
      product_type: "in_house",
      retail_price: 250,
      wholesale_price: 200,
      production_cost: 150,
      is_active: true,
      min_stock_level: 50,
      image_url: "/placeholder.png",
    },
    {
      _id: "2",
      product_name: "Sweet Treat B",
      product_code: "STB002",
      product_type: "in_house",
      retail_price: 300,
      wholesale_price: 240,
      production_cost: 180,
      is_active: true,
      min_stock_level: 40,
      image_url: "/placeholder.png",
    },
    {
      _id: "3",
      product_name: "Third Party Sweet",
      product_code: "TPS003",
      product_type: "third_party",
      retail_price: 350,
      wholesale_price: 290,
      purchase_price: 220,
      supplier_id: "supplier1",
      is_active: true,
      min_stock_level: 30,
      image_url: "/placeholder.png",
    },
  ];

  // Filter products based on selected type
  const filteredProducts =
    productType === "all"
      ? dummyProducts
      : dummyProducts.filter((product) => product.product_type === productType);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Product Management</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowAddProductModal(true)}
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="mb-4">
        <label className="mr-2">Filter by Type:</label>
        <select
          className="border rounded p-2"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="in_house">In-House Products</option>
          <option value="third_party">Third-Party Products</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Retail Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wholesale Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={product.image_url}
                          alt={product.product_name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {product.product_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{product.product_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.product_type === "in_house"
                        ? "In-House"
                        : "Third-Party"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">₹{product.retail_price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      ₹{product.wholesale_price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => setEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this product?"
                          )
                        ) {
                          // Uncomment when deleteProduct is implemented
                          // dispatch(deleteProduct(product._id));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal - You can implement this later */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            {/* Form fields will go here */}
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                onClick={() => setShowAddProductModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  // Form submission logic
                  setShowAddProductModal(false);
                }}
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - You can implement this later */}
      {editProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
            {/* Form fields will go here */}
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                onClick={() => setEditProduct(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  // Form submission logic
                  setEditProduct(null);
                }}
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
