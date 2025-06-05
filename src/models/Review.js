const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    rating: {
        type: Number,
        required: [true, 'Please add a rating'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Please add a comment'],
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    images: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
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

// Prevent user from submitting more than one review per property
ReviewSchema.index({ user: 1, property: 1 }, { unique: true });

// Static method to calculate average rating for a property
ReviewSchema.statics.getAverageRating = async function (propertyId) {
    const obj = await this.aggregate([
        {
            $match: {
                property: propertyId,
                status: 'approved',
                isDeleted: false
            }
        },
        {
            $group: {
                _id: '$property',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        if (obj[0]) {
            await this.model('Property').findByIdAndUpdate(propertyId, {
                averageRating: Math.round(obj[0].averageRating * 10) / 10,
                totalReviews: obj[0].totalReviews
            });
        } else {
            await this.model('Property').findByIdAndUpdate(propertyId, {
                averageRating: 0,
                totalReviews: 0
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
ReviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.property);
});

// Call getAverageRating after remove
ReviewSchema.post('remove', function () {
    this.constructor.getAverageRating(this.property);
});

module.exports = mongoose.model('Review', ReviewSchema); 