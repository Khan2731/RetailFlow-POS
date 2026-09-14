const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { adminAuth } = require('../middleware/auth');

router.get('/dashboard', adminAuth, getDashboardAnalytics);

module.exports = router;
