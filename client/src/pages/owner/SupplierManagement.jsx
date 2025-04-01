// client/src/pages/owner/SupplierManagement.jsx
import React, { useState, useEffect } from "react";
import { supplierService } from "../../services/supplierService";
import { Alert } from "../../components/ui/alert";
import { Loader } from "../../components/common/Loader";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Form state for new supplier
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    address: "",
    website: "",
    notes: "",
    paymentTerms: "",
  });

  // Fetch suppliers when the component mounts
  useEffect(() => {
    const fetchSuppliersList = async () => {
      try {
        setLoading(true);
        console.log("Fetching suppliers from API...");
        const response = await supplierService.getAllSuppliers();
        console.log("API response:", response);

        // Set suppliers from API response or use dummy data as fallback
        if (response && (response.data?.suppliers || response.data)) {
          setSuppliers(response.data?.suppliers || response.data);
        } else {
          setSuppliers(dummySuppliers);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError("Failed to load suppliers. Please try again.");
        setLoading(false);
        // Fallback to dummy data if the API call fails
        setSuppliers(dummySuppliers);
      }
    };

    fetchSuppliersList();
  }, []);

  // For now, we'll use dummy data until the API is connected
  const dummySuppliers = [
    {
      _id: "1",
      name: "Quality Foods Distributors",
      contactPerson: "John Smith",
      phoneNumber: "+94 77 123 4567",
      email: "contact@qualityfoods.com",
      address: "123 Main St, Colombo",
      isActive: true,
    },
    {
      _id: "2",
      name: "Sweet Ingredients Co.",
      contactPerson: "Sarah Johnson",
      phoneNumber: "+94 77 234 5678",
      email: "info@sweetingredients.com",
      address: "456 Park Ave, Kandy",
      isActive: true,
    },
    {
      _id: "3",
      name: "Premium Packaging Ltd",
      contactPerson: "David Lee",
      phoneNumber: "+94 77 345 6789",
      email: "sales@premiumpackaging.com",
      address: "789 Market Rd, Galle",
      isActive: false,
    },
  ];

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle input change in form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSupplierForm({
      ...supplierForm,
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

    // Required fields
    if (!supplierForm.name.trim()) errors.name = "Supplier name is required";
    if (!supplierForm.phoneNumber.trim())
      errors.phoneNumber = "Phone number is required";

    // Email validation if provided
    if (supplierForm.email && !/\S+@\S+\.\S+/.test(supplierForm.email))
      errors.email = "Email address is invalid";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmitSupplier = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError(null);

      // Prepare the data for the backend
      const supplierData = {
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        phoneNumber: supplierForm.phoneNumber,
        email: supplierForm.email,
        address: supplierForm.address,
        website: supplierForm.website,
        notes: supplierForm.notes,
        paymentTerms: supplierForm.paymentTerms,
      };

      console.log("Creating supplier with data:", supplierData);

      const response = await supplierService.createSupplier(supplierData);
      console.log("Service method response:", response);

      // If successful, add to our local state
      if (response && response.data) {
        console.log("Response data:", response.data);
        const newSupplier = response.data.supplier ||
          response.data || {
            _id: `new-${Date.now()}`,
            ...supplierData,
            isActive: true,
          };

        setSuppliers([newSupplier, ...suppliers]);
        setSuccess("Supplier created successfully!");
        resetForm();
        setShowAddSupplierModal(false);
      } else {
        console.warn("Received response but no data:", response);
        // Still show success for UI experience
        setSuccess("Supplier created but response format was unexpected");
        resetForm();
        setShowAddSupplierModal(false);
      }
    } catch (err) {
      console.error("Error creating supplier:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create supplier. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier) => {
    setEditSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      phoneNumber: supplier.phoneNumber,
      email: supplier.email || "",
      address: supplier.address || "",
      website: supplier.website || "",
      notes: supplier.notes || "",
      paymentTerms: supplier.paymentTerms || "",
    });
  };

  // Handle update supplier
  const handleUpdateSupplier = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError(null);

      // Prepare the data for the backend
      const supplierData = {
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        phoneNumber: supplierForm.phoneNumber,
        email: supplierForm.email,
        address: supplierForm.address,
        website: supplierForm.website,
        notes: supplierForm.notes,
        paymentTerms: supplierForm.paymentTerms,
      };

      console.log(
        `Updating supplier ${editSupplier._id} with data:`,
        supplierData
      );

      const response = await supplierService.updateSupplier(
        editSupplier._id,
        supplierData
      );
      console.log("Service method response:", response);

      // If successful, update our local state
      if (response && response.data) {
        const updatedSupplier = response.data.supplier || response.data;
        setSuppliers(
          suppliers.map((supplier) =>
            supplier._id === editSupplier._id ? updatedSupplier : supplier
          )
        );
        setSuccess("Supplier updated successfully!");
        resetForm();
        setEditSupplier(null);
      }
    } catch (err) {
      console.error("Error updating supplier:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update supplier. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle deactivate supplier
  const handleDeactivateSupplier = async (id) => {
    try {
      setLoading(true);
      await supplierService.deactivateSupplier(id);
      setSuppliers(
        suppliers.map((supplier) =>
          supplier._id === id ? { ...supplier, isActive: false } : supplier
        )
      );
      setSuccess("Supplier deactivated successfully!");
    } catch (err) {
      console.error("Error deactivating supplier:", err);
      setError("Failed to deactivate supplier. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reactivate supplier
  const handleReactivateSupplier = async (id) => {
    try {
      setLoading(true);
      await supplierService.reactivateSupplier(id);
      setSuppliers(
        suppliers.map((supplier) =>
          supplier._id === id ? { ...supplier, isActive: true } : supplier
        )
      );
      setSuccess("Supplier reactivated successfully!");
    } catch (err) {
      console.error("Error reactivating supplier:", err);
      setError("Failed to reactivate supplier. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setSupplierForm({
      name: "",
      contactPerson: "",
      phoneNumber: "",
      email: "",
      address: "",
      website: "",
      notes: "",
      paymentTerms: "",
    });
    setFormErrors({});
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Supplier Management</h1>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search suppliers..."
            className="px-4 py-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={() => {
              setShowAddSupplierModal(true);
              resetForm();
            }}
            disabled={loading}
          >
            Add New Supplier
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Person
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
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
                <td colSpan="6" className="px-6 py-4 text-center">
                  <Loader />
                </td>
              </tr>
            ) : filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {supplier.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      {supplier.contactPerson}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{supplier.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        supplier.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => handleEditSupplier(supplier)}
                    >
                      Edit
                    </button>
                    {supplier.isActive ? (
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to deactivate this supplier?"
                            )
                          ) {
                            handleDeactivateSupplier(supplier._id);
                          }
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to reactivate this supplier?"
                            )
                          ) {
                            handleReactivateSupplier(supplier._id);
                          }
                        }}
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  No suppliers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Supplier</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={supplierForm.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={supplierForm.contactPerson}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={supplierForm.phoneNumber}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.phoneNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.phoneNumber}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={supplierForm.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={supplierForm.address}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={supplierForm.website}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                name="paymentTerms"
                value={supplierForm.paymentTerms}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Net 30"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={supplierForm.notes}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                onClick={() => {
                  resetForm();
                  setShowAddSupplierModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmitSupplier}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editSupplier && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Supplier</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={supplierForm.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={supplierForm.contactPerson}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={supplierForm.phoneNumber}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.phoneNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.phoneNumber}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={supplierForm.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={supplierForm.address}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={supplierForm.website}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                name="paymentTerms"
                value={supplierForm.paymentTerms}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Net 30"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={supplierForm.notes}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              ></textarea>
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                onClick={() => {
                  resetForm();
                  setEditSupplier(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleUpdateSupplier}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
