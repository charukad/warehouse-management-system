// client/src/pages/owner/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { dashboardService } from "../../services/dashboardService";
import { reportService } from "../../services/reportService";
import { useWebSocket } from "../../contexts/WebSocketContext";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Date utilities and icons
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

// Chart components
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

const OwnerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getOwnerDashboard(timeRange);
        setDashboardData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  const handleDateRangeChange = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getOwnerDashboard(
        `custom&startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`
      );
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error(
        "Error fetching dashboard data with custom date range:",
        error
      );
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const exportFinancialReport = async (format = "pdf") => {
    try {
      const startDate = dateRange.startDate.toISOString().split("T")[0];
      const endDate = dateRange.endDate.toISOString().split("T")[0];
      await reportService.generateFinancialReport(startDate, endDate, format);
    } catch (error) {
      console.error("Error exporting financial report:", error);
      setError("Failed to export financial report. Please try again later.");
    }
  };

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
  const formatSalesTrendData = () => {
    if (!dashboardData?.salesTrends || dashboardData.salesTrends.length === 0) {
      return [];
    }

    return dashboardData.salesTrends.map((item) => ({
      date: item._id,
      sales: parseFloat(item.dailySales.toFixed(2)),
      orders: item.orderCount,
    }));
  };

  const formatProductPerformanceData = () => {
    if (
      !dashboardData?.productPerformance ||
      dashboardData.productPerformance.length === 0
    ) {
      return [];
    }

    return dashboardData.productPerformance.slice(0, 5).map((item) => ({
      name:
        item.productName.length > 15
          ? `${item.productName.substring(0, 15)}...`
          : item.productName,
      value: parseFloat(item.totalRevenue.toFixed(2)),
      quantity: item.totalSold,
    }));
  };

  const formatSalesmanPerformanceData = () => {
    if (
      !dashboardData?.salesmanPerformance ||
      dashboardData.salesmanPerformance.length === 0
    ) {
      return [];
    }

    return dashboardData.salesmanPerformance.slice(0, 5).map((item) => ({
      name:
        item.salesmanName.length > 15
          ? `${item.salesmanName.substring(0, 15)}...`
          : item.salesmanName,
      sales: parseFloat(item.totalSales.toFixed(2)),
      orders: item.orderCount,
      shops: item.shopCount,
    }));
  };

  // Define chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <div className="flex gap-4 items-center">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.startDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.startDate}
                  onSelect={(date) =>
                    setDateRange({ ...dateRange, startDate: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-sm">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.endDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.endDate}
                  onSelect={(date) =>
                    setDateRange({ ...dateRange, endDate: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleDateRangeChange}>Apply</Button>
          </div>

          <Button
            onClick={() => exportFinancialReport("pdf")}
            variant="outline"
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${dashboardData?.summary?.totalSales?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-500">
              From {dashboardData?.summary?.orderCount || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${dashboardData?.summary?.averageOrderValue?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-500">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${dashboardData?.returns?.totalReturnAmount?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-500">
              From {dashboardData?.returns?.returnCount || 0} returns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {dashboardData?.inventoryAlerts?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Low stock items</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Analytics */}
      <Tabs defaultValue="sales" className="mb-6">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="salesmen">Salesmen</TabsTrigger>
          <TabsTrigger value="shops">Shops</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatSalesTrendData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Sales ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatProductPerformanceData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="value"
                      fill="#8884d8"
                      name="Sales ($)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="quantity"
                      fill="#82ca9d"
                      name="Quantity Sold"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Product Sales Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatProductPerformanceData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {formatProductPerformanceData().map((entry, index) => (
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

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  All Products Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product Name</th>
                        <th className="border p-2 text-right">Quantity Sold</th>
                        <th className="border p-2 text-right">
                          Sales Amount ($)
                        </th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.productPerformance?.map(
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
                              {product.totalSold}
                            </td>
                            <td className="border p-2 text-right">
                              ${product.totalRevenue.toFixed(2)}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  reportService.generateProductReport(
                                    product.productId,
                                    dateRange.startDate
                                      .toISOString()
                                      .split("T")[0],
                                    dateRange.endDate
                                      .toISOString()
                                      .split("T")[0],
                                    "pdf"
                                  )
                                }
                              >
                                Report
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

        <TabsContent value="salesmen" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Salesmen Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatSalesmanPerformanceData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Sales ($)" />
                    <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
                    <Bar dataKey="shops" fill="#ffc658" name="Shops Served" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  Detailed Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Salesman</th>
                        <th className="border p-2 text-right">Sales ($)</th>
                        <th className="border p-2 text-right">Orders</th>
                        <th className="border p-2 text-right">Shops</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.salesmanPerformance?.map(
                        (salesman, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="border p-2">
                              {salesman.salesmanName}
                            </td>
                            <td className="border p-2 text-right">
                              ${salesman.totalSales.toFixed(2)}
                            </td>
                            <td className="border p-2 text-right">
                              {salesman.orderCount}
                            </td>
                            <td className="border p-2 text-right">
                              {salesman.shopCount}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  reportService.generateSalesmanReport(
                                    salesman.salesmanId,
                                    dateRange.startDate
                                      .toISOString()
                                      .split("T")[0],
                                    dateRange.endDate
                                      .toISOString()
                                      .split("T")[0],
                                    "pdf"
                                  )
                                }
                              >
                                Report
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

        <TabsContent value="shops" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Shops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Shop Name</th>
                      <th className="border p-2 text-right">Total Spent ($)</th>
                      <th className="border p-2 text-right">Order Count</th>
                      <th className="border p-2 text-right">Avg Order ($)</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.shopPerformance?.map((shop, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border p-2">{shop.shopName}</td>
                        <td className="border p-2 text-right">
                          ${shop.totalSpent.toFixed(2)}
                        </td>
                        <td className="border p-2 text-right">
                          {shop.orderCount}
                        </td>
                        <td className="border p-2 text-right">
                          ${shop.averageOrderValue.toFixed(2)}
                        </td>
                        <td className="border p-2 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              reportService.getShopPerformance(
                                dateRange.startDate.toISOString().split("T")[0],
                                dateRange.endDate.toISOString().split("T")[0],
                                shop.shopId
                              )
                            }
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inventory Alerts */}
      {dashboardData?.inventoryAlerts?.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Product</th>
                    <th className="border p-2 text-right">Current Stock</th>
                    <th className="border p-2 text-right">Minimum Threshold</th>
                    <th className="border p-2 text-right">Reorder Quantity</th>
                    <th className="border p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.inventoryAlerts.map((item, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${
                        item.alertLevel === "critical"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      <td className="border p-2">{item.productName}</td>
                      <td className="border p-2 text-right">
                        {item.currentStock}
                      </td>
                      <td className="border p-2 text-right">
                        {item.minimumThreshold}
                      </td>
                      <td className="border p-2 text-right">
                        {item.reorderQuantity}
                      </td>
                      <td
                        className={`border p-2 text-center font-semibold ${
                          item.alertLevel === "critical"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {item.alertLevel === "critical"
                          ? "CRITICAL"
                          : "WARNING"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OwnerDashboard;
