const Registration = require('../models/formreg');
const Event = require('../models/event');
const User = require('../models/user');
const shortid = require('shortid');
const { sendTicketEmail } = require('../utils/emailservice');

const registerEvent = async (req, res) => {
    try {
        const { eventId, responses, size, color, variant, quantity, paymentProof } = req.body;
        const userId = req.user.id;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (new Date() > new Date(event.regdeadline)) return res.status(400).json({ message: 'Registration deadline has passed' });

        const existingRegistration = await Registration.findOne({ event: eventId, participant: userId });
        if (existingRegistration) return res.status(400).json({ message: 'Already registered for this event' });

        const regCount = await Registration.countDocuments({ event: eventId, status: { $ne: 'Cancelled' } });
        if (event.reglimit && regCount >= event.reglimit) {
            return res.status(400).json({ message: 'Registration limit reached' });
        }

        if (event.type === 'Merchandise') {
            if (event.quantity < (quantity || 1)) {
                return res.status(400).json({ message: 'Out of stock' });
            }
            if (event.purchaselimit && (quantity || 1) > event.purchaselimit) {
                return res.status(400).json({ message: 'Purchase limit exceeded for this item' });
            }

            const registration = new Registration({
                event: eventId,
                participant: userId,
                size,
                color,
                variant,
                quantity: quantity || 1,
                paymentProof: paymentProof || '',
                paymentStatus: 'Pending',
                status: 'Pending'
            });

            await registration.save();
            return res.status(201).json({ message: 'Order placed! Awaiting payment approval.', registration });
        }

        const registration = new Registration({
            event: eventId,
            participant: userId,
            responses,
            size,
            color,
            variant,
            quantity: quantity || 1,
            ticketnum: `FLCY-${shortid.generate().toUpperCase()}`
        });

        await registration.save();

        try {
            const participant = await User.findById(userId);
            if (participant && participant.email) {
                await sendTicketEmail(participant.email, {
                    ticketnum: registration.ticketnum,
                    eventname: event.eventname,
                    eventstart: event.eventstart,
                    eventend: event.eventend,
                    type: event.type,
                    regfee: event.regfee,
                    participantName: participant.firstName + ' ' + participant.lastName
                });
            }
        } catch (emailErr) {
            console.error('Email send failed:', emailErr.message);
        }

        res.status(201).json({ message: 'Registered successfully', registration });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const uploadPaymentProof = async (req, res) => {
    try {
        const { paymentProof } = req.body;
        const registration = await Registration.findById(req.params.id);
        if (!registration) return res.status(404).json({ message: 'Registration not found' });
        if (registration.participant.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        registration.paymentProof = paymentProof;
        registration.paymentStatus = 'Pending';
        await registration.save();
        res.json({ message: 'Payment proof uploaded', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const approvePayment = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        const event = registration.event;
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied: Not event organizer' });

        if (registration.paymentStatus === 'Approved') return res.status(400).json({ message: 'Already approved' });

        if (event.quantity < registration.quantity) {
            return res.status(400).json({ message: 'Insufficient stock to approve' });
        }
        event.quantity -= registration.quantity;
        await event.save();

        registration.paymentStatus = 'Approved';
        registration.status = 'Confirmed';
        registration.ticketnum = `FLCY-${shortid.generate().toUpperCase()}`;
        await registration.save();

        try {
            const participant = await User.findById(registration.participant);
            if (participant && participant.email) {
                await sendTicketEmail(participant.email, {
                    ticketnum: registration.ticketnum,
                    eventname: event.eventname,
                    eventstart: event.eventstart,
                    eventend: event.eventend,
                    type: event.type,
                    regfee: event.regfee,
                    participantName: participant.firstName + ' ' + participant.lastName
                });
            }
        } catch (emailErr) {
            console.error('Email send failed:', emailErr.message);
        }

        res.json({ message: 'Payment approved, ticket generated and emailed', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const rejectPayment = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        const event = registration.event;
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied: Not event organizer' });

        registration.paymentStatus = 'Rejected';
        registration.status = 'Cancelled';
        await registration.save();
        res.json({ message: 'Payment rejected', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getMerchOrders = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        const orders = await Registration.find({ event: eventId })
            .populate('participant', 'firstName lastName email participantType collegeName contactNumber');
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await Registration.find({ participant: req.user.id })
            .populate('event', 'eventname eventstart eventend type status orgID regfee')
            .sort({ createdAt: -1 });
        res.json(history);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getParticipants = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied: Not event organizer' });

        const participants = await Registration.find({ event: eventId })
            .populate('participant', 'firstName lastName email participantType collegeName contactNumber');
        res.json(participants);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const cancelRegistration = async (req, res) => {
    try {
        const registrationId = req.params.id;
        if (!registrationId) return res.status(400).json({ message: 'Registration ID is required' });

        const registration = await Registration.findById(registrationId);
        if (!registration) return res.status(404).json({ message: 'Registration not found' });
        if (registration.participant.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied: Not registration owner' });

        if (registration.status !== 'Confirmed' && registration.status !== 'Pending') {
            return res.status(400).json({ message: 'Can only cancel confirmed or pending registrations' });
        }

        const event = await Event.findById(registration.event);
        if (event && event.type === 'Merchandise' && registration.paymentStatus === 'Approved') {
            event.quantity += registration.quantity;
            await event.save();
        }

        registration.status = 'Cancelled';
        await registration.save();
        res.json({ message: 'Registration cancelled successfully' });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getOrganizerAnalytics = async (req, res) => {
    try {
        const events = await Event.find({ orgID: req.user.id });
        const eventIds = events.map(e => e._id);

        const registrations = await Registration.find({ event: { $in: eventIds } });

        const totalRegistrations = registrations.length;
        const totalAttendance = registrations.filter(r => r.status === 'Attended').length;
        const totalRevenue = events.reduce((sum, e) => {
            const eventRegs = registrations.filter(r => r.event.toString() === e._id.toString() && r.status !== 'Cancelled');
            return sum + (eventRegs.length * (e.regfee || 0));
        }, 0);

        const perEvent = events.map(e => {
            const eventRegs = registrations.filter(r => r.event.toString() === e._id.toString());
            return {
                eventId: e._id,
                eventname: e.eventname,
                type: e.type,
                status: e.status,
                registrations: eventRegs.filter(r => r.status !== 'Cancelled').length,
                attended: eventRegs.filter(r => r.status === 'Attended').length,
                cancelled: eventRegs.filter(r => r.status === 'Cancelled').length,
                pending: eventRegs.filter(r => r.paymentStatus === 'Pending').length,
                revenue: eventRegs.filter(r => r.status !== 'Cancelled').length * (e.regfee || 0)
            };
        });

        res.json({ totalRegistrations, totalAttendance, totalRevenue, perEvent });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// CSV Export for participants
const exportCSV = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'firstName lastName email contactNumber collegeName participantType');

        let csv = 'Name,Email,Contact,College,Type,Status,Ticket,Registration Date,Attended At';
        if (event.type === 'Merchandise') csv += ',Size,Color,Quantity,Payment Status';
        csv += '\n';

        for (const r of registrations) {
            const p = r.participant || {};
            const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
            let row = `"${name}","${p.email || ''}","${p.contactNumber || ''}","${p.collegeName || ''}","${p.participantType || ''}","${r.status}","${r.ticketnum || ''}","${new Date(r.createdAt).toLocaleDateString()}","${r.attendedAt ? new Date(r.attendedAt).toLocaleString() : ''}"`;
            if (event.type === 'Merchandise') {
                row += `,"${r.size || ''}","${r.color || ''}","${r.quantity || ''}","${r.paymentStatus || ''}"`;
            }
            csv += row + '\n';
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${event.eventname}_participants.csv"`);
        res.send(csv);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// QR Scanner - validate ticket and mark attendance
const scanTicket = async (req, res) => {
    try {
        const { ticketnum } = req.body;
        if (!ticketnum) return res.status(400).json({ message: 'Ticket number required' });

        const registration = await Registration.findOne({ ticketnum })
            .populate('participant', 'firstName lastName email')
            .populate('event', 'eventname orgID');

        if (!registration) return res.status(404).json({ message: 'Invalid ticket - not found' });
        if (registration.event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'This ticket is not for your event' });
        if (registration.status === 'Cancelled') return res.status(400).json({ message: 'This registration is cancelled' });
        if (registration.attendedAt) return res.status(400).json({ message: `Duplicate scan - already attended at ${new Date(registration.attendedAt).toLocaleString()}` });

        registration.attendedAt = new Date();
        registration.status = 'Attended';
        await registration.save();

        res.json({
            message: 'Attendance marked successfully',
            participant: {
                name: `${registration.participant.firstName} ${registration.participant.lastName}`,
                email: registration.participant.email,
                ticketnum: registration.ticketnum,
                attendedAt: registration.attendedAt
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Manual attendance override
const manualAttendance = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event', 'orgID');
        if (!registration) return res.status(404).json({ message: 'Registration not found' });
        if (registration.event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        if (registration.attendedAt) return res.status(400).json({ message: 'Already marked as attended' });

        registration.attendedAt = new Date();
        registration.status = 'Attended';
        await registration.save();

        res.json({ message: 'Attendance marked manually', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Attendance dashboard
const getAttendanceDashboard = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.orgID.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        const registrations = await Registration.find({ event: req.params.eventId, status: { $in: ['Confirmed', 'Attended'] } })
            .populate('participant', 'firstName lastName email');

        const attended = registrations.filter(r => r.attendedAt);
        const notAttended = registrations.filter(r => !r.attendedAt);

        res.json({
            total: registrations.length,
            attendedCount: attended.length,
            notAttendedCount: notAttended.length,
            attended: attended.map(r => ({
                _id: r._id,
                name: `${r.participant.firstName} ${r.participant.lastName}`,
                email: r.participant.email,
                ticketnum: r.ticketnum,
                attendedAt: r.attendedAt
            })),
            notAttended: notAttended.map(r => ({
                _id: r._id,
                name: `${r.participant.firstName} ${r.participant.lastName}`,
                email: r.participant.email,
                ticketnum: r.ticketnum
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    registerEvent,
    getHistory,
    getParticipants,
    cancelRegistration,
    getOrganizerAnalytics,
    uploadPaymentProof,
    approvePayment,
    rejectPayment,
    getMerchOrders,
    exportCSV,
    scanTicket,
    manualAttendance,
    getAttendanceDashboard
};