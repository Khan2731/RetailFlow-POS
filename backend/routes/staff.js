const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  getStaffByRole,
  getStaffByShift,
  createStaff,
  updateStaff,
  updateStaffPassword,
  deleteStaff
} = require('../controllers/staffController');
const { auth, adminAuth } = require('../middleware/auth');
const { staffValidation } = require('../middleware/validation');

router.get('/', auth, getAllStaff);
router.get('/role/:role', auth, getStaffByRole);
router.get('/shift/:shift', auth, getStaffByShift);
router.get('/:id', auth, getStaffById);
router.post('/', auth, adminAuth, staffValidation, createStaff);
router.put('/:id', auth, adminAuth, staffValidation, updateStaff);
router.patch('/:id/password', auth, adminAuth, updateStaffPassword);
router.delete('/:id', auth, adminAuth, deleteStaff);

module.exports = router;
