// client/src/pages/owner/ShopsMap.jsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/common/Loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Store, DollarSign, TrendingUp } from "lucide-react";
import { dashboardService } from "../../services/dashboardService";

// Note: You'll need to add a mapping library like Leaflet or Google Maps
// For this example, I'll assume we're using a placeholder component

const MapVisualization = ({ shops, colorBy, sizeBy }) => {
  // This is a placeholder for an actual map component
  // In a real implementation, this would render a map with markers
  return (
    <div className="h-96 bg-gray-100 flex items-center justify-center rounded-md">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          Map visualization would show {shops.length} shops here, colored by{" "}
          {colorBy} and sized by {sizeBy}.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          (This is a placeholder for an actual map component)
        </p>
      </div>
    </div>
  );
};

const ShopsMap = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [colorBy, setColorBy] = useState("sales");
  const [sizeBy, setSizeBy] = useState("orders");
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    const fetchShopsData = async () => {
      try {
        setLoading(true);
        // This would be a real API call in your implementation
        const response = await dashboardService.getShopsMapData(filterBy);
        setShops(response.shops || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching shops map data:", error);
        setError("Failed to load shops data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopsData();
  }, [filterBy]);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shops Map</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Shops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Store className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">{shops.length}</p>
                <p className="text-sm text-gray-500">Registered shops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">
                  $
                  {shops
                    .reduce((sum, shop) => sum + (shop.totalSales || 0), 0)
                    .toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Across all shops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Best Performing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-xl font-bold truncate">
                  {shops.length > 0
                    ? shops.sort(
                        (a, b) => (b.totalSales || 0) - (a.totalSales || 0)
                      )[0].shopName
                    : "None"}
                </p>
                <p className="text-sm text-gray-500">Highest sales volume</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-red-500 mr-4" />
              <div>
                <p className="text-3xl font-bold">
                  {shops.filter((shop) => shop.needsAttention).length}
                </p>
                <p className="text-sm text-gray-500">
                  Shops requiring attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shop Distribution Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color By
              </label>
              <Select value={colorBy} onValueChange={setColorBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Volume</SelectItem>
                  <SelectItem value="orders">Order Count</SelectItem>
                  <SelectItem value="returns">Return Rate</SelectItem>
                  <SelectItem value="growth">Growth Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size By
              </label>
              <Select value={sizeBy} onValueChange={setSizeBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Volume</SelectItem>
                  <SelectItem value="orders">Order Count</SelectItem>
                  <SelectItem value="customers">Customer Count</SelectItem>
                  <SelectItem value="lifetime">Lifetime Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter By
              </label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="attention">Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <MapVisualization shops={shops} colorBy={colorBy} sizeBy={sizeBy} />

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">High {colorBy}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Medium {colorBy}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Low {colorBy}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
                <span className="text-sm">Inactive</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shop List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Shop Name</th>
                  <th className="border p-2 text-left">Address</th>
                  <th className="border p-2 text-right">Sales</th>
                  <th className="border p-2 text-right">Orders</th>
                  <th className="border p-2 text-center">Status</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border p-2">{shop.shopName}</td>
                    <td className="border p-2">{shop.address}</td>
                    <td className="border p-2 text-right">
                      ${shop.totalSales?.toFixed(2) || "0.00"}
                    </td>
                    <td className="border p-2 text-right">
                      {shop.orderCount || 0}
                    </td>
                    <td className="border p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          shop.status === "active"
                            ? "bg-green-100 text-green-800"
                            : shop.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {shop.status?.charAt(0).toUpperCase() +
                          shop.status?.slice(1) || "Unknown"}
                      </span>
                    </td>
                    <td className="border p-2 text-center">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopsMap;
