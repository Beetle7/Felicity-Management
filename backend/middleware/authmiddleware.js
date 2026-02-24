const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const header = req.header('Authorization')
    const token = header && header.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    }
    catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const optionalAuth = (req, res, next) => {
    const header = req.header('Authorization');
    const token = header && header.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.user;
        } catch (err) { }
    }
    next();
};

//for admin
const onlyI = (req, res, next) => {
    if (req.user.role == 'Admin') {
        next();
    }
    else {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

//for orgnizer
const onlyO = (req, res, next) => {
    if (req.user.role == 'Organizer') {
        next();
    }
    else {
        return res.status(403).json({ message: 'Access denied: Organizers only' });
    }
};

//for participant
const onlyP = (req, res, next) => {
    if (req.user.role == 'Participant') {
        next();
    }
    else {
        return res.status(403).json({ message: 'Access denied: Participants only' });
    }
};


module.exports = {
    protect,
    optionalAuth,
    onlyI,
    onlyO,
    onlyP
};