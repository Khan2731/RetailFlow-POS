const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('base_price').custom((value, { req }) => {
    const variants = Array.isArray(req.body.variants) ? req.body.variants : [];
    const hasValidVariants = variants.some((variant) => {
      const sizeName = typeof variant?.size_name === 'string' ? variant.size_name.trim() : '';
      const priceValue = parseFloat(variant?.price);
      return sizeName && Number.isFinite(priceValue) && priceValue >= 0 && priceValue > 0;
    });

    if (hasValidVariants) {
      return true;
    }

    if (value === undefined || value === null || value === '') {
      throw new Error('Base price is required for non-variant products');
    }
    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
      throw new Error('Base price must be a positive number');
    }
    return true;
  }),
  body('variants').optional().isArray().withMessage('Variants must be an array'),
  body('variants.*.size_name').optional().isString().notEmpty().withMessage('Each variant must have a size name'),
  body('variants.*.price').optional().custom((value) => {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const parsedValue = parseFloat(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new Error('Each variant price must be a non-negative number');
    }
    return true;
  }),
  validateRequest
];

const orderValidation = [
  body('order_type')
    .optional()
    .isIn(['dine_in', 'take_away', 'delivery'])
    .withMessage('Invalid order type'),
  body('table_no')
    .if((value, { req }) => (req.body.order_type || 'dine_in') === 'dine_in')
    .isInt({ min: 1 })
    .withMessage('Table number must be a positive integer'),
  body('waiter_name')
    .if((value, { req }) => (req.body.order_type || 'dine_in') === 'dine_in')
    .trim()
    .notEmpty()
    .withMessage('Waiter name is required'),
  validateRequest
];

const orderItemValidation = [
  body('order_id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
  body('product_id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  validateRequest
];

const billingValidation = [
  body('order_id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('tax').isFloat({ min: 0 }).withMessage('Tax must be a positive number'),
  body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('payment_method').trim().notEmpty().withMessage('Payment method is required'),
  validateRequest
];

const staffValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').custom((value, { req }) => {
    // Require password only on creation (POST); on update (PUT) password is optional
    if (req.method === 'POST') {
      if (!value || value.length < 6) throw new Error('Password must be at least 6 characters');
    }
    return true;
  }),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('shift').trim().notEmpty().withMessage('Shift is required'),
  validateRequest
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  validateRequest
];

const inventoryValidation = [
  body('item_name').trim().notEmpty().withMessage('Item name is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('price').custom((value) => {
    if (value === undefined || value === null || value === '') {
      throw new Error('Price is required');
    }
    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
      throw new Error('Price must be a positive number');
    }
    return true;
  }),
  validateRequest
];

const deliveryValidation = [
  body('order_id')
    .if((value, { req }) => req.method === 'POST')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('delivery_fee').isFloat({ min: 0 }).withMessage('Delivery fee must be a positive number'),
  validateRequest
];

const dealValidation = [
  body('name').trim().notEmpty().withMessage('Deal name is required'),
  body('deal_price').custom((value) => {
    if (value === undefined || value === null || value === '') {
      throw new Error('Deal price is required');
    }
    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
      throw new Error('Deal price must be a positive number');
    }
    return true;
  }),
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Each deal item must have a valid product id'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each deal item must have a quantity of at least 1'),
  validateRequest
];

const settingsValidation = [
  body('restaurant_name').trim().notEmpty().withMessage('Restaurant name is required'),
  body('tagline').trim().notEmpty().withMessage('Tagline is required'),
  body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
  validateRequest
];

const expenseValidation = [
  body('category').trim().notEmpty().withMessage('Expense category is required'),
  body('description').optional().trim(),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('expense_date').optional().isISO8601().withMessage('Expense date must be valid'),
  validateRequest
];

module.exports = {
  validateRequest,
  productValidation,
  orderValidation,
  orderItemValidation,
  billingValidation,
  staffValidation,
  loginValidation,
  inventoryValidation,
  deliveryValidation,
  dealValidation,
  expenseValidation,
  settingsValidation,
};
