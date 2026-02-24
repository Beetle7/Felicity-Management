const express = require('express');
const router = express.Router();
const { protect, onlyP } = require('../middleware/authmiddleware');
const User = require('../models/user');
const Event = require('../models/event');

router.get('/', async (req, res) => {
    try {
        const clubs = await User.find({ role: 'Organizer', disabled: { $ne: true } })
            .select('organizerName category description contactEmail');
        res.json(clubs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const club = await User.findById(req.params.id).select('organizerName category description contactEmail');
        if (!club || club.role === 'Participant') return res.status(404).json({ message: 'Club not found' });

        const upcoming = await Event.find({ orgID: req.params.id, status: 'Published', eventstart: { $gte: new Date() } });
        const past = await Event.find({ orgID: req.params.id, status: { $in: ['Published', 'Closed'] }, eventend: { $lt: new Date() } });

        res.json({ club, upcoming, past });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/:id/follow', protect, onlyP, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const clubId = req.params.id;
        if (user.followedClubs.includes(clubId)) {
            return res.status(400).json({ message: 'Already following this club' });
        }
        user.followedClubs.push(clubId);
        await user.save();
        res.json({ message: 'Followed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.delete('/:id/follow', protect, onlyP, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.followedClubs = user.followedClubs.filter(id => id.toString() !== req.params.id);
        await user.save();
        res.json({ message: 'Unfollowed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
