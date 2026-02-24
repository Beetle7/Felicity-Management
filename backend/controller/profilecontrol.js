const User = require('../models/user');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').populate('followedClubs', 'organizerName category');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const updateParticipantProfile = async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, collegeName, interests, followedClubs } = req.body;
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'Participant') return res.status(403).json({ message: 'Not a participant' });

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (contactNumber !== undefined) user.contactNumber = contactNumber;
        if (collegeName !== undefined) user.collegeName = collegeName;
        if (interests !== undefined) user.interests = interests;
        if (followedClubs !== undefined) user.followedClubs = followedClubs;

        await user.save();
        const updated = await User.findById(req.user.id).select('-password').populate('followedClubs', 'organizerName category');
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const updateOrganizerProfile = async (req, res) => {
    try {
        const { organizerName, category, description, contactEmail, contactNumber } = req.body;
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'Organizer') return res.status(403).json({ message: 'Not an organizer' });

        if (organizerName !== undefined) user.organizerName = organizerName;
        if (category !== undefined) user.category = category;
        if (description !== undefined) user.description = description;
        if (contactEmail !== undefined) user.contactEmail = contactEmail;
        if (contactNumber !== undefined) user.contactNumber = contactNumber;

        await user.save();
        res.json(await User.findById(req.user.id).select('-password'));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new password required' });

        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { getProfile, updateParticipantProfile, updateOrganizerProfile, changePassword };
