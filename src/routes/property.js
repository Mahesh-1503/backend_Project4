const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProperties,
    getProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    favoriteProperty,
    unfavoriteProperty
} = require('../controllers/property');

// Include review routes
const reviewRouter = require('./reviews');
router.use('/:propertyId/reviews', reviewRouter);

// Public routes
router.route('/')
    .get(getProperties);

router.route('/:id')
    .get(getProperty);

// Protected routes
router.use(protect);

router.route('/')
    .post(authorize('agent', 'admin'), createProperty);

router.route('/:id')
    .put(authorize('agent', 'admin'), updateProperty)
    .delete(authorize('agent', 'admin'), deleteProperty);

router.route('/:id/favorite')
    .put(favoriteProperty);

router.route('/:id/unfavorite')
    .put(unfavoriteProperty);

module.exports = router; 