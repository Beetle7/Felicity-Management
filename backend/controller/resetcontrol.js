const PasswordResetRequest = require('../models/passwordreset');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Organizer submits a password reset request
const createResetRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: 'Reason is required' });

        const existing = await PasswordResetRequest.findOne({ organizer: req.user.id, status: 'Pending' });
        if (existing) return res.status(400).json({ message: 'You already have a pending request' });

        const request = new PasswordResetRequest({
            organizer: req.user.id,
            reason
        });
        await request.save();
        res.status(201).json({ message: 'Password reset request submitted', request });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Organizer views their own requests
const getMyRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({ organizer: req.user.id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Admin views all requests
const getAllRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find()
            .populate('organizer', 'organizerName email category')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Admin approves a request
const approveRequest = async (req, res) => {
    try {
        const request = await PasswordResetRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already handled' });

        const newPassword = crypto.randomBytes(6).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(request.organizer, { password: hashed });

        request.status = 'Approved';
        request.adminComments = req.body.comments || '';
        request.generatedPassword = newPassword;
        await request.save();

        res.json({ message: 'Password reset approved', newPassword, request });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Admin rejects a request
const rejectRequest = async (req, res) => {
    try {
        const request = await PasswordResetRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already handled' });

        request.status = 'Rejected';
        request.adminComments = req.body.comments || '';
        await request.save();

        res.json({ message: 'Password reset rejected', request });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { createResetRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest };
