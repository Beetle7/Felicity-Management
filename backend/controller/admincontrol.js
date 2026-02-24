const User = require('../models/user');
const Event = require('../models/event');
const Registration = require('../models/formreg');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');

const generatePassword = () => crypto.randomBytes(6).toString('hex');
const generateEmail = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '@clubs.iiit.ac.in';

const createOrganizer = async (req, res) => {
    let { email, password, organizerName, category, description } = req.body;
    try {
        if (!organizerName) return res.status(400).json({ message: 'Organization name is required' });
        if (!email) email = generateEmail(organizerName);
        if (!password) password = generatePassword();

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const organizer = new User({ email, password: hashedPassword, role: 'Organizer', organizerName, category, description });
        await organizer.save();
        res.status(201).json({ message: 'Organizer registered successfully', credentials: { email, password } });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const listOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'Organizer' }).select('-password');
        res.json(organizers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const removeOrganizer = async (req, res) => {
    try {
        const orgId = req.params.id;
        const organizer = await User.findById(orgId);
        if (!organizer || organizer.role !== 'Organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const action = req.query.action || 'disable';
        if (action === 'delete') {
            const orgEvents = await Event.find({ orgID: orgId });
            const eventIds = orgEvents.map(e => e._id);
            await Registration.deleteMany({ event: { $in: eventIds } });
            await Event.deleteMany({ orgID: orgId });
            await User.findByIdAndDelete(orgId);
            res.json({ message: 'Organizer and all associated data permanently deleted' });
        } else {
            organizer.disabled = true;
            await organizer.save();
            res.json({ message: 'Organizer account disabled' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const resetOrganizerPassword = async (req, res) => {
    try {
        const orgId = req.params.id;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: 'New password is required' });

        const organizer = await User.findById(orgId);
        if (!organizer || organizer.role !== 'Organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const salt = await bcrypt.genSalt(10);
        organizer.password = await bcrypt.hash(newPassword, salt);
        await organizer.save();
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { createOrganizer, listOrganizers, removeOrganizer, resetOrganizerPassword };