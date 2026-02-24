const Feedback = require('../models/feedback');
const Registration = require('../models/formreg');
const Event = require('../models/event');

// Participant submits feedback (only for events they attended)
const submitFeedback = async (req, res) => {
    try {
        const { eventId, rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' });

        const registration = await Registration.findOne({
            event: eventId,
            participant: req.user.id,
            status: { $in: ['Confirmed', 'Attended'] }
        });
        if (!registration) return res.status(403).json({ message: 'You must be registered for this event to give feedback' });

        const existing = await Feedback.findOne({ event: eventId, participant: req.user.id });
        if (existing) return res.status(400).json({ message: 'You have already submitted feedback for this event' });

        const feedback = new Feedback({
            event: eventId,
            participant: req.user.id,
            rating,
            comment: comment || ''
        });
        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted', feedback });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Organizer gets feedback for their event (anonymous - no participant info)
const getEventFeedback = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        const feedbacks = await Feedback.find({ event: req.params.eventId }).select('-participant').sort({ createdAt: -1 });

        const totalRatings = feedbacks.length;
        const avgRating = totalRatings > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalRatings).toFixed(1) : 0;
        const ratingBreakdown = [1, 2, 3, 4, 5].map(r => ({
            stars: r,
            count: feedbacks.filter(f => f.rating === r).length
        }));

        res.json({ feedbacks, totalRatings, avgRating, ratingBreakdown });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Check if participant already gave feedback for an event
const checkFeedback = async (req, res) => {
    try {
        const existing = await Feedback.findOne({ event: req.params.eventId, participant: req.user.id });
        res.json({ hasFeedback: !!existing });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { submitFeedback, getEventFeedback, checkFeedback };
