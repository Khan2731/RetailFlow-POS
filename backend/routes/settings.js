const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { auth, adminAuth } = require('../middleware/auth');
const { settingsValidation } = require('../middleware/validation');

router.get('/', auth, getSettings);
router.put('/', auth, adminAuth, settingsValidation, updateSettings);

module.exports = router;
