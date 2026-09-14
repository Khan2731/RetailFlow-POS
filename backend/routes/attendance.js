const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getDailyAttendance,
  upsertAttendance,
  bulkUpsertAttendance,
  getMonthlyReport,
  deleteAttendance,
  getTodayStats,
} = require('../controllers/attendanceController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/stats/today', auth, getTodayStats);
router.get('/daily', auth, getDailyAttendance);
router.get('/monthly-report', auth, getMonthlyReport);
router.get('/', auth, getAttendance);
router.post('/', auth, adminAuth, upsertAttendance);
router.post('/bulk', auth, adminAuth, bulkUpsertAttendance);
router.delete('/:id', auth, adminAuth, deleteAttendance);

module.exports = router;
