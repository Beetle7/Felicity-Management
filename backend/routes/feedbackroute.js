const express = require('express');
const router = express.Router();
const { protect, onlyP, onlyO } = require('../middleware/authmiddleware');
const { submitFeedback, getEventFeedback, checkFeedback } = require('../controller/feedbackcontrol');

router.post('/', protect, onlyP, submitFeedback);
router.get('/check/:eventId', protect, onlyP, checkFeedback);
router.get('/event/:eventId', protect, onlyO, getEventFeedback);

module.exports = router;
