const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    visitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    visitDate: {
        type: Date,
        required: [true, 'Please add a visit date']
    },
    visitTime: {
        type: String,
        required: [true, 'Please add a visit time']
    },
    duration: {
        type: Number,
        required: [true, 'Please add visit duration'],
        min: [15, 'Duration must be at least 15 minutes'],
        max: [180, 'Duration cannot be more than 180 minutes']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Cancellation reason cannot be more than 500 characters']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Prevent multiple pending visits for the same property and visitor
VisitSchema.index(
    { property: 1, visitor: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }
);

// Prevent overlapping visits for the same property
VisitSchema.index(
    { property: 1, visitDate: 1, visitTime: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ['pending', 'approved'] }
        }
    }
);

module.exports = mongoose.model('Visit', VisitSchema); 