const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please add a valid phone number']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    profileImage: {
        type: String,
        default: 'default-profile.jpg'
    },
    socialLinks: {
        website: String,
        facebook: String,
        twitter: String,
        linkedin: String,
        instagram: String
    },
    preferences: {
        language: {
            type: String,
            enum: ['en', 'es', 'fr'],
            default: 'en'
        },
        currency: {
            type: String,
            enum: ['USD', 'EUR', 'GBP'],
            default: 'USD'
        }
    },
    savedSearches: [{
        name: String,
        filters: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update the updatedAt field before saving
UserProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema); 