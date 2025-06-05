const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const cloudinary = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const profile = await UserProfile.findOne({ user: req.user.id })
            .populate('user', 'name email role');

        if (!profile) {
            return next(new ErrorResponse('Profile not found', 404));
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create or update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        let profile = await UserProfile.findOne({ user: req.user.id });

        if (profile) {
            // Update existing profile
            profile = await UserProfile.findOneAndUpdate(
                { user: req.user.id },
                { $set: req.body },
                { new: true, runValidators: true }
            );
        } else {
            // Create new profile
            req.body.user = req.user.id;
            profile = await UserProfile.create(req.body);
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Upload profile image
// @route   PUT /api/profile/image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.files || !req.files.image) {
            return next(new ErrorResponse('Please upload an image', 400));
        }

        const file = req.files.image;

        // Check file type
        if (!file.mimetype.startsWith('image')) {
            return next(new ErrorResponse('Please upload an image file', 400));
        }

        // Check file size
        if (file.size > process.env.MAX_FILE_UPLOAD) {
            return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
        }

        // Upload to cloudinary
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'profile-images',
            width: 300,
            crop: "scale"
        });

        // Update profile with new image
        const profile = await UserProfile.findOneAndUpdate(
            { user: req.user.id },
            { profileImage: result.secure_url },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Save search preferences
// @route   POST /api/profile/saved-searches
// @access  Private
exports.saveSearch = async (req, res, next) => {
    try {
        const { name, filters } = req.body;

        if (!name || !filters) {
            return next(new ErrorResponse('Please provide name and filters', 400));
        }

        const profile = await UserProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $push: {
                    savedSearches: {
                        name,
                        filters
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete saved search
// @route   DELETE /api/profile/saved-searches/:searchId
// @access  Private
exports.deleteSavedSearch = async (req, res, next) => {
    try {
        const profile = await UserProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $pull: {
                    savedSearches: { _id: req.params.searchId }
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update language and currency preferences
// @route   PUT /api/profile/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
    try {
        const { language, currency } = req.body;

        const profile = await UserProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                'preferences.language': language || 'en',
                'preferences.currency': currency || 'USD'
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (err) {
        next(err);
    }
}; 