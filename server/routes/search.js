// server/routes/search.js
const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const { auth } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

// Search products
router.get("/products", auth, searchController.searchProducts);

// Search shops
router.get("/shops", auth, searchController.searchShops);

// Search orders
router.get("/orders", auth, searchController.searchOrders);

// Global search across entities
router.get("/global", auth, searchController.globalSearch);

// Autocomplete search
router.get("/autocomplete", auth, searchController.autoCompleteSearch);

module.exports = router;
