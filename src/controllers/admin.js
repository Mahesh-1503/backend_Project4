const User = require('../models/User');
const Property = require('../models/Property');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'agent', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be user, agent, or admin'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Delete all properties associated with the user if they are an agent
        if (user.role === 'agent') {
            await Property.deleteMany({ agent: user._id });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardAnalytics = async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments();

        // Get users by role
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get total properties count
        const totalProperties = await Property.countDocuments();

        // Get properties by type
        const propertiesByType = await Property.aggregate([
            {
                $group: {
                    _id: '$propertyType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get properties by listing type (sale/rent)
        const propertiesByListingType = await Property.aggregate([
            {
                $group: {
                    _id: '$listingType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get properties by status
        const propertiesByStatus = await Property.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get top agents by number of listings
        const topAgents = await Property.aggregate([
            {
                $group: {
                    _id: '$agent',
                    propertyCount: { $sum: 1 }
                }
            },
            {
                $sort: { propertyCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'agentDetails'
                }
            },
            {
                $unwind: '$agentDetails'
            },
            {
                $project: {
                    _id: 1,
                    propertyCount: 1,
                    name: '$agentDetails.name',
                    email: '$agentDetails.email'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                usersByRole,
                totalProperties,
                propertiesByType,
                propertiesByListingType,
                propertiesByStatus,
                topAgents
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}; 