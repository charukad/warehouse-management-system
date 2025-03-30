// server/routes/orders.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const orderController = require("../controllers/orderController");
const { validateOrder } = require("../middleware/validation");

// Get all orders - accessible to owner and warehouse manager
router.get(
  "/",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  orderController.getAllOrders
);

// Get order by ID - accessible to owner, warehouse manager, shop that placed order, and salesman who processed it
router.get("/:id", authenticate, orderController.getOrderById);

// Create order - accessible to salesman and shop
router.post(
  "/",
  authenticate,
  checkRole("salesman", "shop"),
  validateOrder,
  orderController.createOrder
);

// Update order status - accessible to salesman who processed the order
router.put(
  "/:id/status",
  authenticate,
  checkRole("salesman"),
  orderController.updateOrderStatus
);

// Get orders by shop - accessible to owner, warehouse manager, shop itself, and assigned salesman
router.get("/shop/:shopId", authenticate, orderController.getOrdersByShop);

// Get orders by salesman - accessible to owner, warehouse manager, and the salesman
router.get(
  "/salesman/:salesmanId",
  authenticate,
  orderController.getOrdersBySalesman
);

// Get current shop's orders - accessible to the logged in shop
router.get(
  "/my-orders",
  authenticate,
  checkRole("shop"),
  orderController.getCurrentShopOrders
);

// Get current salesman's processed orders - accessible to the logged in salesman
router.get(
  "/my-processed-orders",
  authenticate,
  checkRole("salesman"),
  orderController.getCurrentSalesmanOrders
);

module.exports = router;
