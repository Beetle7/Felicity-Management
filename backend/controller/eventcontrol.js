const Event = require('../models/event');
const Registration = require('../models/formreg');

const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => {
        const row = new Array(n + 1);
        row[0] = i;
        return row;
    });
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
};

const autoUpdateStatus = async (event) => {
    const now = new Date();
    let newStatus = event.status;
    if (event.status === 'Published' && event.eventstart && now >= new Date(event.eventstart)) {
        newStatus = 'Ongoing';
    }
    if ((event.status === 'Published' || event.status === 'Ongoing') && event.eventend && now >= new Date(event.eventend)) {
        newStatus = 'Closed';
    }
    if (newStatus !== event.status) {
        event.status = newStatus;
        await event.save();
    }
    return event;
};

const fuzzyMatch = (text, term, threshold = 3) => {
    text = text.toLowerCase();
    term = term.toLowerCase();
    if (text.includes(term)) return true;
    const words = text.split(/\s+/);
    for (const word of words) {
        if (levenshtein(word, term) <= threshold) return true;
    }
    if (term.length >= 4) {
        for (let i = 0; i <= text.length - term.length; i++) {
            const substr = text.substring(i, i + term.length);
            if (levenshtein(substr, term) <= Math.floor(threshold / 2)) return true;
        }
    }
    return false;
};

const createEvent = async (req, res) => {
    try {
        const newevent = new Event({
            ...req.body,
            orgID: req.user.id,
            status: 'Draft'
        });

        const savedEvent = await newevent.save();
        res.status(201).json(savedEvent);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const updates = req.body;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.orgID.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: Not event organizer' });
        }

        if (event.status === 'Draft') {
            if (updates.form) {
                const regCount = await Registration.countDocuments({ event: eventId });
                if (regCount > 0) {
                    delete updates.form;
                }
            }
            const updatedEvent = await Event.findByIdAndUpdate(eventId, { $set: updates }, { new: true });
            return res.json(updatedEvent);
        }

        if (event.status === 'Published') {
            const allowed = {};
            if (updates.description !== undefined) allowed.description = updates.description;
            if (updates.regdeadline !== undefined && new Date(updates.regdeadline) >= new Date(event.regdeadline)) {
                allowed.regdeadline = updates.regdeadline;
            }
            if (updates.reglimit !== undefined && updates.reglimit >= event.reglimit) {
                allowed.reglimit = updates.reglimit;
            }
            if (updates.status === 'Closed') allowed.status = 'Closed';

            if (Object.keys(allowed).length === 0) {
                return res.status(400).json({ message: 'No valid updates for a published event' });
            }
            const updatedEvent = await Event.findByIdAndUpdate(eventId, { $set: allowed }, { new: true });
            return res.json(updatedEvent);
        }

        if (event.status === 'Ongoing' || event.status === 'Closed') {
            if (updates.status && ['Closed', 'Ongoing'].includes(updates.status)) {
                event.status = updates.status;
                await event.save();
                return res.json(event);
            }
            return res.status(400).json({ message: 'Ongoing/Closed events can only change status' });
        }

        res.status(400).json({ message: 'Invalid event status' });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getEvents = async (req, res) => {
    try {
        const events = await Event.find({ orgID: req.user.id });
        res.json(events);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getPublishedEvents = async (req, res) => {
    try {
        const { type, eligibility, dateFrom, dateTo, search, trending, followedClubs } = req.query;
        let query = { status: 'Published' };

        if (type && type !== 'All') query.type = type;
        if (eligibility) query.eligibility = { $regex: eligibility, $options: 'i' };
        if (dateFrom || dateTo) {
            query.eventstart = {};
            if (dateFrom) query.eventstart.$gte = new Date(dateFrom);
            if (dateTo) query.eventstart.$lte = new Date(dateTo);
        }
        if (followedClubs) {
            const clubIds = followedClubs.split(',');
            query.orgID = { $in: clubIds };
        }

        if (trending === 'true') {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const trendingRegs = await Registration.aggregate([
                { $match: { createdAt: { $gte: oneDayAgo } } },
                { $group: { _id: '$event', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);
            const trendingIds = trendingRegs.map(r => r._id);
            query._id = { $in: trendingIds };
        }

        let events = await Event.find(query).populate('orgID', 'organizerName category').sort({ eventstart: 1 });

        for (let e of events) { await autoUpdateStatus(e); }

        if (search) {
            events = events.filter(e =>
                fuzzyMatch(e.eventname, search) ||
                fuzzyMatch(e.description || '', search) ||
                (e.tags || []).some(tag => fuzzyMatch(tag, search)) ||
                (e.orgID && e.orgID.organizerName && fuzzyMatch(e.orgID.organizerName, search))
            );
        }

        // 4-band preference sorting if user is logged in
        if (req.user) {
            const User = require('../models/user');
            const user = await User.findById(req.user.id);
            if (user && user.role === 'Participant') {
                const interests = (user.interests || []).map(i => i.toLowerCase());
                const followedIds = (user.followedClubs || []).map(id => id.toString());

                events.sort((a, b) => {
                    const getBand = (e) => {
                        const orgId = e.orgID?._id?.toString() || '';
                        const orgCategory = (e.orgID?.category || '').toLowerCase();
                        const tags = (e.tags || []).map(t => t.toLowerCase());
                        const matchesInterest = interests.some(i => tags.includes(i) || orgCategory === i);
                        const matchesClub = followedIds.includes(orgId);
                        if (matchesInterest && matchesClub) return 1;
                        if (matchesInterest) return 2;
                        if (matchesClub) return 3;
                        return 4;
                    };
                    return getBand(a) - getBand(b);
                });
            }
        }

        res.json(events);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('orgID', 'organizerName category');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        await autoUpdateStatus(event);

        const regCount = await Registration.countDocuments({ event: req.params.id });
        const eventObj = event.toObject();
        if (eventObj.form) eventObj.form.sort((a, b) => (a.order || 0) - (b.order || 0));
        res.json({ ...eventObj, registrationCount: regCount });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const publishEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const foundEvent = await Event.findById(eventId);
        if (!foundEvent) return res.status(404).json({ message: 'Event not found' });

        if (foundEvent.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied: Not event organizer' });

        foundEvent.status = 'Published';
        await foundEvent.save();

        res.json({ message: 'Event published successfully' });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const deleteEvent = async (req, res) => {
    try {
        const foundEvent = await Event.findById(req.params.id);
        if (!foundEvent) return res.status(404).json({ message: 'Event not found' });
        if (foundEvent.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied: Not event organizer' });

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    createEvent,
    updateEvent,
    getEvents,
    getPublishedEvents,
    getEventById,
    publishEvent,
    deleteEvent
};