const Visit = require('../models/Visit');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Request a property visit
// @route   POST /api/properties/:propertyId/visits
// @access  Private
exports.requestVisit = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.propertyId);

        if (!property) {
            return next(new ErrorResponse('Property not found', 404));
        }

        // Add property, agent, and visitor to req.body
        req.body.property = req.params.propertyId;
        req.body.agent = property.agent;
        req.body.visitor = req.user.id;

        // Check for existing pending visit
        const existingVisit = await Visit.findOne({
            property: req.params.propertyId,
            visitor: req.user.id,
            status: 'pending'
        });

        if (existingVisit) {
            return next(new ErrorResponse('You already have a pending visit request for this property', 400));
        }

        // Check for overlapping visits
        const overlappingVisit = await Visit.findOne({
            property: req.params.propertyId,
            visitDate: req.body.visitDate,
            visitTime: req.body.visitTime,
            status: { $in: ['pending', 'approved'] }
        });

        if (overlappingVisit) {
            return next(new ErrorResponse('This time slot is already booked', 400));
        }

        const visit = await Visit.create(req.body);

        res.status(201).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all visits for a user
// @route   GET /api/visits
// @access  Private
exports.getVisits = async (req, res, next) => {
    try {
        const query = {
            $or: [
                { visitor: req.user.id },
                { agent: req.user.id }
            ],
            isDeleted: false
        };

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        const visits = await Visit.find(query)
            .populate('property', 'title price images')
            .populate('visitor', 'name email')
            .populate('agent', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: visits.length,
            data: visits
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Private
exports.getVisit = async (req, res, next) => {
    try {
        const visit = await Visit.findOne({
            _id: req.params.id,
            $or: [
                { visitor: req.user.id },
                { agent: req.user.id }
            ],
            isDeleted: false
        })
            .populate('property', 'title price images')
            .populate('visitor', 'name email')
            .populate('agent', 'name email');

        if (!visit) {
            return next(new ErrorResponse('Visit not found', 404));
        }

        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update visit status (agent only)
// @route   PUT /api/visits/:id/status
// @access  Private (Agent)
exports.updateVisitStatus = async (req, res, next) => {
    try {
        const visit = await Visit.findOne({
            _id: req.params.id,
            agent: req.user.id,
            isDeleted: false
        });

        if (!visit) {
            return next(new ErrorResponse('Visit not found', 404));
        }

        // Only allow status updates for pending visits
        if (visit.status !== 'pending') {
            return next(new ErrorResponse('Can only update status of pending visits', 400));
        }

        visit.status = req.body.status;

        // Add cancellation reason if status is cancelled
        if (req.body.status === 'cancelled' && req.body.cancellationReason) {
            visit.cancellationReason = req.body.cancellationReason;
        }

        await visit.save();

        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel visit (visitor only)
// @route   PUT /api/visits/:id/cancel
// @access  Private
exports.cancelVisit = async (req, res, next) => {
    try {
        const visit = await Visit.findOne({
            _id: req.params.id,
            visitor: req.user.id,
            isDeleted: false
        });

        if (!visit) {
            return next(new ErrorResponse('Visit not found', 404));
        }

        // Only allow cancellation of pending or approved visits
        if (!['pending', 'approved'].includes(visit.status)) {
            return next(new ErrorResponse('Can only cancel pending or approved visits', 400));
        }

        visit.status = 'cancelled';
        visit.cancellationReason = req.body.cancellationReason;
        await visit.save();

        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get available time slots for a property
// @route   GET /api/properties/:propertyId/available-slots
// @access  Public
exports.getAvailableSlots = async (req, res, next) => {
    try {
        const { date } = req.query;
        if (!date) {
            return next(new ErrorResponse('Please provide a date', 400));
        }

        // Get all booked slots for the date
        const bookedSlots = await Visit.find({
            property: req.params.propertyId,
            visitDate: date,
            status: { $in: ['pending', 'approved'] }
        }).select('visitTime duration');

        // Generate all possible time slots (9 AM to 5 PM, 30-minute intervals)
        const allSlots = [];
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                allSlots.push(time);
            }
        }

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => {
            return !bookedSlots.some(booked => {
                const bookedTime = new Date(`2000-01-01T${booked.visitTime}`);
                const slotTime = new Date(`2000-01-01T${slot}`);
                const endTime = new Date(slotTime.getTime() + booked.duration * 60000);
                return slotTime >= bookedTime && slotTime < endTime;
            });
        });

        res.status(200).json({
            success: true,
            data: availableSlots
        });
    } catch (err) {
        next(err);
    }
}; 