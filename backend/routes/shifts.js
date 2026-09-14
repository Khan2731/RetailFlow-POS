const express = require('express');
const router = express.Router();
const { getActiveShift, startShift, closeShift } = require('../controllers/shiftController');
const { auth } = require('../middleware/auth');

router.get('/active', auth, getActiveShift);
router.post('/start', auth, startShift);
router.post('/close', auth, closeShift);

module.exports = router;
