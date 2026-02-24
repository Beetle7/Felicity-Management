const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { getMessages, postMessage, togglePin, deleteMessage, toggleReaction } = require('../controller/messagecontrol');

router.get('/:eventId', protect, getMessages);
router.post('/:eventId', protect, postMessage);
router.put('/:messageId/pin', protect, togglePin);
router.delete('/:messageId', protect, deleteMessage);
router.put('/:messageId/react', protect, toggleReaction);

module.exports = router;
