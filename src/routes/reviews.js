const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');
const {
    createReview,
    getReviews,
    getReview,
    updateReview,
    deleteReview,
    getAllReviews,
    updateReviewStatus
} = require('../controllers/review');

// Public routes
router.route('/')
    .get(getReviews);

router.route('/:id')
    .get(getReview);

// Protected routes
router.use(protect);

router.route('/')
    .post(createReview);

router.route('/:id')
    .put(updateReview)
    .delete(deleteReview);

// Admin routes
router.use(authorize('admin'));

router.route('/admin/reviews')
    .get(getAllReviews);

router.route('/admin/reviews/:id/status')
    .put(updateReviewStatus);

module.exports = router; 