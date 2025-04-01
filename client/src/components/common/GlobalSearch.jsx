// client/src/components/common/GlobalSearch.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService } from "../../services/searchService";
import { debounce } from "lodash";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    products: [],
    shops: [],
    orders: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults({
          products: [],
          shops: [],
          orders: [],
          users: [],
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await searchService.globalSearch(searchQuery);
        setResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);
    setIsLoading(true);
    debouncedSearch(searchQuery);
  };

  // Handle item click
  const handleItemClick = (type, item) => {
    setShowResults(false);

    switch (type) {
      case "product":
        navigate(`/products/${item._id}`);
        break;
      case "shop":
        navigate(`/shops/${item._id}`);
        break;
      case "order":
        navigate(`/orders/${item._id}`);
        break;
      case "user":
        navigate(`/users/${item._id}`);
        break;
      default:
        break;
    }
  };

  // Check if we have any results
  const hasResults =
    results.products.length > 0 ||
    results.shops.length > 0 ||
    results.orders.length > 0 ||
    results.users.length > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Search products, shops, orders..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={query}
          onChange={handleSearchChange}
          onFocus={() => setShowResults(true)}
        />

        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        {query && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => {
              setQuery("");
              setResults({
                products: [],
                shops: [],
                orders: [],
                users: [],
              });
            }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {showResults && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border">
          {isLoading ? (
            <div className="p-4 text-gray-500 text-center">
              <svg
                className="animate-spin h-5 w-5 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="mt-2">Searching...</div>
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-gray-500 text-center">
              No results found
            </div>
          ) : (
            <div>
              {results.products.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    Products
                  </div>
                  {results.products.map((product) => (
                    <div
                      key={product._id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick("product", product)}
                    >
                      <div className="font-medium">{product.product_name}</div>
                      <div className="text-sm text-gray-500">
                        {product.product_code} - LKR{product.retail_price}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.shops.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    Shops
                  </div>
                  {results.shops.map((shop) => (
                    <div
                      key={shop._id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick("shop", shop)}
                    >
                      <div className="font-medium">{shop.shop_name}</div>
                      <div className="text-sm text-gray-500">
                        {shop.address} - {shop.phone_number}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.orders.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    Orders
                  </div>
                  {results.orders.map((order) => (
                    <div
                      key={order._id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick("order", order)}
                    >
                      <div className="font-medium">
                        Order #{order.reference_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()} -
                        {order.total_amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    Users
                  </div>
                  {results.users.map((user) => (
                    // client/src/components/common/GlobalSearch.jsx (continued)
                    <div
                      key={user._id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick("user", user)}
                    >
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {user.username} - {user.user_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasResults && (
                <div className="px-4 py-2 border-t">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() =>
                      navigate(`/search?q=${encodeURIComponent(query)}`)
                    }
                  >
                    View all results
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
