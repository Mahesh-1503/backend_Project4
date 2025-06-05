const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    location: {
        street: {
            type: String,
            required: [true, 'Please add a street address'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'Please add a city'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'Please add a state'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Please add a country'],
            trim: true
        },
        zipCode: {
        type: String,
            required: [true, 'Please add a zip code'],
        trim: true
        }
    },
    propertyType: {
        type: String,
        required: [true, 'Please add a property type'],
        enum: ['apartment', 'house', 'villa', 'condo', 'land', 'commercial'],
        default: 'apartment'
    },
    listingType: {
        type: String,
        required: [true, 'Please add a listing type'],
        enum: ['sale', 'rent'],
        default: 'sale'
    },
    features: {
        bedrooms: {
            type: Number,
            default: 0
        },
        bathrooms: {
            type: Number,
            default: 0
        },
        area: {
            type: Number,
            default: 0
        },
        parking: {
            type: Number,
            default: 0
        },
        furnished: {
            type: Boolean,
            default: false
        }
    },
    images: [{
        url: String,
        public_id: String
    }],
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'pending', 'sold', 'rented'],
        default: 'available'
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
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

// Virtual for reviews
PropertySchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'property',
    justOne: false
});

// Add text index for search functionality
PropertySchema.index({
    title: 'text',
    description: 'text',
    'location.city': 'text',
    'location.state': 'text',
    'location.country': 'text'
});

module.exports = mongoose.model('Property', PropertySchema); 