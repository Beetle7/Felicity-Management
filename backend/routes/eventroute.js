const express = require('express');
const router = express.Router();

const { protect, optionalAuth, onlyO } = require('../middleware/authmiddleware');

const { createEvent, getEvents, getPublishedEvents, getEventById, publishEvent, updateEvent, deleteEvent } = require('../controller/eventcontrol');

//public routes (optional auth for preference-based ordering)
router.get('/published', optionalAuth, getPublishedEvents);
router.get('/:id', getEventById);

//to create event
router.post('/', protect, onlyO, createEvent);

//to see the organizer's events
router.get('/', protect, onlyO, getEvents);

//to modify forms
router.put('/:id', protect, onlyO, updateEvent);

//to upload event to page from draft
router.patch('/:id/publish', protect, onlyO, publishEvent);

//to delete event
router.delete('/:id', protect, onlyO, deleteEvent);

module.exports = router;