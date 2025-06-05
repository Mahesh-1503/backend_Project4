const express = require('express');
const {
    getProfile,
    updateProfile,
    uploadProfileImage,
    saveSearch,
    deleteSavedSearch,
    updatePreferences
} = require('../controllers/profile');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Profile routes
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/image', uploadProfileImage);

// Saved searches routes
router.post('/saved-searches', saveSearch);
router.delete('/saved-searches/:searchId', deleteSavedSearch);

// Preferences routes
router.put('/preferences', updatePreferences);

module.exports = router; 