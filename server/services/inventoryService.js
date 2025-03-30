// server/services/inventoryService.js
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const notificationService = require("./notificationService");

// Other inventory service functions...

/**
 * Update inventory quantity
 * @param {string} productId - The product ID
 * @param {number} quantityChange - The quantity change (positive for increase, negative for decrease)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The updated inventory
 */
const updateInventoryQuantity = async (
  productId,
  quantityChange,
  options = {}
) => {
  try {
    const { reason, userId } = options;

    // Find the inventory item
    const inventory = await Inventory.findOne({ product_id: productId });

    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    // Calculate new stock level
    const newStock = inventory.current_stock + quantityChange;

    // Update the inventory
    const updatedInventory = await Inventory.findOneAndUpdate(
      { product_id: productId },
      {
        current_stock: newStock,
        last_updated: new Date(),
      },
      { new: true }
    );

    // Get the product details
    const product = await Product.findById(productId);

    // Check if inventory has fallen below threshold
    if (newStock <= product.min_stock_level) {
      // Create and send inventory alerts
      await notificationService.createInventoryAlert(product, newStock);
    }

    return updatedInventory;
  } catch (error) {
    console.error("Error updating inventory quantity:", error);
    throw error;
  }
};

// Export all functions...
