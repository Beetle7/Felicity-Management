const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Participant
const loginUser = async (req, res) => {

    //sanitycheck
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Please provide email bozo' });
    }

    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email credentials' });
        }

        if (user.disabled) {
            return res.status(403).json({ message: 'Account has been disabled. Contact admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid pwd credentials' });
        }
        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '12h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    role: user.role,
                    id: user._id.toString(),
                    message: `Logged in successfully as ${user.role}`
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


const registerParticipant = async (req, res) => {
    const { email, password, role, firstName, lastName, participantType, collegeName, contactNumber } = req.body;
    try {
        //check if user alr exists w email
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        //check if iiit students using clg email
        if (participantType === 'IIIT' && !email.endsWith('iiit.ac.in')) {
            return res.status(400).json({ message: 'IIIT students must use their IIIT email' });
        }
        //create user
        user = new User({ firstName, lastName, email, password, role: 'Participant', participantType, collegeName, contactNumber });
        //hash pwd
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        //send to mongo
        await user.save();
        res.status(201).json({ message: 'Participant registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//for profile
const whoami = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    loginUser,
    registerParticipant,
    whoami
};
