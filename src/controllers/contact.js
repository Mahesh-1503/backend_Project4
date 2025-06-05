const Contact = require('../models/Contact');
const ContactReply = require('../models/ContactReply');
const Property = require('../models/Property');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Send message to property agent
// @route   POST /api/contact/:propertyId
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.propertyId);

        if (!property) {
            return next(new ErrorResponse('Property not found', 404));
        }

        // Check if user has already sent a message for this property
        const existingContact = await Contact.findOne({
            sender: req.user.id,
            property: req.params.propertyId
        });

        if (existingContact) {
            return next(new ErrorResponse('You have already sent a message for this property', 400));
        }

        const contact = await Contact.create({
            sender: req.user.id,
            receiver: property.agent,
            property: req.params.propertyId,
            subject: req.body.subject,
            message: req.body.message
        });

        // Populate sender and receiver details
        await contact.populate([
            { path: 'sender', select: 'name email' },
            { path: 'receiver', select: 'name email' },
            { path: 'property', select: 'title price' }
        ]);

        res.status(201).json({
            success: true,
            data: contact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all messages for a user
// @route   GET /api/contact
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const query = {
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ],
            isDeleted: false
        };

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        const contacts = await Contact.find(query)
            .populate([
                { path: 'sender', select: 'name email' },
                { path: 'receiver', select: 'name email' },
                { path: 'property', select: 'title price images' }
            ])
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single message
// @route   GET /api/contact/:id
// @access  Private
exports.getMessage = async (req, res, next) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ],
            isDeleted: false
        }).populate([
            { path: 'sender', select: 'name email' },
            { path: 'receiver', select: 'name email' },
            { path: 'property', select: 'title price images' }
        ]);

        if (!contact) {
            return next(new ErrorResponse('Message not found', 404));
        }

        // Update status to read if receiver is viewing
        if (contact.receiver._id.toString() === req.user.id && contact.status === 'unread') {
            contact.status = 'read';
            await contact.save();
        }

        // Get replies
        const replies = await ContactReply.find({ contact: req.params.id })
            .populate('sender', 'name email')
            .sort('createdAt');

        res.status(200).json({
            success: true,
            data: {
                ...contact.toObject(),
                replies
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reply to a message
// @route   POST /api/contact/:id/reply
// @access  Private
exports.replyToMessage = async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return next(new ErrorResponse('Message not found', 404));
        }

        // Check if user is part of the conversation
        if (contact.sender.toString() !== req.user.id &&
            contact.receiver.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized to reply to this message', 401));
        }

        const reply = await ContactReply.create({
            contact: req.params.id,
            sender: req.user.id,
            message: req.body.message
        });

        // Update contact status
        contact.status = 'replied';
        await contact.save();

        await reply.populate('sender', 'name email');

        res.status(201).json({
            success: true,
            data: reply
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update message status
// @route   PUT /api/contact/:id/status
// @access  Private
exports.updateMessageStatus = async (req, res, next) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            receiver: req.user.id,
            isDeleted: false
        });

        if (!contact) {
            return next(new ErrorResponse('Message not found', 404));
        }

        contact.status = req.body.status;
        await contact.save();

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete message
// @route   DELETE /api/contact/:id
// @access  Private
exports.deleteMessage = async (req, res, next) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ],
            isDeleted: false
        });

        if (!contact) {
            return next(new ErrorResponse('Message not found', 404));
        }

        contact.isDeleted = true;
        await contact.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
}; 