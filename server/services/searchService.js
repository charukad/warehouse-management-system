// server/services/searchService.js
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Order = require("../models/ShopOrder");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Search for products using text search
 * @param {string} query - The search query
 * @param {Object} filters - Additional filters
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} - Search results with pagination
 */
const searchProducts = async (query, filters = {}, options = {}) => {
  try {
    const { page = 1, limit = 20, sortBy = "score", sortOrder = -1 } = options;
    const skip = (page - 1) * limit;

    // Base search criteria
    let searchCriteria = {};

    // If we have a search query, use text search
    if (query && query.trim() !== "") {
      searchCriteria.$text = { $search: query };
    }

    // Add any additional filters
    if (filters.product_type) {
      searchCriteria.product_type = filters.product_type;
    }

    if (filters.min_price !== undefined) {
      searchCriteria.retail_price = { $gte: filters.min_price };
    }

    if (filters.max_price !== undefined) {
      if (searchCriteria.retail_price) {
        searchCriteria.retail_price.$lte = filters.max_price;
      } else {
        searchCriteria.retail_price = { $lte: filters.max_price };
      }
    }

    if (filters.is_active !== undefined) {
      searchCriteria.is_active = filters.is_active === "true";
    }

    // Set up sorting
    let sort = {};
    if (query && query.trim() !== "" && sortBy === "score") {
      sort = { score: { $meta: "textScore" } };
    } else {
      sort[sortBy || "created_at"] = sortOrder === -1 ? -1 : 1;
    }

    // Perform the search with pagination
    const products = await Product.find(searchCriteria, {
      score: { $meta: "textScore" },
    })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Product.countDocuments(searchCriteria);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

/**
 * Search for shops using text search
 * @param {string} query - The search query
 * @param {Object} filters - Additional filters
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} - Search results with pagination
 */
const searchShops = async (query, filters = {}, options = {}) => {
  try {
    const { page = 1, limit = 20, sortBy = "score", sortOrder = -1 } = options;
    const skip = (page - 1) * limit;

    // Base search criteria
    let searchCriteria = {};

    // If we have a search query, use text search
    if (query && query.trim() !== "") {
      searchCriteria.$text = { $search: query };
    }

    // Add any additional filters
    if (filters.shop_type) {
      searchCriteria.shop_type = filters.shop_type;
    }

    if (filters.created_by_salesman_id) {
      searchCriteria.created_by_salesman_id = filters.created_by_salesman_id;
    }

    if (filters.is_active !== undefined) {
      searchCriteria.is_active = filters.is_active === "true";
    }

    // Geographic filters if provided
    if (filters.near) {
      const [lng, lat] = filters.near
        .split(",")
        .map((coord) => parseFloat(coord));
      const maxDistance = filters.maxDistance || 10000; // Default 10km

      searchCriteria.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    // Set up sorting
    let sort = {};
    if (query && query.trim() !== "" && sortBy === "score") {
      sort = { score: { $meta: "textScore" } };
    } else {
      sort[sortBy || "registration_date"] = sortOrder === -1 ? -1 : 1;
    }

    // Perform the search with pagination
    const shops = await Shop.find(searchCriteria, {
      score: { $meta: "textScore" },
    })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Shop.countDocuments(searchCriteria);

    return {
      shops,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error searching shops:", error);
    throw error;
  }
};

/**
 * Search for orders using various criteria
 * @param {Object} filters - Search filters
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} - Search results with pagination
 */
const searchOrders = async (filters = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "order_date",
      sortOrder = -1,
    } = options;
    const skip = (page - 1) * limit;

    // Base filter criteria
    let filterCriteria = {};

    // Shop ID filter
    if (filters.shop_id) {
      filterCriteria.shop_id = mongoose.Types.ObjectId(filters.shop_id);
    }

    // Salesman ID filter
    if (filters.salesman_id) {
      filterCriteria.salesman_id = mongoose.Types.ObjectId(filters.salesman_id);
    }

    // Date range filters
    if (filters.start_date) {
      filterCriteria.order_date = { $gte: new Date(filters.start_date) };
    }

    if (filters.end_date) {
      if (filterCriteria.order_date) {
        filterCriteria.order_date.$lte = new Date(filters.end_date);
      } else {
        filterCriteria.order_date = { $lte: new Date(filters.end_date) };
      }
    }

    // Status filter
    if (filters.status) {
      filterCriteria.order_status = filters.status;
    }

    // Payment method filter
    if (filters.payment_method) {
      filterCriteria.payment_method = filters.payment_method;
    }

    // Amount range filters
    if (filters.min_amount !== undefined) {
      filterCriteria.total_amount = { $gte: parseFloat(filters.min_amount) };
    }

    if (filters.max_amount !== undefined) {
      if (filterCriteria.total_amount) {
        filterCriteria.total_amount.$lte = parseFloat(filters.max_amount);
      } else {
        filterCriteria.total_amount = { $lte: parseFloat(filters.max_amount) };
      }
    }

    // Product ID filter (orders containing a specific product)
    const pipeline = [];

    if (filters.product_id) {
      // We need to use aggregation to check order items
      pipeline.push(
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "order_id",
            as: "items",
          },
        },
        {
          $match: {
            "items.product_id": mongoose.Types.ObjectId(filters.product_id),
          },
        }
      );
    }

    // Add the main filter
    if (Object.keys(filterCriteria).length > 0) {
      pipeline.push({ $match: filterCriteria });
    }

    // Add sort
    pipeline.push({ $sort: { [sortBy]: sortOrder === -1 ? -1 : 1 } });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute the aggregation
    const orders = await Order.aggregate(pipeline);

    // Get total count (we need a separate aggregation for this)
    const countPipeline = [...pipeline];
    // Remove skip and limit from the count pipeline
    countPipeline.splice(countPipeline.length - 2, 2);
    // Add count stage
    countPipeline.push({ $count: "total" });

    const totalResult = await Order.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error searching orders:", error);
    throw error;
  }
};

/**
 * Combined search across multiple entities
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Combined search results
 */
const globalSearch = async (query, options = {}) => {
  try {
    const { limit = 5 } = options;

    if (!query || query.trim() === "") {
      return {
        products: [],
        shops: [],
        orders: [],
        users: [],
      };
    }

    // Search products
    const productsPromise = Product.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    // Search shops
    const shopsPromise = Shop.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    // Search users (for admins only)
    const usersPromise = User.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" }, password: 0 }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    // Search orders by reference number
    const ordersPromise = Order.find({
      reference_number: { $regex: query, $options: "i" },
    })
      .sort({ order_date: -1 })
      .limit(limit);

    // Execute all searches in parallel
    const [products, shops, users, orders] = await Promise.all([
      productsPromise,
      shopsPromise,
      usersPromise,
      ordersPromise,
    ]);

    return {
      products,
      shops,
      orders,
      users,
    };
  } catch (error) {
    console.error("Error performing global search:", error);
    throw error;
  }
};

/**
 * Search for items with autocomplete functionality
 * @param {string} query - The search query
 * @param {string} entity - The entity to search (product, shop, etc.)
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Autocomplete suggestions
 */
const autoCompleteSearch = async (query, entity, options = {}) => {
  try {
    const { limit = 10 } = options;

    if (!query || query.trim() === "") {
      return [];
    }

    switch (entity) {
      case "product":
        return await Product.find(
          { product_name: { $regex: `^${query}`, $options: "i" } },
          { product_name: 1, product_code: 1, retail_price: 1 }
        ).limit(limit);

      case "shop":
        return await Shop.find(
          { shop_name: { $regex: `^${query}`, $options: "i" } },
          { shop_name: 1, address: 1, phone_number: 1 }
        ).limit(limit);

      case "user":
        return await User.find(
          { username: { $regex: `^${query}`, $options: "i" } },
          { username: 1, full_name: 1, user_type: 1, password: 0 }
        ).limit(limit);

      default:
        throw new Error(`Unsupported entity type: ${entity}`);
    }
  } catch (error) {
    console.error("Error performing autocomplete search:", error);
    throw error;
  }
};

module.exports = {
  searchProducts,
  searchShops,
  searchOrders,
  globalSearch,
  autoCompleteSearch,
};
