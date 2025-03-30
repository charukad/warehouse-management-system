// client/src/pages/SearchResultsPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchService } from "../services/searchService";
import ProductList from "../components/products/ProductList";
import ShopList from "../components/shop/ShopList";
import OrderList from "../components/orders/OrderList";
import UserList from "../components/users/UserList";
import { Tabs, TabList, Tab, TabPanel } from "../components/common/Tabs";
import Filters from "../components/common/Filters";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("q") || "";
  const activeTab = queryParams.get("tab") || "products";

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState({ items: [], pagination: {} });
  const [shops, setShops] = useState({ items: [], pagination: {} });
  const [orders, setOrders] = useState({ items: [], pagination: {} });
  const [users, setUsers] = useState({ items: [], pagination: {} });

  // Filter states
  const [productFilters, setProductFilters] = useState({
    product_type: queryParams.get("product_type") || "",
    min_price: queryParams.get("min_price") || "",
    max_price: queryParams.get("max_price") || "",
    is_active: queryParams.get("is_active") || "true",
  });

  const [shopFilters, setShopFilters] = useState({
    shop_type: queryParams.get("shop_type") || "",
    salesman_id: queryParams.get("salesman_id") || "",
    is_active: queryParams.get("is_active") || "true",
  });

  const [orderFilters, setOrderFilters] = useState({
    start_date: queryParams.get("start_date") || "",
    end_date: queryParams.get("end_date") || "",
    status: queryParams.get("status") || "",
    payment_method: queryParams.get("payment_method") || "",
    min_amount: queryParams.get("min_amount") || "",
    max_amount: queryParams.get("max_amount") || "",
  });

  // Fetch search results based on active tab
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);

      try {
        switch (activeTab) {
          case "products":
            const productResults = await searchService.searchProducts(
              searchQuery,
              productFilters,
              { page: queryParams.get("page") || 1 }
            );
            setProducts(productResults.data);
            break;

          case "shops":
            const shopResults = await searchService.searchShops(
              searchQuery,
              shopFilters,
              { page: queryParams.get("page") || 1 }
            );
            setShops(shopResults.data);
            break;

          case "orders":
            const orderResults = await searchService.searchOrders(
              {
                ...orderFilters,
                query: searchQuery,
              },
              { page: queryParams.get("page") || 1 }
            );
            setOrders(orderResults.data);
            break;

          case "users":
            const userResults = await searchService.searchUsers(searchQuery, {
              page: queryParams.get("page") || 1,
            });
            setUsers(userResults.data);
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery, activeTab, location.search]);

  // Handle tab change
  const handleTabChange = (tab) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("tab", tab);
    navigate(`/search?${newParams.toString()}`);
  };

  // Handle pagination change
  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("page", page);
    navigate(`/search?${newParams.toString()}`);
  };

  // Handle filter change
  const handleFilterChange = (filters) => {
    const newParams = new URLSearchParams(location.search);

    // Remove old filter params
    [
      "product_type",
      "min_price",
      "max_price",
      "shop_type",
      "salesman_id",
      "start_date",
      "end_date",
      "status",
      "payment_method",
      "min_amount",
      "max_amount",
      "is_active",
    ].forEach((param) => {
      newParams.delete(param);
    });

    // Add new filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    newParams.set("page", 1);

    navigate(`/search?${newParams.toString()}`);

    // Update local filter state based on active tab
    switch (activeTab) {
      case "products":
        setProductFilters(filters);
        break;
      case "shops":
        setShopFilters(filters);
        break;
      case "orders":
        setOrderFilters(filters);
        break;
      default:
        break;
    }
  };

  // Render filter components based on active tab
  const renderFilters = () => {
    switch (activeTab) {
      case "products":
        return (
          <ProductFilters
            filters={productFilters}
            onChange={handleFilterChange}
          />
        );

      case "shops":
        return (
          <ShopFilters filters={shopFilters} onChange={handleFilterChange} />
        );

      case "orders":
        return (
          <OrderFilters filters={orderFilters} onChange={handleFilterChange} />
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">
          Search Results for "{searchQuery}"
        </h1>

        <div className="relative">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => {
              const newParams = new URLSearchParams(location.search);
              newParams.set("q", e.target.value);
              navigate(`/search?${newParams.toString()}`);
            }}
            placeholder="Refine your search..."
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
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-medium mb-4">Filters</h2>
            {renderFilters()}
          </div>
        </div>

        <div className="lg:w-3/4">
          <Tabs activeTab={activeTab} onChange={handleTabChange}>
            <TabList>
              <Tab id="products">Products</Tab>
              <Tab id="shops">Shops</Tab>
              <Tab id="orders">Orders</Tab>
              <Tab id="users">Users</Tab>
            </TabList>

            <TabPanel id="products">
              {loading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : products.items.length > 0 ? (
                <>
                  <ProductList
                    products={products.items}
                    onPageChange={handlePageChange}
                    pagination={products.pagination}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  No products found matching your search criteria.
                </div>
              )}
            </TabPanel>

            <TabPanel id="shops">
              {loading ? (
                <div className="text-center py-8">Loading shops...</div>
              ) : shops.items.length > 0 ? (
                <>
                  <ShopList
                    shops={shops.items}
                    onPageChange={handlePageChange}
                    pagination={shops.pagination}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  No shops found matching your search criteria.
                </div>
              )}
            </TabPanel>

            <TabPanel id="orders">
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orders.items.length > 0 ? (
                <>
                  <OrderList
                    orders={orders.items}
                    onPageChange={handlePageChange}
                    pagination={orders.pagination}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  No orders found matching your search criteria.
                </div>
              )}
            </TabPanel>

            <TabPanel id="users">
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users.items.length > 0 ? (
                <>
                  <UserList
                    users={users.items}
                    onPageChange={handlePageChange}
                    pagination={users.pagination}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  No users found matching your search criteria.
                </div>
              )}
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
