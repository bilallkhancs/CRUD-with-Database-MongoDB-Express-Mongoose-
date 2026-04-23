const Product = require('../models/productModel');

// ─── CREATE PRODUCT ─────────────────────────────────────────────
// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { title, price, description, category } = req.body;

    // Manual validation for clear error messages
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        message: 'Price is required',
      });
    }

    const product = await Product.create({ title, price, description, category });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET ALL PRODUCTS (with pagination, search, filter) ─────────
// GET /api/products?page=1&limit=10&search=phone&category=electronics
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    // Search by title (case-insensitive, partial match)
    if (search && search.trim() !== '') {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by category (case-insensitive)
    if (category && category.trim() !== '') {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // Sort direction
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj   = { [sortBy]: sortOrder };

    // Run queries in parallel for efficiency
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        total,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET SINGLE PRODUCT ─────────────────────────────────────────
// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // Invalid MongoDB ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID format: ${req.params.id}`,
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── UPDATE PRODUCT ─────────────────────────────────────────────
// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { title, price, description, category } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (title       !== undefined) updateData.title       = title;
    if (price       !== undefined) updateData.price       = price;
    if (description !== undefined) updateData.description = description;
    if (category    !== undefined) updateData.category    = category;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update',
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,           // return updated document
        runValidators: true, // run schema validators on update
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID format: ${req.params.id}`,
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── DELETE PRODUCT ─────────────────────────────────────────────
// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: product,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID format: ${req.params.id}`,
      });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
