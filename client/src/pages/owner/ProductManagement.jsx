// client/src/pages/owner/ProductManagement.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "../../components/ui/alert";
import ProductFilters from "../../components/common/ProductFilters";
import { productService } from "../../services/productService";
import { supplierService } from "../../services/supplierService";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productType, setProductType] = useState("all");
  const [formErrors, setFormErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);

  // Form state for new product
  const [productForm, setProductForm] = useState({
    product_name: "",
    product_code: "",
    product_type: "in-house",
    retail_price: "",
    wholesale_price: "",
    description: "",
    min_stock_level: "10",
    image_url: "",
    // In-house product fields
    production_cost: "",
    production_details: "",
    recipe_id: "",
    // Third-party product fields
    supplier_id: "",
    purchase_price: "",
    supplier_product_code: "",
  });

  // Fetch products when the component mounts
  useEffect(() => {
    const fetchProductsList = async () => {
      try {
        setLoading(true);
        console.log("Fetching products from API...");
        const response = await productService.getAllProducts();
        console.log("API response:", response);
        setProducts(response.data?.products || response.data || dummyProducts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (err.response) {
          console.error("Server response:", err.response.data);
          console.error("Status code:", err.response.status);
        }
        setError("Failed to load products. Please try again.");
        setLoading(false);
        // Fallback to dummy data if the API call fails
        setProducts(dummyProducts);
      }
    };

    fetchProductsList();

    // Fetch suppliers for dropdown
    const fetchSuppliers = async () => {
      try {
        const response = await supplierService.getAllSuppliers({
          isActive: true,
        });
        if (response && (response.data?.suppliers || response.data)) {
          setSuppliers(response.data?.suppliers || response.data);
        } else {
          // Use dummy suppliers as fallback
          setSuppliers([
            { _id: "supplier1", name: "Supplier A" },
            { _id: "supplier2", name: "Supplier B" },
            { _id: "supplier3", name: "Supplier C" },
          ]);
        }
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        // Use dummy suppliers as fallback
        setSuppliers([
          { _id: "supplier1", name: "Supplier A" },
          { _id: "supplier2", name: "Supplier B" },
          { _id: "supplier3", name: "Supplier C" },
        ]);
      }
    };

    fetchSuppliers();
  }, [dispatch]);

  // For now, we'll use dummy data until the API is connected
  const dummyProducts = [
    {
      _id: "1",
      name: "Sweet Treat A",
      productCode: "STA001",
      productType: "in-house",
      retailPrice: 250,
      wholesalePrice: 200,
      productionCost: 150,
      isActive: true,
      minStockLevel: 50,
      image: "/placeholder.png",
    },
    {
      _id: "2",
      name: "Sweet Treat B",
      productCode: "STB002",
      productType: "in-house",
      retailPrice: 300,
      wholesalePrice: 240,
      productionCost: 180,
      isActive: true,
      minStockLevel: 40,
      image: "/placeholder.png",
    },
    {
      _id: "3",
      name: "Third Party Sweet",
      productCode: "TPS003",
      productType: "third-party",
      retailPrice: 350,
      wholesalePrice: 290,
      purchasePrice: 220,
      supplier: "supplier1",
      isActive: true,
      minStockLevel: 30,
      image: "/placeholder.png",
    },
  ];

  // Filter products based on selected type
  const filteredProducts =
    productType === "all"
      ? products
      : products.filter((product) => product.productType === productType);

  // Handle input change in form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });

    // Clear error for this field if there was one
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};

    // Required for all products
    if (!productForm.product_name.trim())
      errors.product_name = "Product name is required";
    if (!productForm.product_code.trim())
      errors.product_code = "Product code is required";
    if (!productForm.retail_price)
      errors.retail_price = "Retail price is required";
    if (!productForm.wholesale_price)
      errors.wholesale_price = "Wholesale price is required";

    // Validate numbers
    if (productForm.retail_price && isNaN(productForm.retail_price))
      errors.retail_price = "Must be a valid number";
    if (productForm.wholesale_price && isNaN(productForm.wholesale_price))
      errors.wholesale_price = "Must be a valid number";
    if (productForm.min_stock_level && isNaN(productForm.min_stock_level))
      errors.min_stock_level = "Must be a valid number";

    // For in-house products
    if (productForm.product_type === "in-house") {
      if (!productForm.production_cost)
        errors.production_cost = "Production cost is required";
      if (productForm.production_cost && isNaN(productForm.production_cost))
        errors.production_cost = "Must be a valid number";
    }

    // For third-party products
    if (productForm.product_type === "third-party") {
      if (!productForm.supplier_id) errors.supplier_id = "Supplier is required";
      if (!productForm.purchase_price)
        errors.purchase_price = "Purchase price is required";
      if (productForm.purchase_price && isNaN(productForm.purchase_price))
        errors.purchase_price = "Must be a valid number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmitProduct = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError(null);

      // Prepare the data with CORRECT FIELD NAMES for the backend
      const productData = {
        name: productForm.product_name,
        productCode: productForm.product_code,
        productType: productForm.product_type,
        retailPrice: parseFloat(productForm.retail_price),
        wholesalePrice: parseFloat(productForm.wholesale_price),
        description: productForm.description,
        minStockLevel: parseInt(productForm.min_stock_level),
        image: productForm.image_url || "default-product.jpg",
      };

      // Add type-specific fields
      if (productForm.product_type === "in-house") {
        productData.productionCost = parseFloat(productForm.production_cost);
        productData.productionDetails = productForm.production_details;
        productData.recipeId = productForm.recipe_id;
      } else if (productForm.product_type === "third-party") {
        productData.supplier = productForm.supplier_id;
        productData.purchasePrice = parseFloat(productForm.purchase_price);
        productData.supplierProductCode = productForm.supplier_product_code;
      }

      console.log("Creating product with data:", productData);

      const response = await productService.createProduct(productData);
      console.log("Service method response:", response);

      // If successful, add to our local state
      if (response && response.data) {
        console.log("Response data:", response.data);
        const newProduct = response.data.product ||
          response.data || {
            _id: `new-${Date.now()}`,
            ...productData,
            isActive: true,
          };

        setProducts([newProduct, ...products]);
        setSuccess("Product created successfully!");
        resetForm();
        setShowAddProductModal(false);
      } else {
        console.warn("Received response but no data:", response);
        // Still show success for UI experience
        setSuccess("Product created but response format was unexpected");
        resetForm();
        setShowAddProductModal(false);
      }
    } catch (err) {
      console.error("Error creating product:", err);

      // Enhanced error logging
      if (err.response) {
        console.error("Server error response:", err.response.data);
        console.error("Status code:", err.response.status);
        console.error("Headers:", err.response.headers);
      } else if (err.request) {
        console.error("No response received from server:", err.request);
      } else {
        console.error("Error message:", err.message);
      }

      setError(
        err.response?.data?.message ||
          "Failed to create product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setProductForm({
      product_name: "",
      product_code: "",
      product_type: "in-house",
      retail_price: "",
      wholesale_price: "",
      description: "",
      min_stock_level: "10",
      image_url: "",
      production_cost: "",
      production_details: "",
      recipe_id: "",
      supplier_id: "",
      purchase_price: "",
      supplier_product_code: "",
    });
    setFormErrors({});
  };

  // Now we use the suppliers state, populated from the API

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Product Management</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={() => setShowAddProductModal(true)}
          disabled={loading}
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <select
              className="w-full border rounded p-2"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="in-house">In-House Products</option>
              <option value="third-party">Third-Party Products</option>
            </select>
          </div>
          {/* You can add more filters here */}
        </div>

        <div className="w-full md:w-3/4">
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
                              src={product.image || "/placeholder.png"}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {product.productCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.productType === "in-house"
                            ? "In-House"
                            : "Third-Party"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          LKR {product.retailPrice}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          LKR {product.wholesalePrice}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
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
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Product</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddProductModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={productForm.product_name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.product_name
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.product_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.product_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_code"
                  value={productForm.product_code}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.product_code
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.product_code && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.product_code}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                name="product_type"
                value={productForm.product_type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="in-house">In-House Product</option>
                <option value="third-party">Third-Party Product</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retail Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="retail_price"
                  value={productForm.retail_price}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.retail_price
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  min="0"
                  step="0.01"
                />
                {formErrors.retail_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.retail_price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wholesale Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="wholesale_price"
                  value={productForm.wholesale_price}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.wholesale_price
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  min="0"
                  step="0.01"
                />
                {formErrors.wholesale_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.wholesale_price}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={productForm.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows="3"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  name="min_stock_level"
                  value={productForm.min_stock_level}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    formErrors.min_stock_level
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  min="0"
                />
                {formErrors.min_stock_level && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.min_stock_level}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={productForm.image_url}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Leave blank for default image"
                />
              </div>
            </div>

            {/* Conditional fields based on product type */}
            {productForm.product_type === "in-house" ? (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">
                  In-House Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Production Cost <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="production_cost"
                      value={productForm.production_cost}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded ${
                        formErrors.production_cost
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {formErrors.production_cost && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.production_cost}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipe ID
                    </label>
                    <input
                      type="text"
                      name="recipe_id"
                      value={productForm.recipe_id}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Details
                  </label>
                  <textarea
                    name="production_details"
                    value={productForm.production_details}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">
                  Third-Party Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="supplier_id"
                      value={productForm.supplier_id}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded ${
                        formErrors.supplier_id
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.supplier_id && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.supplier_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={productForm.purchase_price}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded ${
                        formErrors.purchase_price
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {formErrors.purchase_price && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.purchase_price}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Product Code
                  </label>
                  <input
                    type="text"
                    name="supplier_product_code"
                    value={productForm.supplier_product_code}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                onClick={() => {
                  resetForm();
                  setShowAddProductModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmitProduct}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - You can implement this later */}
      {editProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
            <p className="text-gray-600 mb-4">
              Edit functionality will be implemented in a future update.
            </p>
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
