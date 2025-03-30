// client/src/pages/owner/Reports.jsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { reportService } from "../../services/reportService";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });
  const [reportType, setReportType] = useState("financial");
  const [entityId, setEntityId] = useState("");
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [salesmen, setSalesmen] = useState([]);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  useEffect(() => {
    // Fetch salesmen, products, and shops for dropdowns
    const fetchData = async () => {
      try {
        // In a real implementation, these would be API calls to your backend
        // For now, we'll use placeholders
        const salesmenData = await fetch("/api/users?role=salesman").then(
          (res) => res.json()
        );
        const productsData = await fetch("/api/products").then((res) =>
          res.json()
        );
        const shopsData = await fetch("/api/shops").then((res) => res.json());

        setSalesmen(salesmenData.data || []);
        setProducts(productsData.data || []);
        setShops(shopsData.data || []);
      } catch (error) {
        console.error("Error fetching data for report dropdowns:", error);
        setError(
          "Failed to load data for report options. Please try again later."
        );
      }
    };

    fetchData();
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const startDate = dateRange.startDate.toISOString().split("T")[0];
      const endDate = dateRange.endDate.toISOString().split("T")[0];

      let response;

      switch (reportType) {
        case "financial":
          response = await reportService.generateFinancialReport(
            startDate,
            endDate,
            format
          );
          break;
        case "inventory":
          response = await reportService.generateInventoryReport(
            startDate,
            endDate,
            format
          );
          break;
        case "salesman":
          if (!entityId) {
            setError("Please select a salesman.");
            setLoading(false);
            return;
          }
          response = await reportService.generateSalesmanReport(
            entityId,
            startDate,
            endDate,
            format
          );
          break;
        case "product":
          if (!entityId) {
            setError("Please select a product.");
            setLoading(false);
            return;
          }
          response = await reportService.generateProductReport(
            entityId,
            startDate,
            endDate,
            format
          );
          break;
        case "sales-summary":
          response = await reportService.getSalesSummary(startDate, endDate);
          break;
        case "product-performance":
          response = await reportService.getProductPerformance(
            startDate,
            endDate,
            entityId || null
          );
          break;
        case "salesman-performance":
          response = await reportService.getSalesmanPerformance(
            startDate,
            endDate,
            entityId || null
          );
          break;
        case "shop-performance":
          response = await reportService.getShopPerformance(
            startDate,
            endDate,
            entityId || null
          );
          break;
        case "inventory-status":
          response = await reportService.getInventoryStatus();
          break;
        case "returns-analysis":
          response = await reportService.getReturnsAnalysis(startDate, endDate);
          break;
        default:
          setError("Invalid report type selected.");
          setLoading(false);
          return;
      }

      if (format === "json") {
        // If we're requesting JSON, we'll get the data back directly
        console.log("Report data:", response);
        setSuccess("Report generated successfully. See console for details.");
      } else {
        // For PDF, a download will be triggered
        setSuccess(
          "Report generated successfully. Your download should begin shortly."
        );
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getEntityOptions = () => {
    switch (reportType) {
      case "salesman":
      case "salesman-performance":
        return salesmen.map((salesman) => (
          <SelectItem key={salesman._id} value={salesman._id}>
            {salesman.fullName}
          </SelectItem>
        ));
      case "product":
      case "product-performance":
        return products.map((product) => (
          <SelectItem key={product._id} value={product._id}>
            {product.productName}
          </SelectItem>
        ));
      case "shop-performance":
        return shops.map((shop) => (
          <SelectItem key={shop._id} value={shop._id}>
            {shop.shopName}
          </SelectItem>
        ));
      default:
        return null;
    }
  };

  const needsEntitySelection = [
    "salesman",
    "product",
    "salesman-performance",
    "product-performance",
    "shop-performance",
  ].includes(reportType);

  const getEntityLabel = () => {
    switch (reportType) {
      case "salesman":
      case "salesman-performance":
        return "Salesman";
      case "product":
      case "product-performance":
        return "Product";
      case "shop-performance":
        return "Shop";
      default:
        return "Entity";
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Report Generator</h1>

      <Tabs defaultValue="standard-reports" className="mb-6">
        <TabsList>
          <TabsTrigger value="standard-reports">Standard Reports</TabsTrigger>
          <TabsTrigger value="performance-reports">
            Performance Reports
          </TabsTrigger>
          <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="standard-reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Standard Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">
                          Financial Report
                        </SelectItem>
                        <SelectItem value="inventory">
                          Inventory Report
                        </SelectItem>
                        <SelectItem value="salesman">
                          Salesman Report
                        </SelectItem>
                        <SelectItem value="product">Product Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger id="format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="json">
                          JSON (View in Console)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {needsEntitySelection && (
                  <div>
                    <Label htmlFor="entity-id">{getEntityLabel()}</Label>
                    <Select value={entityId} onValueChange={setEntityId}>
                      <SelectTrigger id="entity-id">
                        <SelectValue
                          placeholder={`Select ${getEntityLabel().toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>{getEntityOptions()}</SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
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
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
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
                  </div>
                </div>

                <Button onClick={generateReport} className="mt-4">
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance-reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Performance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="performance-report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger id="performance-report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales-summary">
                          Sales Summary
                        </SelectItem>
                        <SelectItem value="product-performance">
                          Product Performance
                        </SelectItem>
                        <SelectItem value="salesman-performance">
                          Salesman Performance
                        </SelectItem>
                        <SelectItem value="shop-performance">
                          Shop Performance
                        </SelectItem>
                        <SelectItem value="inventory-status">
                          Inventory Status
                        </SelectItem>
                        <SelectItem value="returns-analysis">
                          Returns Analysis
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger id="format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="json">
                          JSON (View in Console)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {needsEntitySelection && (
                  <div>
                    <Label htmlFor="entity-id">
                      {getEntityLabel()} (Optional)
                    </Label>
                    <Select value={entityId} onValueChange={setEntityId}>
                      <SelectTrigger id="entity-id">
                        <SelectValue
                          placeholder={`Select ${getEntityLabel().toLowerCase()} or leave blank for all`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          All {getEntityLabel()}s
                        </SelectItem>
                        {getEntityOptions()}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {[
                  "sales-summary",
                  "product-performance",
                  "salesman-performance",
                  "shop-performance",
                  "returns-analysis",
                ].includes(reportType) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left"
                          >
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
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left"
                          >
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
                    </div>
                  </div>
                )}

                <Button onClick={generateReport} className="mt-4">
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Build custom reports by selecting specific metrics, dimensions,
                and filters. This feature allows you to create tailored reports
                to meet your specific business analysis needs.
              </p>

              <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md mb-6">
                <p className="text-yellow-800">
                  The custom report builder is coming soon. Please use the
                  standard reports and performance reports tabs for now.
                </p>
              </div>

              {/* Future implementation of custom report builder would go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">
            View and download your recently generated reports.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Report Type</th>
                  <th className="border p-2 text-left">Date Range</th>
                  <th className="border p-2 text-left">Generated On</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* This would be populated from API data in a real implementation */}
                <tr className="bg-white">
                  <td className="border p-2">Financial Report</td>
                  <td className="border p-2">Last 30 days</td>
                  <td className="border p-2">{format(new Date(), "PPP")}</td>
                  <td className="border p-2 text-center">
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-2">Inventory Status</td>
                  <td className="border p-2">Current</td>
                  <td className="border p-2">{format(new Date(), "PPP")}</td>
                  <td className="border p-2 text-center">
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="border p-2">Sales Summary</td>
                  <td className="border p-2">Last Quarter</td>
                  <td className="border p-2">
                    {format(
                      new Date(new Date().setDate(new Date().getDate() - 2)),
                      "PPP"
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
