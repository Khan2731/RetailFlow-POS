const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');
const { productValidation } = require('../middleware/validation');

router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.post('/', auth, adminAuth, productValidation, createProduct);
router.put('/:id', auth, adminAuth, productValidation, updateProduct);
router.delete('/:id', auth, adminAuth, deleteProduct);

module.exports = router;
