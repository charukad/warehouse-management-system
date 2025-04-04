// client/src/pages/warehouse/Dashboard.jsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { dashboardService } from "../../services/dashboardService";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WarehouseDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getWarehouseDashboard();
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching warehouse dashboard data:", error);
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

  // Format data for charts
  const formatReturnSummaryData = () => {
    if (
      !dashboardData?.returnsSummary ||
      dashboardData.returnsSummary.length === 0
    ) {
      return [];
    }

    return dashboardData.returnsSummary.map((item) => ({
      name: item._id || "Unspecified",
      value: item.totalAmount,
      count: item.returnCount,
    }));
  };

  // Define chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Warehouse Manager Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {dashboardData?.inventorySummary?.totalProducts || 0}
            </p>
            <p className="text-sm text-gray-500">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {dashboardData?.inventorySummary?.totalStock || 0}
            </p>
            <p className="text-sm text-gray-500">Units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {dashboardData?.inventorySummary?.lowStockItems || 0}
            </p>
            <p className="text-sm text-gray-500">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Distribution Summary (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-lg font-semibold">Total Distributed</p>
              <p className="text-3xl font-bold">
                $
                {dashboardData?.distributionSummary?.totalDistributed?.toFixed(
                  2
                ) || "0.00"}
              </p>
              <p className="text-gray-500">
                From{" "}
                {dashboardData?.distributionSummary?.distributionCount || 0}{" "}
                distributions
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">Return Analysis</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatReturnSummaryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {formatReturnSummaryData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Performance */}
      <Tabs defaultValue="top-distributed" className="mb-6">
        <TabsList>
          <TabsTrigger value="top-distributed">
            Top Distributed Products
          </TabsTrigger>
          <TabsTrigger value="high-return">High Return Products</TabsTrigger>
        </TabsList>

        <TabsContent value="top-distributed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Frequently Distributed Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData?.topDistributedProducts || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="productName"
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
                      dataKey="totalQuantity"
                      fill="#8884d8"
                      name="Quantity Distributed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Detailed List</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product Name</th>
                        <th className="border p-2 text-right">
                          Quantity Distributed
                        </th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.topDistributedProducts?.map(
                        (product, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="border p-2">
                              {product.productName}
                            </td>
                            <td className="border p-2 text-right">
                              {product.totalQuantity}
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-return" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Products with High Return Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData?.highReturnProducts || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="productName"
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
                      dataKey="returnedQuantity"
                      fill="#FF8042"
                      name="Quantity Returned"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Detailed List</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product Name</th>
                        <th className="border p-2 text-right">
                          Quantity Returned
                        </th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.highReturnProducts?.map(
                        (product, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="border p-2">
                              {product.productName}
                            </td>
                            <td className="border p-2 text-right">
                              {product.returnedQuantity}
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full">Update Inventory</Button>
            <Button className="w-full">Process Returns</Button>
            <Button className="w-full">Generate Inventory Report</Button>
            <Button className="w-full" variant="outline">
              Allocate Stock to Salesmen
            </Button>
            <Button className="w-full" variant="outline">
              Process Wholesale Order
            </Button>
            <Button className="w-full" variant="outline">
              Schedule Stock Count
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseDashboard;
