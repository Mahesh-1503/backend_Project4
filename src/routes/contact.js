const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    sendMessage,
    getMessages,
    getMessage,
    replyToMessage,
    updateMessageStatus,
    deleteMessage
} = require('../controllers/contact');

// Protect all routes
router.use(protect);

// Message routes
router.route('/')
    .get(getMessages);

router.route('/:propertyId')
    .post(sendMessage);

router.route('/:id')
    .get(getMessage)
    .delete(deleteMessage);

router.route('/:id/reply')
    .post(replyToMessage);

router.route('/:id/status')
    .put(updateMessageStatus);

module.exports = router; 