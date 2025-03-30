// client/src/pages/salesman/Dashboard.jsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { dashboardService } from "../../services/dashboardService";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, TrendingUp, Calendar, Store } from "lucide-react";

const SalesmanDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getSalesmanDashboard();
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching salesman dashboard data:", error);
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

  // Format data for inventory chart
  const formatInventoryData = () => {
    if (!dashboardData?.inventory || dashboardData.inventory.length === 0) {
      return [];
    }

    return dashboardData.inventory
      .map((item) => ({
        name:
          item.productName.length > 15
            ? `${item.productName.substring(0, 15)}...`
            : item.productName,
        allocated: item.allocatedQuantity,
        remaining: item.remainingQuantity,
      }))
      .slice(0, 10); // Limit to top 10 for readability
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Salesman Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Monthly Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">
                  $
                  {dashboardData?.performance?.monthlySales?.toFixed(2) ||
                    "0.00"}
                </p>
                <p className="text-sm text-gray-500">
                  From {dashboardData?.performance?.orderCount || 0} orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Today's Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">
                  {dashboardData?.todaysActivity?.orderCount || 0}
                </p>
                <p className="text-sm text-gray-500">Orders processed today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Assigned Shops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Store className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">
                  {dashboardData?.assignedShops?.totalShops || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Active shops in your territory
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="today" className="mb-6">
        <TabsList>
          <TabsTrigger value="today">Today's Activity</TabsTrigger>
          <TabsTrigger value="inventory">My Inventory</TabsTrigger>
          <TabsTrigger value="shops">Shops to Restock</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.todaysActivity?.orders?.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No orders processed today yet.
                  </p>
                  <Button className="mt-4">Process New Order</Button>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Shop</th>
                        <th className="border p-2 text-right">Amount</th>
                        <th className="border p-2 text-center">Status</th>
                        <th className="border p-2 text-center">Time</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.todaysActivity.orders.map(
                        (order, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="border p-2">{order.shopName}</td>
                            <td className="border p-2 text-right">
                              ${order.orderAmount.toFixed(2)}
                            </td>
                            <td className="border p-2 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                            </td>
                            <td className="border p-2 text-center">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </td>
                            <td className="border p-2 text-center">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                  <div className="mt-4 flex justify-end">
                    <Button>Process New Order</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.inventory?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No inventory allocated to you yet.
                </p>
              ) : (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatInventoryData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="allocated"
                          stackId="a"
                          fill="#8884d8"
                          name="Allocated"
                        />
                        <Bar
                          dataKey="remaining"
                          stackId="a"
                          fill="#82ca9d"
                          name="Remaining"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Inventory Details
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Product</th>
                            <th className="border p-2 text-right">Allocated</th>
                            <th className="border p-2 text-right">Remaining</th>
                            <th className="border p-2 text-right">
                              Retail Price
                            </th>
                            <th className="border p-2 text-right">
                              Wholesale Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.inventory.map((item, index) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="border p-2">{item.productName}</td>
                              <td className="border p-2 text-right">
                                {item.allocatedQuantity}
                              </td>
                              <td className="border p-2 text-right">
                                {item.remainingQuantity}
                              </td>
                              <td className="border p-2 text-right">
                                ${item.retailPrice.toFixed(2)}
                              </td>
                              <td className="border p-2 text-right">
                                ${item.wholesalePrice.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline">Request More Stock</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shops" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Shops Needing Restocking</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.restockingSchedule?.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No shops need restocking at this time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Shop Name</th>
                        <th className="border p-2 text-left">Address</th>
                        <th className="border p-2 text-center">Restock Date</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.restockingSchedule.map((shop, index) => {
                        const isOverdue =
                          shop.nextRestockDate &&
                          new Date(shop.nextRestockDate) < new Date();

                        return (
                          <tr
                            key={index}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } ${isOverdue ? "text-red-600" : ""}`}
                          >
                            <td className="border p-2">{shop.shopName}</td>
                            <td className="border p-2">{shop.address}</td>
                            <td className="border p-2 text-center">
                              {shop.nextRestockDate ? (
                                <>
                                  {new Date(
                                    shop.nextRestockDate
                                  ).toLocaleDateString()}
                                  {isOverdue && (
                                    <span className="ml-2 text-xs font-semibold text-red-600">
                                      (OVERDUE)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-yellow-600">
                                  Not scheduled
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  Navigate
                                </Button>
                                <Button size="sm">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Deliver
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="outline">View All Shops</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full">Process Shop Order</Button>
            <Button className="w-full">Register New Shop</Button>
            <Button className="w-full">Process Returns</Button>
            <Button className="w-full" variant="outline">
              View My Performance
            </Button>
            <Button className="w-full" variant="outline">
              View Route Map
            </Button>
            <Button className="w-full" variant="outline">
              End of Day Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesmanDashboard;
