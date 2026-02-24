const express = require('express');
const router = express.Router();
const { protect, onlyO, onlyI } = require('../middleware/authmiddleware');
const { createResetRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest } = require('../controller/resetcontrol');

// Organizer routes
router.post('/request', protect, onlyO, createResetRequest);
router.get('/my-requests', protect, onlyO, getMyRequests);

// Admin routes
router.get('/requests', protect, onlyI, getAllRequests);
router.put('/:id/approve', protect, onlyI, approveRequest);
router.put('/:id/reject', protect, onlyI, rejectRequest);

module.exports = router;
