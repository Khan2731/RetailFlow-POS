const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginValidation, staffValidation } = require('../middleware/validation');

router.post('/register', staffValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', auth, getProfile);

module.exports = router;
