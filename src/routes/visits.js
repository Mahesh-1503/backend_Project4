const express = require('express');
const {
    requestVisit,
    getVisits,
    getVisit,
    updateVisitStatus,
    cancelVisit,
    getAvailableSlots
} = require('../controllers/visit');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/properties/:propertyId/available-slots', getAvailableSlots);

// Protected routes
router.use(protect);

// Property visit routes
router.post('/properties/:propertyId/visits', requestVisit);

// Visit management routes
router.get('/', getVisits);
router.get('/:id', getVisit);
router.put('/:id/cancel', cancelVisit);

// Agent only routes
router.put('/:id/status', authorize('agent', 'admin'), updateVisitStatus);

module.exports = router; 