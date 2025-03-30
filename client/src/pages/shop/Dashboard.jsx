// client/src/pages/shop/Dashboard.jsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { dashboardService } from "../../services/dashboardService";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, ShoppingCart, RefreshCw, Clock } from "lucide-react";

const ShopDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getShopDashboard();
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching shop dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Format data for order history chart
  const formatOrderHistoryData = () => {
    if (!dashboardData?.orderHistory || dashboardData.orderHistory.length === 0) {
      return [];
    }
    
    return dashboardData.orderHistory.map(item => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = monthNames[item._id.month - 1];
      return {
        month: `${monthName} ${item._id.year}`,
        orders: item.orderCount,
        spent: item.totalSpent
      };
    });
  };
  
  // Format data for frequent products chart
  const formatFrequentProductsData = () => {
    if (!dashboardData?.frequentProducts || dashboardData.frequentProducts.length === 0) {
      return [];
    }
    
    return dashboardData.frequentProducts.map(item => ({
      name: item.productName.length > 15 
        ? `${item.productName.substring(0, 15)}...` 
        : item.productName,
      quantity: item.totalQuantity,
      orders: item.orderCount
    }));
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shop Dashboard</h1>
      
      {/* Shop Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{dashboardData?.shopProfile?.shopName}</h3>
              <p><strong>Address:</strong> {dashboardData?.shopProfile?.address}</p>
              <p><strong>Contact Person:</strong> {dashboardData?.shopProfile?.contactPerson}</p>
              <p><strong>Phone:</strong> {dashboardData?.shopProfile?.phone}</p>
              <p><strong>Registration Date:</strong> {new Date(dashboardData?.shopProfile?.registrationDate).toLocaleDateString()}</p>
              <p><strong>Last Order Date:</strong> {dashboardData?.shopProfile?.lastOrderDate ? new Date(dashboardData?.shopProfile?.lastOrderDate).toLocaleDateString() : 'No orders yet'}</p>
            </div>
            
            <div className="flex flex-col justify-center items-center">
              <Button className="w-full mb-2">Place New Order</Button>
              <Button variant="outline" className="w-full mb-2">Process Return</Button>
              <Button variant="outline" className="w-full">Update Shop Profile</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">{dashboardData?.recentOrders?.length || 0}</p>
                <p className="text-sm text-gray-500">Orders in last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Popular Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">{dashboardData?.frequentProducts?.length || 0}</p>
                <p className="text-sm text-gray-500">Most ordered products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Recent Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-red-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">{dashboardData?.recentReturns?.length || 0}</p>
                <p className="text-sm text-gray-500">Returns processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for Different Views */}
      <Tabs defaultValue="orders" className="mb-6">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="products">Popular Products</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatOrderHistoryData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="spent"
                      stroke="#8884d8"
                      name="Amount Spent ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      name="Number of Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Order Date</th>
                        <th className="border p-2 text-right">Amount</th>
                        <th className="border p-2 text-center">Status</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recentOrders?.map((order, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border p-2">
                            {new Date(order.createdAt).toLocaleDateString()}
                            <span className="ml-2 text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="border p-2 text-right">${order.totalAmount.toFixed(2)}</td>
                          <td className="border p-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === "completed" ? "bg-green-100 text-green-800" : 
                              order.status === "processing" ? "bg-blue-100 text-blue-800" : 
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="border p-2 text-center">
                            <Button variant="outline" size="sm">View Details</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatFrequentProductsData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={70} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="quantity"
                      fill="#8884d8"
                      name="Total Quantity"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="orders"
                      fill="#82ca9d"
                      name="Order Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product</th>
                        <th className="border p-2 text-right">Total Quantity</th>
                        <th className="border p-2 text-right">Order Count</th>
                        <th className="border p-2 text-right">Retail Price</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.frequentProducts?.map((product, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border p-2">{product.productName}</td>
                          <td className="border p-2 text-right">{product.totalQuantity}</td>
                          <td className="border p-2 text-right">{product.orderCount}</td>
                          <td className="border p-2 text-right">${product.retailPrice.toFixed(2)}</td>
                          <td className="border p-2 text-center">
                            <Button variant="outline" size="sm">Quick Order</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="returns" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Returns</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentReturns?.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No returns processed recently.</p>
                  <Button variant="outline" className="mt-4">Process New Return</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Return Date</th>
                        <th className="border p-2 text-right">Amount</th>
                        <th className="border p-2 text-left">Reason</th>
                        <th className="border p-2 text-center">Status</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentReturns.map((returnItem, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border p-2">{new Date(returnItem.returnDate).toLocaleDateString()}</td>
                          <td className="border p-2 text-right">${returnItem.totalAmount.toFixed(2)}</td>
                          <td className="border p-2 text-right">${returnItem.totalAmount.toFixed(2)}</td>
          <td className="border p-2">{returnItem.returnReason || 'Not specified'}</td>
          <td className="border p-2 text-center">
            <span className={`px-2 py-1 rounded-full text-xs ${
              returnItem.status === "completed" ? "bg-green-100 text-green-800" : 
              returnItem.status === "processing" ? "bg-blue-100 text-blue-800" : 
              "bg-yellow-100 text-yellow-800"
            }`}>
              {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
            </span>
          </td>
          <td className="border p-2 text-center">
            <Button variant="outline" size="sm">View Details</Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
                </div>
              )}
              
              <div className="mt-4">
                <Button variant="outline" className="w-full">Process New Return</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Next Scheduled Delivery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Next Scheduled Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.shopProfile?.nextDeliveryDate ? (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <p className="font-medium">Your next delivery is scheduled for:</p>
              <p className="text-xl font-bold mt-1">{new Date(dashboardData.shopProfile.nextDeliveryDate).toLocaleDateString()} ({new Date(dashboardData.shopProfile.nextDeliveryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</p>
              <p className="mt-2 text-sm text-gray-600">Salesman: {dashboardData.shopProfile.salesmanName || 'Not assigned'}</p>
              <div className="mt-3 flex space-x-3">
                <Button variant="outline" size="sm">Reschedule</Button>
                <Button size="sm">Add Items to Order</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No delivery scheduled yet.</p>
              <Button>Schedule Delivery</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopDashboard;