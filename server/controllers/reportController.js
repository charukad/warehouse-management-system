// server/controllers/reportController.js

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Return = require("../models/Return");
const Inventory = require("../models/Inventory");
const apiResponse = require("../utils/apiResponse");
const pdf = require("html-pdf"); // You'll need to install this package
const fs = require("fs");
const path = require("path");

/**
 * Report Controller
 * Provides reporting functionality including financial reports,
 * sales analysis, inventory reports, and performance metrics
 */
const reportController = {
  /**
   * Generate financial report
   * Includes revenue, costs, returns, and profit calculations
   * for specified time period
   */
  generateFinancialReport: async (req, res) => {
    try {
      // Get date range filters from the request
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return apiResponse.badRequest(
          res,
          "Start date and end date are required"
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      // Validate dates
      if (start > end) {
        return apiResponse.badRequest(
          res,
          "Start date must be before end date"
        );
      }

      // Get sales data
      const salesData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      // Get product costs
      const productCosts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: null,
            totalCost: {
              $sum: {
                $cond: {
                  if: { $eq: ["$productDetails.productType", "in-house"] },
                  then: {
                    $multiply: [
                      "$items.quantity",
                      "$productDetails.productionCost",
                    ],
                  },
                  else: {
                    $multiply: [
                      "$items.quantity",
                      "$productDetails.purchasePrice",
                    ],
                  },
                },
              },
            },
          },
        },
      ]);

      // Get return data
      const returnData = await Return.aggregate([
        { $match: { returnDate: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalReturns: { $sum: "$totalAmount" },
            returnCount: { $sum: 1 },
          },
        },
      ]);

      // Get sales by product category
      const salesByCategory = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.category",
            totalSales: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Get sales by salesman
      const salesBySalesman = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        {
          $group: {
            _id: "$salesmanId",
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "salesmanDetails",
          },
        },
        { $unwind: "$salesmanDetails" },
        {
          $project: {
            salesmanId: "$_id",
            salesmanName: "$salesmanDetails.fullName",
            totalSales: 1,
            orderCount: 1,
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Calculate daily sales
      const dailySales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Assemble the financial report
      const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
      const totalCost = productCosts.length > 0 ? productCosts[0].totalCost : 0;
      const totalReturns =
        returnData.length > 0 ? returnData[0].totalReturns : 0;
      const grossProfit = totalSales - totalCost;
      const netProfit = grossProfit - totalReturns;
      const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

      const financialReport = {
        reportPeriod: {
          startDate: start,
          endDate: end,
        },
        summary: {
          totalSales,
          totalCost,
          grossProfit,
          totalReturns,
          netProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          orderCount: salesData.length > 0 ? salesData[0].orderCount : 0,
          returnCount: returnData.length > 0 ? returnData[0].returnCount : 0,
        },
        salesByCategory,
        salesBySalesman,
        dailySales,
      };

      // If PDF format is requested, generate PDF
      if (format === "pdf") {
        // Create a file name based on the report period
        const fileName = `financial_report_${start
          .toISOString()
          .slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.pdf`;
        const filePath = path.join(__dirname, "../reports", fileName);

        // Ensure reports directory exists
        if (!fs.existsSync(path.join(__dirname, "../reports"))) {
          fs.mkdirSync(path.join(__dirname, "../reports"), { recursive: true });
        }

        // Generate HTML content for the PDF
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 30px; }
                h1 { color: #333366; text-align: center; }
                h2 { color: #333366; margin-top: 20px; }
                .summary { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <h1>Financial Report</h1>
              <p><strong>Period:</strong> ${start.toDateString()} to ${end.toDateString()}</p>
              
              <h2>Financial Summary</h2>
              <div class="summary">
                <p><strong>Total Sales:</strong> $${totalSales.toFixed(2)}</p>
                <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
                <p><strong>Gross Profit:</strong> $${grossProfit.toFixed(2)}</p>
                <p><strong>Total Returns:</strong> $${totalReturns.toFixed(
                  2
                )}</p>
                <p><strong>Net Profit:</strong> $${netProfit.toFixed(2)}</p>
                <p><strong>Profit Margin:</strong> ${profitMargin.toFixed(
                  2
                )}%</p>
                <p><strong>Total Orders:</strong> ${
                  salesData.length > 0 ? salesData[0].orderCount : 0
                }</p>
                <p><strong>Total Returns:</strong> ${
                  returnData.length > 0 ? returnData[0].returnCount : 0
                }</p>
              </div>
              
              <h2>Sales by Product Category</h2>
              <table>
                <tr>
                  <th>Category</th>
                  <th>Total Sales ($)</th>
                  <th>Quantity Sold</th>
                </tr>
                ${salesByCategory
                  .map(
                    (category) => `
                  <tr>
                    <td>${category._id || "Uncategorized"}</td>
                    <td>$${category.totalSales.toFixed(2)}</td>
                    <td>${category.quantity}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>Sales by Salesman</h2>
              <table>
                <tr>
                  <th>Salesman</th>
                  <th>Total Sales ($)</th>
                  <th>Order Count</th>
                </tr>
                ${salesBySalesman
                  .map(
                    (salesman) => `
                  <tr>
                    <td>${salesman.salesmanName}</td>
                    <td>$${salesman.totalSales.toFixed(2)}</td>
                    <td>${salesman.orderCount}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>Daily Sales</h2>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Total Sales ($)</th>
                  <th>Order Count</th>
                </tr>
                ${dailySales
                  .map(
                    (day) => `
                  <tr>
                    <td>${day._id}</td>
                    <td>$${day.totalSales.toFixed(2)}</td>
                    <td>${day.orderCount}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Sathira Sweet Management System</p>
              </div>
            </body>
          </html>
        `;

        // Generate PDF from HTML
        pdf
          .create(htmlContent, {
            format: "A4",
            border: {
              top: "20px",
              right: "20px",
              bottom: "20px",
              left: "20px",
            },
          })
          .toFile(filePath, (err, result) => {
            if (err) {
              console.error("PDF generation error:", err);
              return apiResponse.error(res, "Error generating PDF report", err);
            }

            // Send the file as a download
            res.download(filePath, fileName, (err) => {
              if (err) {
                console.error("File download error:", err);
                return apiResponse.error(res, "Error downloading report", err);
              }

              // Delete the file after download
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error("Error deleting temporary file:", err);
                }
              });
            });
          });
      } else {
        // Return JSON format
        return apiResponse.success(
          res,
          "Financial report generated successfully",
          financialReport
        );
      }
    } catch (error) {
      console.error("Financial report error:", error);
      return apiResponse.error(res, "Error generating financial report", error);
    }
  },

  /**
   * Generate inventory report
   * Provides detailed inventory status, movement history, and valuation
   */
  generateInventoryReport: async (req, res) => {
    try {
      const { startDate, endDate, format } = req.query;

      // Get current inventory status
      const inventoryStatus = await Inventory.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$productDetails._id",
            productName: "$productDetails.productName",
            productCode: "$productDetails.productCode",
            category: "$productDetails.category",
            currentStock: 1,
            warehouseStock: 1,
            allocatedStock: 1,
            minimumThreshold: 1,
            reorderQuantity: 1,
            lastUpdated: 1,
            valuePerUnit: {
              $cond: {
                if: { $eq: ["$productDetails.productType", "in-house"] },
                then: "$productDetails.productionCost",
                else: "$productDetails.purchasePrice",
              },
            },
          },
        },
        {
          $addFields: {
            totalValue: { $multiply: ["$currentStock", "$valuePerUnit"] },
            stockStatus: {
              $cond: {
                if: { $lte: ["$currentStock", "$minimumThreshold"] },
                then: "Low Stock",
                else: "Adequate",
              },
            },
          },
        },
        { $sort: { stockStatus: 1, productName: 1 } },
      ]);

      // Calculate total inventory value
      const totalValue = inventoryStatus.reduce(
        (sum, item) => sum + item.totalValue,
        0
      );

      // Get inventory movement if date range is provided
      let inventoryMovement = [];

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        inventoryMovement = await Inventory.aggregate([
          {
            $lookup: {
              from: "inventorytransactions",
              localField: "productId",
              foreignField: "productId",
              as: "transactions",
            },
          },
          { $unwind: "$transactions" },
          {
            $match: {
              "transactions.transactionDate": { $gte: start, $lte: end },
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          { $unwind: "$productDetails" },
          {
            $project: {
              productId: "$productDetails._id",
              productName: "$productDetails.productName",
              transactionDate: "$transactions.transactionDate",
              transactionType: "$transactions.transactionType",
              quantity: "$transactions.quantity",
              sourceId: "$transactions.sourceId",
              sourceType: "$transactions.sourceType",
              destinationId: "$transactions.destinationId",
              destinationType: "$transactions.destinationType",
              notes: "$transactions.notes",
            },
          },
          { $sort: { transactionDate: 1 } },
        ]);
      }

      // Get low stock products
      const lowStockProducts = inventoryStatus.filter(
        (item) => item.stockStatus === "Low Stock"
      );

      // Assemble the inventory report
      const inventoryReport = {
        generatedAt: new Date(),
        summary: {
          totalProducts: inventoryStatus.length,
          totalValue: parseFloat(totalValue.toFixed(2)),
          lowStockProducts: lowStockProducts.length,
        },
        inventoryStatus,
        lowStockProducts,
        inventoryMovement,
      };

      // If PDF format is requested, generate PDF
      if (format === "pdf") {
        // Create a file name
        const fileName = `inventory_report_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`;
        const filePath = path.join(__dirname, "../reports", fileName);

        // Ensure reports directory exists
        if (!fs.existsSync(path.join(__dirname, "../reports"))) {
          fs.mkdirSync(path.join(__dirname, "../reports"), { recursive: true });
        }

        // Generate HTML content for the PDF
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 30px; }
                h1 { color: #333366; text-align: center; }
                h2 { color: #333366; margin-top: 20px; }
                .summary { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .low-stock { color: red; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <h1>Inventory Report</h1>
              <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
              
              <h2>Inventory Summary</h2>
              <div class="summary">
                <p><strong>Total Products:</strong> ${
                  inventoryStatus.length
                }</p>
                <p><strong>Total Inventory Value:</strong> $${totalValue.toFixed(
                  2
                )}</p>
                <p><strong>Low Stock Products:</strong> ${
                  lowStockProducts.length
                }</p>
              </div>
              
              <h2>Low Stock Products</h2>
              ${
                lowStockProducts.length > 0
                  ? `
                <table>
                  <tr>
                    <th>Product Name</th>
                    <th>Code</th>
                    <th>Current Stock</th>
                    <th>Minimum Threshold</th>
                    <th>Reorder Quantity</th>
                  </tr>
                  ${lowStockProducts
                    .map(
                      (product) => `
                    <tr class="low-stock">
                      <td>${product.productName}</td>
                      <td>${product.productCode}</td>
                      <td>${product.currentStock}</td>
                      <td>${product.minimumThreshold}</td>
                      <td>${product.reorderQuantity}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </table>
              `
                  : "<p>No low stock products found.</p>"
              }
              
              <h2>Current Inventory Status</h2>
              <table>
                <tr>
                  <th>Product Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Value Per Unit</th>
                  <th>Total Value</th>
                  <th>Status</th>
                </tr>
                ${inventoryStatus
                  .map(
                    (product) => `
                  <tr ${
                    product.stockStatus === "Low Stock"
                      ? 'class="low-stock"'
                      : ""
                  }>
                    <td>${product.productName}</td>
                    <td>${product.productCode}</td>
                    <td>${product.category || "Uncategorized"}</td>
                    <td>${product.currentStock}</td>
                    <td>$${product.valuePerUnit.toFixed(2)}</td>
                    <td>$${product.totalValue.toFixed(2)}</td>
                    <td>${product.stockStatus}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              ${
                inventoryMovement.length > 0
                  ? `
                <h2>Inventory Movement (${new Date(
                  startDate
                ).toDateString()} to ${new Date(endDate).toDateString()})</h2>
                <table>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Transaction Type</th>
                    <th>Quantity</th>
                    <th>Source/Destination</th>
                    <th>Notes</th>
                  </tr>
                  ${inventoryMovement
                    .map(
                      (movement) => `
                    <tr>
                      <td>${new Date(
                        movement.transactionDate
                      ).toLocaleString()}</td>
                      <td>${movement.productName}</td>
                      <td>${movement.transactionType}</td>
                      <td>${movement.quantity}</td>
                      <td>${movement.sourceType}${
                        movement.sourceId ? ` (ID: ${movement.sourceId})` : ""
                      } -> 
                          ${movement.destinationType}${
                        movement.destinationId
                          ? ` (ID: ${movement.destinationId})`
                          : ""
                      }</td>
                      <td>${movement.notes || ""}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </table>
              `
                  : ""
              }
              
              <div class="footer">
                <p>Generated by Sathira Sweet Management System</p>
              </div>
            </body>
          </html>
        `;

        // Generate PDF from HTML
        pdf
          .create(htmlContent, {
            format: "A4",
            border: {
              top: "20px",
              right: "20px",
              bottom: "20px",
              left: "20px",
            },
          })
          .toFile(filePath, (err, result) => {
            if (err) {
              console.error("PDF generation error:", err);
              return apiResponse.error(res, "Error generating PDF report", err);
            }

            // Send the file as a download
            res.download(filePath, fileName, (err) => {
              if (err) {
                console.error("File download error:", err);
                return apiResponse.error(res, "Error downloading report", err);
              }

              // Delete the file after download
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error("Error deleting temporary file:", err);
                }
              });
            });
          });
      } else {
        // Return JSON format
        return apiResponse.success(
          res,
          "Inventory report generated successfully",
          inventoryReport
        );
      }
    } catch (error) {
      console.error("Inventory report error:", error);
      return apiResponse.error(res, "Error generating inventory report", error);
    }
  },

  /**
   * Generate salesman performance report
   * Analyzes salesman performance metrics including sales, shop acquisition,
   * and product performance
   */
  generateSalesmanReport: async (req, res) => {
    try {
      const { salesmanId, startDate, endDate, format } = req.query;

      if (!salesmanId) {
        return apiResponse.badRequest(res, "Salesman ID is required");
      }

      if (!startDate || !endDate) {
        return apiResponse.badRequest(
          res,
          "Start date and end date are required"
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      // Get salesman details
      const salesman = await User.findById(salesmanId)
        .populate("salesmanDetails")
        .select(
          "fullName contact email salesmanDetails.territory_id salesmanDetails.commission_rate"
        );

      if (!salesman) {
        return apiResponse.notFound(res, "Salesman not found");
      }

      // Get sales performance
      const salesPerformance = await Order.aggregate([
        {
          $match: {
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            uniqueShops: { $addToSet: "$shopId" },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]);

      // Get daily sales
      const dailySales = await Order.aggregate([
        {
          $match: {
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get top selling products
      const topProducts = await Order.aggregate([
        {
          $match: {
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: "$items.quantity" },
            totalSales: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.productName",
            totalQuantity: 1,
            totalSales: 1,
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
      ]);

      // Get shop performance
      const shopPerformance = await Order.aggregate([
        {
          $match: {
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            createdAt: { $gte: start, $lte: end },
            status: "completed",
          },
        },
        {
          $group: {
            _id: "$shopId",
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "_id",
            foreignField: "_id",
            as: "shopDetails",
          },
        },
        { $unwind: "$shopDetails" },
        {
          $project: {
            shopId: "$_id",
            shopName: "$shopDetails.shopName",
            address: "$shopDetails.address",
            totalSales: 1,
            orderCount: 1,
            averageOrderValue: 1,
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Get new shops registered
      const newShops = await Shop.find({
        createdBySalesmanId: salesmanId,
        registrationDate: { $gte: start, $lte: end },
      }).select("shopName address phone registrationDate");

      // Get return statistics
      const returnStatistics = await Return.aggregate([
        {
          $match: {
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            returnDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$returnType",
            returnCount: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      // Calculate commission
      const commission =
        salesPerformance.length > 0
          ? (salesPerformance[0].totalSales *
              (salesman.salesmanDetails?.commission_rate || 0)) /
            100
          : 0;

      // Assemble the report
      const salesmanReport = {
        salesmanInfo: {
          id: salesman._id,
          name: salesman.fullName,
          contact: salesman.contact,
          email: salesman.email,
          territory: salesman.salesmanDetails?.territory_id || "Not assigned",
          commissionRate: salesman.salesmanDetails?.commission_rate || 0,
        },
        reportPeriod: {
          startDate: start,
          endDate: end,
        },
        performance:
          salesPerformance.length > 0
            ? {
                totalSales: salesPerformance[0].totalSales,
                orderCount: salesPerformance[0].orderCount,
                uniqueShopCount: salesPerformance[0].uniqueShops.length,
                averageOrderValue: parseFloat(
                  salesPerformance[0].averageOrderValue.toFixed(2)
                ),
                commission: parseFloat(commission.toFixed(2)),
              }
            : {
                totalSales: 0,
                orderCount: 0,
                uniqueShopCount: 0,
                averageOrderValue: 0,
                commission: 0,
              },
        dailySales,
        topProducts,
        shopPerformance,
        newShops: {
          count: newShops.length,
          shops: newShops,
        },
        returns: {
          statistics: returnStatistics,
          totalReturns: returnStatistics.reduce(
            (sum, item) => sum + item.totalAmount,
            0
          ),
        },
      };

      // If PDF format is requested, generate PDF
      if (format === "pdf") {
        // Create a file name
        const fileName = `salesman_report_${salesmanId}_${start
          .toISOString()
          .slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.pdf`;
        const filePath = path.join(__dirname, "../reports", fileName);

        // Ensure reports directory exists
        if (!fs.existsSync(path.join(__dirname, "../reports"))) {
          fs.mkdirSync(path.join(__dirname, "../reports"), { recursive: true });
        }

        // Generate HTML content for the PDF
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 30px; }
                h1 { color: #333366; text-align: center; }
                h2 { color: #333366; margin-top: 20px; }
                .info-box { margin: 20px 0; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; }
                .summary { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <h1>Salesman Performance Report</h1>
              
              <div class="info-box">
                <h2>Salesman Information</h2>
                <p><strong>Name:</strong> ${salesman.fullName}</p>
                <p><strong>Contact:</strong> ${salesman.contact || "N/A"}</p>
                <p><strong>Email:</strong> ${salesman.email || "N/A"}</p>
                <p><strong>Territory:</strong> ${
                  salesman.salesmanDetails?.territory_id || "Not assigned"
                }</p>
                <p><strong>Commission Rate:</strong> ${
                  salesman.salesmanDetails?.commission_rate || 0
                }%</p>
              </div>
              
              <p><strong>Report Period:</strong> ${start.toDateString()} to ${end.toDateString()}</p>
              
              <h2>Performance Summary</h2>
              <div class="summary">
                <p><strong>Total Sales:</strong> $${salesmanReport.performance.totalSales.toFixed(
                  2
                )}</p>
                <p><strong>Order Count:</strong> ${
                  salesmanReport.performance.orderCount
                }</p>
                <p><strong>Unique Shops Served:</strong> ${
                  salesmanReport.performance.uniqueShopCount
                }</p>
                <p><strong>Average Order Value:</strong> $${salesmanReport.performance.averageOrderValue.toFixed(
                  2
                )}</p>
                <p><strong>Commission Earned:</strong> $${salesmanReport.performance.commission.toFixed(
                  2
                )}</p>
              </div>
              
              <h2>Daily Sales Performance</h2>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Total Sales ($)</th>
                  <th>Order Count</th>
                </tr>
                ${dailySales
                  .map(
                    (day) => `
                  <tr>
                    <td>${day._id}</td>
                    <td>$${day.totalSales.toFixed(2)}</td>
                    <td>${day.orderCount}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>Top Selling Products</h2>
              <table>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Sales Amount ($)</th>
                </tr>
                ${topProducts
                  .map(
                    (product) => `
                  <tr>
                    <td>${product.productName}</td>
                    <td>${product.totalQuantity}</td>
                    <td>$${product.totalSales.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>Shop Performance</h2>
              <table>
                <tr>
                  <th>Shop Name</th>
                  <th>Total Sales ($)</th>
                  <th>Order Count</th>
                  <th>Average Order ($)</th>
                </tr>
                ${shopPerformance
                  .map(
                    (shop) => `
                  <tr>
                    <td>${shop.shopName}</td>
                    <td>$${shop.totalSales.toFixed(2)}</td>
                    <td>${shop.orderCount}</td>
                    <td>$${shop.averageOrderValue.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>New Shops Registered (${newShops.length})</h2>
              ${
                newShops.length > 0
                  ? `
                <table>
                  <tr>
                    <th>Shop Name</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Registration Date</th>
                  </tr>
                  ${newShops
                    .map(
                      (shop) => `
                    <tr>
                      <td>${shop.shopName}</td>
                      <td>${shop.address}</td>
                      <td>${shop.phone || "N/A"}</td>
                      <td>${new Date(
                        shop.registrationDate
                      ).toLocaleDateString()}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </table>
              `
                  : "<p>No new shops registered during this period.</p>"
              }
              
              <h2>Returns Analysis</h2>
              <table>
                <tr>
                  <th>Return Type</th>
                  <th>Count</th>
                  <th>Total Amount ($)</th>
                </tr>
                ${returnStatistics
                  .map(
                    (stat) => `
                  <tr>
                    <td>${stat._id}</td>
                    <td>${stat.returnCount}</td>
                    <td>$${stat.totalAmount.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr>
                  <th>Total</th>
                  <th>${returnStatistics.reduce(
                    (sum, item) => sum + item.returnCount,
                    0
                  )}</th>
                  <th>$${salesmanReport.returns.totalReturns.toFixed(2)}</th>
                </tr>
              </table>
              
              <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Sathira Sweet Management System</p>
              </div>
            </body>
          </html>
        `;

        // Generate PDF from HTML
        pdf
          .create(htmlContent, {
            format: "A4",
            border: {
              top: "20px",
              right: "20px",
              bottom: "20px",
              left: "20px",
            },
          })
          .toFile(filePath, (err, result) => {
            if (err) {
              console.error("PDF generation error:", err);
              return apiResponse.error(res, "Error generating PDF report", err);
            }

            // Send the file as a download
            res.download(filePath, fileName, (err) => {
              if (err) {
                console.error("File download error:", err);
                return apiResponse.error(res, "Error downloading report", err);
              }

              // Delete the file after download
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error("Error deleting temporary file:", err);
                }
              });
            });
          });
      } else {
        // Return JSON format
        return apiResponse.success(
          res,
          "Salesman report generated successfully",
          salesmanReport
        );
      }
    } catch (error) {
      console.error("Salesman report error:", error);
      return apiResponse.error(res, "Error generating salesman report", error);
    }
  },

  /**
   * Generate product performance report
   * Analyzes product sales, return rates, and profitability
   */
  generateProductReport: async (req, res) => {
    try {
      const { productId, startDate, endDate, format } = req.query;

      if (!productId) {
        return apiResponse.badRequest(res, "Product ID is required");
      }

      if (!startDate || !endDate) {
        return apiResponse.badRequest(
          res,
          "Start date and end date are required"
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      // Get product details
      const product = await Product.findById(productId);

      if (!product) {
        return apiResponse.notFound(res, "Product not found");
      }

      // Get sales performance
      const salesPerformance = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
            "items.productId": mongoose.Types.ObjectId(productId),
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$items.quantity" },
            totalSales: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
            orderCount: { $sum: 1 },
            uniqueShops: { $addToSet: "$shopId" },
          },
        },
      ]);

      // Get daily sales
      // Get daily sales
      const dailySales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
            "items.productId": mongoose.Types.ObjectId(productId),
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            quantitySold: { $sum: "$items.quantity" },
            salesAmount: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get return statistics
      const returnStatistics = await Return.aggregate([
        {
          $match: {
            returnDate: { $gte: start, $lte: end },
            "items.productId": mongoose.Types.ObjectId(productId),
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$returnReason",
            returnCount: { $sum: 1 },
            quantityReturned: { $sum: "$items.quantity" },
            totalAmount: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
      ]);

      // Get top salesmen for this product
      const topSalesmen = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
            "items.productId": mongoose.Types.ObjectId(productId),
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$salesmanId",
            quantitySold: { $sum: "$items.quantity" },
            salesAmount: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "salesmanDetails",
          },
        },
        { $unwind: "$salesmanDetails" },
        {
          $project: {
            salesmanId: "$_id",
            salesmanName: "$salesmanDetails.fullName",
            quantitySold: 1,
            salesAmount: 1,
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 },
      ]);

      // Get top shops for this product
      const topShops = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: "completed",
            "items.productId": mongoose.Types.ObjectId(productId),
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$shopId",
            quantitySold: { $sum: "$items.quantity" },
            salesAmount: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "_id",
            foreignField: "_id",
            as: "shopDetails",
          },
        },
        { $unwind: "$shopDetails" },
        {
          $project: {
            shopId: "$_id",
            shopName: "$shopDetails.shopName",
            address: "$shopDetails.address",
            quantitySold: 1,
            salesAmount: 1,
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 },
      ]);

      // Calculate profitability
      const costPerUnit =
        product.productType === "in-house"
          ? product.productionCost
          : product.purchasePrice;

      const totalSold =
        salesPerformance.length > 0 ? salesPerformance[0].totalQuantity : 0;
      const totalSales =
        salesPerformance.length > 0 ? salesPerformance[0].totalSales : 0;
      const totalCost = totalSold * costPerUnit;
      const totalProfit = totalSales - totalCost;
      const profitMargin =
        totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

      const totalReturned = returnStatistics.reduce(
        (sum, item) => sum + item.quantityReturned,
        0
      );
      const returnRate = totalSold > 0 ? (totalReturned / totalSold) * 100 : 0;

      // Assemble the report
      const productReport = {
        productInfo: {
          id: product._id,
          name: product.productName,
          code: product.productCode,
          category: product.category,
          type: product.productType,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          costPerUnit,
        },
        reportPeriod: {
          startDate: start,
          endDate: end,
        },
        salesPerformance:
          salesPerformance.length > 0
            ? {
                totalQuantitySold: totalSold,
                totalSalesAmount: totalSales,
                orderCount: salesPerformance[0].orderCount,
                uniqueShopsCount: salesPerformance[0].uniqueShops.length,
              }
            : {
                totalQuantitySold: 0,
                totalSalesAmount: 0,
                orderCount: 0,
                uniqueShopsCount: 0,
              },
        profitability: {
          totalCost,
          totalProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
        },
        returns: {
          totalQuantityReturned: totalReturned,
          returnRate: parseFloat(returnRate.toFixed(2)),
          reasonBreakdown: returnStatistics,
        },
        dailySales,
        topSalesmen,
        topShops,
      };

      // If PDF format is requested, generate PDF
      if (format === "pdf") {
        // Create a file name
        const fileName = `product_report_${productId}_${start
          .toISOString()
          .slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.pdf`;
        const filePath = path.join(__dirname, "../reports", fileName);

        // Ensure reports directory exists
        if (!fs.existsSync(path.join(__dirname, "../reports"))) {
          fs.mkdirSync(path.join(__dirname, "../reports"), { recursive: true });
        }

        // Generate HTML content for the PDF
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 30px; }
                h1 { color: #333366; text-align: center; }
                h2 { color: #333366; margin-top: 20px; }
                .info-box { margin: 20px 0; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; }
                .summary { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <h1>Product Performance Report</h1>
              
              <div class="info-box">
                <h2>Product Information</h2>
                <p><strong>Name:</strong> ${product.productName}</p>
                <p><strong>Product Code:</strong> ${product.productCode}</p>
                <p><strong>Category:</strong> ${
                  product.category || "Uncategorized"
                }</p>
                <p><strong>Type:</strong> ${product.productType}</p>
                <p><strong>Retail Price:</strong> $${product.retailPrice.toFixed(
                  2
                )}</p>
                <p><strong>Wholesale Price:</strong> $${product.wholesalePrice.toFixed(
                  2
                )}</p>
                <p><strong>Cost Per Unit:</strong> $${costPerUnit.toFixed(
                  2
                )}</p>
              </div>
              
              <p><strong>Report Period:</strong> ${start.toDateString()} to ${end.toDateString()}</p>
              
              <h2>Sales Summary</h2>
              <div class="summary">
                <p><strong>Total Quantity Sold:</strong> ${totalSold}</p>
                <p><strong>Total Sales Amount:</strong> $${totalSales.toFixed(
                  2
                )}</p>
                <p><strong>Number of Orders:</strong> ${
                  productReport.salesPerformance.orderCount
                }</p>
                <p><strong>Unique Shops:</strong> ${
                  productReport.salesPerformance.uniqueShopsCount
                }</p>
              </div>
              
              <h2>Profitability Analysis</h2>
              <div class="summary">
                <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
                <p><strong>Total Profit:</strong> $${totalProfit.toFixed(2)}</p>
                <p><strong>Profit Margin:</strong> ${profitMargin.toFixed(
                  2
                )}%</p>
              </div>
              
              <h2>Returns Analysis</h2>
              <div class="summary">
                <p><strong>Total Quantity Returned:</strong> ${totalReturned}</p>
                <p><strong>Return Rate:</strong> ${returnRate.toFixed(2)}%</p>
              </div>
              
              ${
                returnStatistics.length > 0
                  ? `
                <h3>Return Reasons</h3>
                <table>
                  <tr>
                    <th>Reason</th>
                    <th>Count</th>
                    <th>Quantity</th>
                    <th>Amount ($)</th>
                  </tr>
                  ${returnStatistics
                    .map(
                      (stat) => `
                    <tr>
                      <td>${stat._id || "Not specified"}</td>
                      <td>${stat.returnCount}</td>
                      <td>${stat.quantityReturned}</td>
                      <td>$${stat.totalAmount.toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </table>
              `
                  : ""
              }
              
              <h2>Daily Sales Trend</h2>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Quantity Sold</th>
                  <th>Sales Amount ($)</th>
                </tr>
                ${dailySales
                  .map(
                    (day) => `
                  <tr>
                    <td>${day._id}</td>
                    <td>${day.quantitySold}</td>
                    <td>$${day.salesAmount.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>Top Salesmen</h2>
              <table>
                <tr>
                  <th>Salesman</th>
                  <th>Quantity Sold</th>
                  <th>Sales Amount ($)</th>
                </tr>
                ${topSalesmen
                  .map(
                    (salesman) => `
                  <tr>
                    <td>${salesman.salesmanName}</td>
                    <td>${salesman.quantitySold}</td>
                    <td>$${salesman.salesAmount.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <h2>Top Shops</h2>
              <table>
                <tr>
                  <th>Shop Name</th>
                  <th>Address</th>
                  <th>Quantity Sold</th>
                  <th>Sales Amount ($)</th>
                </tr>
                ${topShops
                  .map(
                    (shop) => `
                  <tr>
                    <td>${shop.shopName}</td>
                    <td>${shop.address}</td>
                    <td>${shop.quantitySold}</td>
                    <td>$${shop.salesAmount.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
              
              <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Sathira Sweet Management System</p>
              </div>
            </body>
          </html>
        `;

        // Generate PDF from HTML
        pdf
          .create(htmlContent, {
            format: "A4",
            border: {
              top: "20px",
              right: "20px",
              bottom: "20px",
              left: "20px",
            },
          })
          .toFile(filePath, (err, result) => {
            if (err) {
              console.error("PDF generation error:", err);
              return apiResponse.error(res, "Error generating PDF report", err);
            }

            // Send the file as a download
            res.download(filePath, fileName, (err) => {
              if (err) {
                console.error("File download error:", err);
                return apiResponse.error(res, "Error downloading report", err);
              }

              // Delete the file after download
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error("Error deleting temporary file:", err);
                }
              });
            });
          });
      } else {
        // Return JSON format
        return apiResponse.success(
          res,
          "Product report generated successfully",
          productReport
        );
      }
    } catch (error) {
      console.error("Product report error:", error);
      return apiResponse.error(res, "Error generating product report", error);
    }
  },
};

module.exports = reportController;
