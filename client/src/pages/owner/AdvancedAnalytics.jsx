// client/src/pages/owner/AdvancedAnalytics.jsx

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, FileBarChart, TrendingUp } from "lucide-react";
import { reportService } from "../../services/reportService";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reportType, setReportType] = useState("sales-trend");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date(),
  });
  const [groupBy, setGroupBy] = useState("day");
  const [comparisonPeriod, setComparisonPeriod] = useState("none");
  const [metrics, setMetrics] = useState(["sales"]);
  const [dimensions, setDimensions] = useState(["time"]);
  const [filters, setFilters] = useState({});
  const [reportFormat, setReportFormat] = useState("pdf");

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const reportConfig = {
        reportType,
        startDate: dateRange.startDate.toISOString().split("T")[0],
        endDate: dateRange.endDate.toISOString().split("T")[0],
        groupBy,
        comparisonPeriod,
        metrics,
        dimensions,
        filters,
      };

      await reportService.generateCustomReport(reportConfig, reportFormat);

      setSuccess(
        "Report generated successfully. Your download should begin shortly."
      );
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetricsChange = (e) => {
    const value = e.target.value;
    setMetrics((prevMetrics) =>
      prevMetrics.includes(value)
        ? prevMetrics.filter((metric) => metric !== value)
        : [...prevMetrics, value]
    );
  };

  const handleDimensionsChange = (e) => {
    const value = e.target.value;
    setDimensions((prevDimensions) =>
      prevDimensions.includes(value)
        ? prevDimensions.filter((dimension) => dimension !== value)
        : [...prevDimensions, value]
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Advanced Analytics</h1>

      <Tabs defaultValue="custom-reports" className="mb-6">
        <TabsList>
          <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
          <TabsTrigger value="trend-analysis">Trend Analysis</TabsTrigger>
          <TabsTrigger value="predictive-analytics">
            Predictive Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom-reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileBarChart className="h-5 w-5 mr-2" />
                Custom Report Builder
              </CardTitle>
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

              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales-trend">Sales Trend</SelectItem>
                        <SelectItem value="product-analysis">
                          Product Analysis
                        </SelectItem>
                        <SelectItem value="salesman-performance">
                          Salesman Performance
                        </SelectItem>
                        <SelectItem value="shop-analysis">
                          Shop Analysis
                        </SelectItem>
                        <SelectItem value="inventory-analysis">
                          Inventory Analysis
                        </SelectItem>
                        <SelectItem value="returns-analysis">
                          Returns Analysis
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="group-by">Group By</Label>
                    <Select value={groupBy} onValueChange={setGroupBy}>
                      <SelectTrigger id="group-by">
                        <SelectValue placeholder="Select grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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

                <div>
                  <Label className="mb-2 block">Metrics</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="metric-sales"
                        value="sales"
                        checked={metrics.includes("sales")}
                        onChange={handleMetricsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="metric-sales">Sales Amount</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="metric-orders"
                        value="orders"
                        checked={metrics.includes("orders")}
                        onChange={handleMetricsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="metric-orders">Order Count</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="metric-returns"
                        value="returns"
                        checked={metrics.includes("returns")}
                        onChange={handleMetricsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="metric-returns">Returns Amount</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="metric-profit"
                        value="profit"
                        checked={metrics.includes("profit")}
                        onChange={handleMetricsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="metric-profit">Profit</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Dimensions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dim-time"
                        value="time"
                        checked={dimensions.includes("time")}
                        onChange={handleDimensionsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="dim-time">Time</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dim-product"
                        value="product"
                        checked={dimensions.includes("product")}
                        onChange={handleDimensionsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="dim-product">Product</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dim-salesman"
                        value="salesman"
                        checked={dimensions.includes("salesman")}
                        onChange={handleDimensionsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="dim-salesman">Salesman</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dim-shop"
                        value="shop"
                        checked={dimensions.includes("shop")}
                        onChange={handleDimensionsChange}
                        className="mr-2"
                      />
                      <Label htmlFor="dim-shop">Shop</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="comparison-period">Comparison Period</Label>
                  <Select
                    value={comparisonPeriod}
                    onValueChange={setComparisonPeriod}
                  >
                    <SelectTrigger id="comparison-period">
                      <SelectValue placeholder="Select comparison period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="previous-period">
                        Previous Period
                      </SelectItem>
                      <SelectItem value="previous-year">
                        Previous Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="report-format">Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger id="report-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="json">
                        JSON (View in Console)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerateReport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend-analysis" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-6">
                Trend analysis helps identify patterns in your business data
                over time. This feature allows you to visualize trends in sales,
                inventory, returns, and more to make informed business
                decisions.
              </p>

              <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  Trend analysis features are currently in development and will
                  be available in the next update. Please use the Custom Reports
                  tab to generate trend reports in the meantime.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive-analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-6">
                Predictive analytics uses historical data to forecast future
                business trends. This feature will help you anticipate sales
                volumes, inventory needs, and identify potential business
                opportunities.
              </p>

              <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  Predictive analytics features are currently in development and
                  will be available in the next update. Please use the Custom
                  Reports tab to generate current data reports in the meantime.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
