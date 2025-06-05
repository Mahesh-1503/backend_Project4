const Property = require('../models/Property');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new property
// @route   POST /api/properties
// @access  Private (Agent only)
exports.createProperty = async (req, res) => {
    try {
        // Check if user is an agent
        if (req.user.role !== 'agent' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only agents can create properties'
            });
        }

        // Validate required fields
        const requiredFields = ['title', 'description', 'price', 'location'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate price
        const price = Number(req.body.price);
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be a positive number'
            });
        }

        // Validate location object
        let location = req.body.location;
        if (typeof location === 'string') {
            try {
                location = JSON.parse(location);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid location format. Expected JSON object with street, city, state, country, and zipCode'
                });
            }
        }

        // Validate location fields
        const requiredLocationFields = ['street', 'city', 'state', 'country', 'zipCode'];
        const missingLocationFields = requiredLocationFields.filter(field => !location[field]);

        if (missingLocationFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required location fields: ${missingLocationFields.join(', ')}`
            });
        }

        // Validate property type
        const validPropertyTypes = ['apartment', 'house', 'villa', 'condo', 'townhouse', 'land', 'commercial'];
        if (req.body.propertyType && !validPropertyTypes.includes(req.body.propertyType.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: `Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}`
            });
        }

        // Validate listing type
        const validListingTypes = ['sale', 'rent'];
        if (req.body.listingType && !validListingTypes.includes(req.body.listingType.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: `Invalid listing type. Must be one of: ${validListingTypes.join(', ')}`
            });
        }

        // Validate features if provided
        if (req.body.features) {
            let features = req.body.features;
            if (typeof features === 'string') {
                try {
                    features = JSON.parse(features);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid features format. Expected JSON object'
                    });
                }
            }

            // Validate numeric features
            const numericFeatures = ['bedrooms', 'bathrooms', 'area', 'parking'];
            for (const feature of numericFeatures) {
                if (features[feature] !== undefined) {
                    const value = Number(features[feature]);
                    if (isNaN(value) || value < 0) {
                        return res.status(400).json({
                            success: false,
                            error: `${feature} must be a non-negative number`
                        });
                    }
                }
            }
        }

        // Prepare property data
        const propertyData = {
            title: req.body.title,
            description: req.body.description,
            price: price,
            location: location,
            propertyType: req.body.propertyType?.toLowerCase() || 'apartment',
            listingType: req.body.listingType?.toLowerCase() || 'sale',
            features: req.body.features || {},
            agent: req.user.id,
            status: 'active'
        };

        // Handle image upload if present
        if (req.files && req.files.images) {
            const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

            // Validate number of images
            if (files.length > 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 10 images allowed'
                });
            }

            // Validate file types and sizes
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            for (const file of files) {
                if (!validTypes.includes(file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
                    });
                }
                if (file.size > maxSize) {
                    return res.status(400).json({
                        success: false,
                        error: 'File size too large. Maximum size is 5MB'
                    });
                }
            }

            try {
                const uploadPromises = files.map(file =>
                    cloudinary.uploader.upload(file.tempFilePath, {
                        folder: 'property-listings',
                        use_filename: true,
                        resource_type: 'image'
                    })
                );

                const uploadResults = await Promise.all(uploadPromises);
                propertyData.images = uploadResults.map(result => ({
                    url: result.secure_url,
                    public_id: result.public_id
                }));
            } catch (uploadError) {
                console.error('Error uploading images:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Error uploading images. Please try again'
                });
            }
        }

        // Create property
        const property = await Property.create(propertyData);

        res.status(201).json({
            success: true,
            data: property
        });
    } catch (err) {
        console.error('Error in createProperty:', err);

        // Handle mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'A property with this title already exists'
            });
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Server error. Please try again later'
        });
    }
};

// @desc    Get all properties with filtering, sorting, and pagination
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
    try {
        // Build query
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

        // Remove fields from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        query = Property.find(JSON.parse(queryStr));

        // Search functionality
        if (req.query.search) {
            query = query.find({
                $text: { $search: req.query.search }
            });
        }

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Property.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const properties = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: properties.length,
            pagination,
            data: properties
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('agent', 'name email')
            .populate('favorites', 'name email');

        if (!property) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }

        // Increment views
        property.views += 1;
        await property.save();

        res.status(200).json({ success: true, data: property });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Agent only)
exports.updateProperty = async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }

        // Make sure user is property agent
        if (property.agent.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to update this property' });
        }

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file =>
                cloudinary.uploader.upload(file.path, {
                    folder: 'property-listings',
                    use_filename: true
                })
            );

            const uploadResults = await Promise.all(uploadPromises);
            req.body.images = uploadResults.map(result => ({
                url: result.secure_url,
                public_id: result.public_id
            }));
        }

        property = await Property.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: property });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Agent only)
exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }

        // Make sure user is property agent
        if (property.agent.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this property' });
        }

        // Delete images from cloudinary
        if (property.images && property.images.length > 0) {
            const deletePromises = property.images.map(image =>
                cloudinary.uploader.destroy(image.public_id)
            );
            await Promise.all(deletePromises);
        }

        await property.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Toggle favorite property
// @route   PUT /api/properties/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ success: false, error: 'Property not found' });
        }

        const index = property.favorites.indexOf(req.user.id);

        if (index === -1) {
            property.favorites.push(req.user.id);
        } else {
            property.favorites.splice(index, 1);
        }

        await property.save();

        res.status(200).json({ success: true, data: property });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add property to favorites
// @route   PUT /api/properties/:id/favorite
// @access  Private
exports.favoriteProperty = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse('Property not found', 404));
        }

        // Check if property is already in favorites
        if (property.favorites.includes(req.user.id)) {
            return next(new ErrorResponse('Property already in favorites', 400));
        }

        property.favorites.push(req.user.id);
        await property.save();

        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove property from favorites
// @route   PUT /api/properties/:id/unfavorite
// @access  Private
exports.unfavoriteProperty = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return next(new ErrorResponse('Property not found', 404));
        }

        // Check if property is in favorites
        if (!property.favorites.includes(req.user.id)) {
            return next(new ErrorResponse('Property not in favorites', 400));
        }

        property.favorites = property.favorites.filter(
            favorite => favorite.toString() !== req.user.id
        );
        await property.save();

        res.status(200).json({
            success: true,
            data: property
        });
    } catch (err) {
        next(err);
    }
}; 