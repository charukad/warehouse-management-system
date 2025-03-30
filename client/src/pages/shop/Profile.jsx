// client/src/pages/shop/Profile.jsx
import React, { useState, useEffect } from "react";

const ShopProfile = () => {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Mock shop data
  const mockShopData = {
    id: "1",
    name: "Sweet Corner",
    address: "123 Main St, City",
    city: "City",
    postal_code: "10100",
    contact_person: "John Doe",
    phone: "123-456-7890",
    email: "sweetcorner@example.com",
    registration_date: "2023-01-15",
    is_active: true,
    assigned_salesman: {
      id: "1",
      name: "John Doe",
      phone: "987-654-3210",
    },
    preferred_delivery_time: "Afternoon (2pm-5pm)",
    preferred_payment_method: "Cash",
    notes: "Located near the city park. Closed on Mondays.",
  };

  // Load shop data on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setShopData(mockShopData);
      setFormData(mockShopData);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulate API call to update profile
    setTimeout(() => {
      setShopData(formData);
      setIsEditing(false);
      alert("Profile updated successfully");
    }, 500);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3">Loading shop profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Shop Profile</h1>
        <p className="text-gray-600">
          Manage your shop information and preferences
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Shop Information</h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Delivery Time
                  </label>
                  <select
                    name="preferred_delivery_time"
                    value={formData.preferred_delivery_time}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Morning (9am-12pm)">
                      Morning (9am-12pm)
                    </option>
                    <option value="Afternoon (12pm-3pm)">
                      Afternoon (12pm-3pm)
                    </option>
                    <option value="Afternoon (2pm-5pm)">
                      Afternoon (2pm-5pm)
                    </option>
                    <option value="Evening (4pm-7pm)">Evening (4pm-7pm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Payment Method
                  </label>
                  <select
                    name="preferred_payment_method"
                    value={formData.preferred_payment_method}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-2 border rounded-md"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Shop Name</h3>
                <p className="mt-1">{shopData.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Contact Person
                </h3>
                <p className="mt-1">{shopData.contact_person}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Phone Number
                </h3>
                <p className="mt-1">{shopData.phone}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{shopData.email || "Not provided"}</p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                <p className="mt-1">{shopData.address}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">City</h3>
                <p className="mt-1">{shopData.city}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Postal Code
                </h3>
                <p className="mt-1">{shopData.postal_code || "Not provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Registration Date
                </h3>
                <p className="mt-1">
                  {new Date(shopData.registration_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      shopData.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {shopData.is_active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Preferred Delivery Time
                </h3>
                <p className="mt-1">{shopData.preferred_delivery_time}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Preferred Payment Method
                </h3>
                <p className="mt-1">{shopData.preferred_payment_method}</p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1">{shopData.notes || "No notes"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Assigned Salesman
          </h3>
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center mr-3">
              <span className="text-blue-700 font-medium">
                {shopData.assigned_salesman.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{shopData.assigned_salesman.name}</p>
              <p className="text-sm text-gray-600">
                {shopData.assigned_salesman.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopProfile;
