const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getUsers,
    getUser,
    updateUserRole,
    deleteUser,
    getDashboardAnalytics
} = require('../controllers/admin');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.route('/users')
    .get(getUsers);

router.route('/users/:id')
    .get(getUser)
    .delete(deleteUser);

router.route('/users/:id/role')
    .put(updateUserRole);

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

module.exports = router; 