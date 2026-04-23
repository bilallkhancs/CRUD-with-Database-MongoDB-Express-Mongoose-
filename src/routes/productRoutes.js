const express  = require('express');
const router   = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// /api/products
router.route('/')
  .get(getAllProducts)   // GET  /api/products?page=1&limit=10&search=phone&category=electronics
  .post(createProduct); // POST /api/products

// /api/products/:id
router.route('/:id')
  .get(getProductById)    // GET    /api/products/:id
  .put(updateProduct)     // PUT    /api/products/:id
  .delete(deleteProduct); // DELETE /api/products/:id

module.exports = router;
