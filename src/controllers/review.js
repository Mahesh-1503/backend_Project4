const Review = require('../models/Review');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a review
// @route   POST /api/properties/:propertyId/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        // Add user and property to req.body
        req.body.user = req.user.id;
        req.body.property = req.params.propertyId;

        const property = await Property.findById(req.params.propertyId);

        if (!property) {
            return next(new ErrorResponse('Property not found', 404));
        }

        // Add agent to review
        req.body.agent = property.agent;

        // Check if user has already reviewed this property
        const existingReview = await Review.findOne({
            user: req.user.id,
            property: req.params.propertyId
        });

        if (existingReview) {
            return next(new ErrorResponse('You have already reviewed this property', 400));
        }

        const review = await Review.create(req.body);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all reviews for a property
// @route   GET /api/properties/:propertyId/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({
            property: req.params.propertyId,
            status: 'approved',
            isDeleted: false
        })
            .populate('user', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('user', 'name')
            .populate('property', 'title')
            .populate('agent', 'name');

        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        // Make sure user is review owner or admin
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse('Not authorized to update this review', 401));
        }

        review = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        // Make sure user is review owner or admin
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse('Not authorized to delete this review', 401));
        }

        review.isDeleted = true;
        await review.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all reviews (admin only)
// @route   GET /api/reviews
// @access  Private (Admin)
exports.getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name')
            .populate('property', 'title')
            .populate('agent', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update review status (admin only)
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin)
exports.updateReviewStatus = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return next(new ErrorResponse('Review not found', 404));
        }

        review.status = req.body.status;
        await review.save();

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (err) {
        next(err);
    }
}; 