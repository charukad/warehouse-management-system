// server/controllers/shopController.js
const Shop = require("../models/Shop");
const User = require("../models/User");
const Order = require("../models/Order");
const RestockingSchedule = require("../models/RestockSchedule");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all shops - accessible to owner and warehouse manager
const getAllShops = async (req, res, next) => {
  try {
    // Optional query parameters
    const {
      search,
      territory,
      sortBy = "registration_date",
      sortOrder = "desc",
      isActive = "true",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // Filter by active status unless specified otherwise
    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    // Search by shop name, address, or contact
    if (search) {
      query.$or = [
        { shop_name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { contact_person: { $regex: search, $options: "i" } },
        { phone_number: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by territory
    if (territory) {
      // Find all salesmen in this territory
      const salesmen = await Salesman.find({ territoryId: territory }).select(
        "user"
      );
      const salesmenIds = salesmen.map((s) => s.user);

      query.created_by_salesman = { $in: salesmenIds };
    }

    // Use aggregation to join with user model and get additional data
    const aggregationPipeline = [
      // Match stage (apply our query)
      { $match: query },

      // Lookup creator details
      {
        $lookup: {
          from: "users",
          localField: "created_by_salesman",
          foreignField: "_id",
          as: "creatorDetails",
        },
      },

      // Unwind creator details
      {
        $unwind: {
          path: "$creatorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup shop user details (if a user account has been created for the shop)
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      // Unwind user details
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup restocking schedule
      {
        $lookup: {
          from: "restockingschedules",
          localField: "_id",
          foreignField: "shop",
          as: "restockingSchedule",
        },
      },

      // Unwind restocking schedule (take the most recent)
      {
        $unwind: {
          path: "$restockingSchedule",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Add computed fields
      {
        $addFields: {
          salesman_name: "$creatorDetails.fullName",
          user_active: "$userDetails.isActive",
          next_restock_date: "$restockingSchedule.next_restock_date",
          restocking_due: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$restockingSchedule.next_restock_date", null] },
                  {
                    $lte: ["$restockingSchedule.next_restock_date", new Date()],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
    ];

    // Add sorting
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    aggregationPipeline.push({
      $sort: { [sortBy]: sortDirection },
    });

    // Add pagination
    aggregationPipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    // Execute the aggregation
    const shops = await Shop.aggregate(aggregationPipeline);

    // Get total count for pagination
    const total = await Shop.countDocuments(query);

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      shops,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get shop by ID - accessible to owner, warehouse manager, shop itself, and assigned salesman
const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid shop ID", 400);
    }

    // Find shop
    const shop = await Shop.findById(id);

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found");
    }

    // Check if user is authorized to view this shop
    // Owner and warehouse manager can view any shop
    // Shop can only view itself
    // Salesman can only view shops they've created
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "shop" &&
      shop.user.toString() !== req.user.id &&
      req.user.role === "salesman" &&
      shop.created_by_salesman.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this shop"
      );
    }

    // Get salesman details
    const salesman = await User.findById(shop.created_by_salesman).select(
      "username fullName contactNumber"
    );

    // Get shop user account if exists
    let shopUser = null;
    if (shop.user) {
      shopUser = await User.findById(shop.user).select(
        "username email isActive lastLogin"
      );
    }

    // Get latest restocking schedule
    const restockingSchedule = await RestockingSchedule.findOne({ shop: id })
      .sort({ created_at: -1 })
      .populate("salesman", "fullName username");

    // Get recent orders
    const recentOrders = await Order.find({ shop: id })
      .sort({ order_date: -1 })
      .limit(5)
      .populate("salesman", "fullName username");

    return ApiResponse.success(res, {
      shop,
      salesman,
      shopUser,
      restockingSchedule,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// Create new shop - accessible to salesman only
const createShop = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Make sure the user is a salesman
    if (req.user.role !== "salesman") {
      return ApiResponse.forbidden(res, "Only salesmen can register new shops");
    }

    const {
      shop_name,
      address,
      contact_person,
      phone_number,
      latitude,
      longitude,
      shop_type,
      create_user_account,
      email,
      notes,
      next_restock_date,
    } = req.body;

    // Validate required fields
    if (
      !shop_name ||
      !address ||
      !contact_person ||
      !phone_number ||
      !latitude ||
      !longitude
    ) {
      return ApiResponse.error(
        res,
        "Shop name, address, contact person, phone number, and location are required",
        400
      );
    }

    // Check if a shop with this name and address already exists
    const existingShop = await Shop.findOne({
      shop_name,
      address,
    });

    if (existingShop) {
      return ApiResponse.error(
        res,
        "A shop with this name and address already exists",
        400
      );
    }

    // Check if we need to create a user account for the shop
    let shopUser = null;

    if (create_user_account && email) {
      // Check if a user with this email already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        await session.abortTransaction();
        return ApiResponse.error(
          res,
          "A user with this email already exists",
          400
        );
      }

      // Create a random password for the shop account
      const randomPassword = Math.random().toString(36).substring(2, 10);

      // Create user account
      shopUser = new User({
        username: email.split("@")[0], // Use part of email as username
        email,
        fullName: shop_name,
        password: randomPassword, // This will be hashed by the pre-save hook
        contactNumber: phone_number,
        role: "shop",
        createdAt: new Date(),
      });

      await shopUser.save({ session });

      // In a real application, you would send an email to the shop with their login credentials
      // For now, we'll just log them for demonstration purposes
      console.log(
        `Shop account created with email: ${email} and password: ${randomPassword}`
      );
    }

    // Create shop record
    const shop = new Shop({
      shop_name,
      address,
      contact_person,
      phone_number,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      created_by_salesman: req.user.id,
      registration_date: new Date(),
      shop_type: shop_type || "retail",
      isActive: true,
      user: shopUser ? shopUser._id : null,
      notes,
    });

    await shop.save({ session });

    // Create restocking schedule if next_restock_date is provided
    if (next_restock_date) {
      const restockingSchedule = new RestockingSchedule({
        shop: shop._id,
        next_restock_date: new Date(next_restock_date),
        frequency: "weekly", // Default frequency
        salesman: req.user.id,
        is_active: true,
      });

      await restockingSchedule.save({ session });
    }

    await session.commitTransaction();

    // Format the response
    const shopWithDetails = {
      ...shop.toObject(),
      salesman: {
        id: req.user.id,
        fullName: req.user.fullName,
        username: req.user.username,
      },
    };

    if (shopUser) {
      shopWithDetails.user_account = {
        email: shopUser.email,
        username: shopUser.username,
      };
    }

    return ApiResponse.success(
      res,
      { shop: shopWithDetails },
      "Shop registered successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Update shop details - accessible to shop itself and assigned salesman
const updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid shop ID", 400);
    }

    // Find shop
    const shop = await Shop.findById(id);

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found");
    }

    // Check if user is authorized to update this shop
    // Shop can only update itself
    // Salesman can only update shops they've created
    if (
      req.user.role === "shop" &&
      (!shop.user || shop.user.toString() !== req.user.id) &&
      req.user.role === "salesman" &&
      shop.created_by_salesman.toString() !== req.user.id &&
      req.user.role !== "owner"
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to update this shop"
      );
    }

    // Handle location update if provided
    if (updateData.latitude && updateData.longitude) {
      updateData.location = {
        type: "Point",
        coordinates: [
          parseFloat(updateData.longitude),
          parseFloat(updateData.latitude),
        ],
      };

      // Remove individual lat/long fields from update
      delete updateData.latitude;
      delete updateData.longitude;
    }

    // Prevent shops from changing their creator or user associations
    if (req.user.role === "shop") {
      delete updateData.created_by_salesman;
      delete updateData.user;
      delete updateData.isActive;
    }

    // Update shop
    const updatedShop = await Shop.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Handle restocking schedule update if provided
    if (updateData.next_restock_date) {
      await RestockingSchedule.findOneAndUpdate(
        { shop: id, isActive: true },
        {
          $set: {
            next_restock_date: new Date(updateData.next_restock_date),
            updated_at: new Date(),
            salesman:
              req.user.role === "salesman"
                ? req.user.id
                : shop.created_by_salesman,
          },
        },
        { new: true, upsert: true }
      );
    }

    return ApiResponse.success(
      res,
      { shop: updatedShop },
      "Shop updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Deactivate shop - accessible to owner only
const deactivateShop = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid shop ID", 400);
    }

    // Find shop
    const shop = await Shop.findById(id);

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found");
    }

    // Update shop status
    shop.isActive = false;
    await shop.save();

    // If shop has a user account, deactivate it too
    if (shop.user) {
      await User.findByIdAndUpdate(shop.user, { isActive: false });
    }

    // Deactivate any active restocking schedules
    await RestockingSchedule.updateMany(
      { shop: id, isActive: true },
      { isActive: false }
    );

    return ApiResponse.success(res, { shop }, "Shop deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// Reactivate shop - accessible to owner only
const reactivateShop = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid shop ID", 400);
    }

    // Find shop
    const shop = await Shop.findById(id);

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found");
    }

    // Update shop status
    shop.isActive = true;
    await shop.save();

    // If shop has a user account, reactivate it too
    if (shop.user) {
      await User.findByIdAndUpdate(shop.user, { isActive: true });
    }

    return ApiResponse.success(res, { shop }, "Shop reactivated successfully");
  } catch (error) {
    next(error);
  }
};

// Get shops by territory - accessible to owner and warehouse manager
const getShopsByTerritory = async (req, res, next) => {
  try {
    const { territoryId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    if (!territoryId) {
      return ApiResponse.error(res, "Territory ID is required", 400);
    }

    // Find all salesmen in this territory
    const salesmen = await Salesman.find({ territoryId }).select("user");
    const salesmenIds = salesmen.map((s) => s.user);

    // Get total count for pagination
    const total = await Shop.countDocuments({
      created_by_salesman: { $in: salesmenIds },
      isActive: true,
    });

    // Execute query with pagination
    const shops = await Shop.find({
      created_by_salesman: { $in: salesmenIds },
      isActive: true,
    })
      .sort({ registration_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("created_by_salesman", "fullName username");

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      shops,
      territory: territoryId,
      salesmen_count: salesmenIds.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get shops by salesman - accessible to owner, warehouse manager, and the assigned salesman
const getShopsBySalesman = async (req, res, next) => {
  try {
    const { salesmanId } = req.params;
    const { limit = 10, page = 1, activeOnly = "true" } = req.query;
    const skip = (page - 1) * limit;

    // Validate salesmanId
    if (!mongoose.Types.ObjectId.isValid(salesmanId)) {
      return ApiResponse.error(res, "Invalid salesman ID", 400);
    }

    // Check if user is authorized to view this salesman's shops
    // Owner and warehouse manager can view any salesman's shops
    // Salesman can only view their own shops
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "salesman" &&
      salesmanId !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this salesman's shops"
      );
    }

    // Check if salesman exists
    const salesman = await User.findOne({
      _id: salesmanId,
      role: "salesman",
    });

    if (!salesman) {
      return ApiResponse.notFound(res, "Salesman not found");
    }

    // Build query
    const query = { created_by_salesman: salesmanId };

    // Add active filter if specified
    if (activeOnly === "true") {
      query.isActive = true;
    }

    // Get total count for pagination
    const total = await Shop.countDocuments(query);

    // Execute query with pagination
    const shops = await Shop.find(query)
      .sort({ registration_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get the latest restocking schedule for each shop
    const shopsWithRestockingInfo = await Promise.all(
      shops.map(async (shop) => {
        const restockingSchedule = await RestockingSchedule.findOne({
          shop: shop._id,
          isActive: true,
        }).sort({ created_at: -1 });

        const shopObj = shop.toObject();

        if (restockingSchedule) {
          shopObj.next_restock_date = restockingSchedule.next_restock_date;
          shopObj.restocking_due =
            restockingSchedule.next_restock_date <= new Date();
        }

        return shopObj;
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      shops: shopsWithRestockingInfo,
      salesman: {
        id: salesman._id,
        fullName: salesman.fullName,
        username: salesman.username,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get nearby shops - accessible to salesman only
const getNearbyShops = async (req, res, next) => {
  try {
    // Make sure the user is a salesman
    if (req.user.role !== "salesman") {
      return ApiResponse.forbidden(
        res,
        "Only salesmen can access nearby shops"
      );
    }

    const { latitude, longitude, maxDistance = 10000, limit = 20 } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return ApiResponse.error(res, "Latitude and longitude are required", 400);
    }

    // Convert string parameters to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = parseInt(maxDistance);

    // Validate coordinates
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return ApiResponse.error(res, "Invalid coordinates", 400);
    }

    // Find nearby shops
    const shops = await Shop.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: distance,
        },
      },
    }).limit(parseInt(limit));

    // Get the latest restocking schedule for each shop
    const shopsWithRestockingInfo = await Promise.all(
      shops.map(async (shop) => {
        const restockingSchedule = await RestockingSchedule.findOne({
          shop: shop._id,
          isActive: true,
        }).sort({ created_at: -1 });

        const shopObj = shop.toObject();

        if (restockingSchedule) {
          shopObj.next_restock_date = restockingSchedule.next_restock_date;
          shopObj.restocking_due =
            restockingSchedule.next_restock_date <= new Date();
          shopObj.restock_days_overdue =
            restockingSchedule.next_restock_date <= new Date()
              ? Math.floor(
                  (new Date() - restockingSchedule.next_restock_date) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;
        }

        return shopObj;
      })
    );

    return ApiResponse.success(res, {
      shops: shopsWithRestockingInfo,
      current_location: {
        latitude: lat,
        longitude: lng,
      },
      search_radius_meters: distance,
    });
  } catch (error) {
    next(error);
  }
};

// Get shops due for restocking - accessible to salesman and warehouse manager
const getShopsDueForRestocking = async (req, res, next) => {
  try {
    const { salesmanId, days = 3, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Build query for restocking schedules
    const query = {
      next_restock_date: { $lte: new Date() },
      isActive: true,
    };

    // Filter by salesman if specified
    if (salesmanId) {
      // Validate salesmanId
      if (!mongoose.Types.ObjectId.isValid(salesmanId)) {
        return ApiResponse.error(res, "Invalid salesman ID", 400);
      }

      query.salesman = salesmanId;
    } else if (req.user.role === "salesman") {
      // If user is a salesman, only show their shops
      query.salesman = req.user.id;
    }

    // Get overdue restocking schedules
    const restockingSchedules = await RestockingSchedule.find(query)
      .sort({ next_restock_date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("shop", "shop_name address phone_number location")
      .populate("salesman", "fullName username");

    // Prepare response
    const dueShops = restockingSchedules.map((schedule) => {
      const daysOverdue = Math.floor(
        (new Date() - schedule.next_restock_date) / (1000 * 60 * 60 * 24)
      );

      return {
        shop: schedule.shop,
        next_restock_date: schedule.next_restock_date,
        days_overdue: daysOverdue,
        salesman: schedule.salesman,
        priority: daysOverdue > days ? "high" : "normal",
      };
    });

    // Get total count for pagination
    const total = await RestockingSchedule.countDocuments(query);

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      due_shops: dueShops,
      total_overdue: total,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deactivateShop,
  reactivateShop,
  getShopsByTerritory,
  getShopsBySalesman,
  getNearbyShops,
  getShopsDueForRestocking,
};
