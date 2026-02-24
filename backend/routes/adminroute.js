const express = require('express');
const router = express.Router();
const { protect, onlyI } = require('../middleware/authmiddleware');
const { createOrganizer, listOrganizers, removeOrganizer, resetOrganizerPassword } = require('../controller/admincontrol');

router.post('/organizer', protect, onlyI, createOrganizer);
router.get('/organizers', protect, onlyI, listOrganizers);
router.delete('/organizer/:id', protect, onlyI, removeOrganizer);
router.put('/organizer/:id/reset-password', protect, onlyI, resetOrganizerPassword);

module.exports = router;