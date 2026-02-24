const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { getProfile, updateParticipantProfile, updateOrganizerProfile, changePassword } = require('../controller/profilecontrol');

router.get('/', protect, getProfile);
router.put('/participant', protect, updateParticipantProfile);
router.put('/organizer', protect, updateOrganizerProfile);
router.put('/password', protect, changePassword);

module.exports = router;
