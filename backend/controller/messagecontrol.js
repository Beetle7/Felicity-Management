const Message = require('../models/message');
const Event = require('../models/event');

// Get messages for an event
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ event: req.params.eventId, deleted: false })
            .populate('sender', 'firstName lastName role organizerName')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Post a message (REST fallback if socket not available)
const postMessage = async (req, res) => {
    try {
        const { text, parentId } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });

        const message = new Message({
            event: req.params.eventId,
            sender: req.user.id,
            text: text.trim(),
            parentId: parentId || null
        });
        await message.save();
        const populated = await Message.findById(message._id)
            .populate('sender', 'firstName lastName role organizerName');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Pin/unpin a message (organizer only for their event)
const togglePin = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId).populate('event', 'orgID');
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const event = await Event.findById(message.event);
        if (!event || event.orgID.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the event organizer can pin messages' });
        }

        message.pinned = !message.pinned;
        await message.save();
        res.json({ message: message.pinned ? 'Message pinned' : 'Message unpinned', data: message });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete a message (organizer moderation or own message)
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const event = await Event.findById(message.event);
        const isOrganizer = event && event.orgID.toString() === req.user.id;
        const isOwner = message.sender.toString() === req.user.id;

        if (!isOrganizer && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        message.deleted = true;
        message.text = '[Message deleted]';
        await message.save();
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Toggle a reaction on a message
const toggleReaction = async (req, res) => {
    try {
        const { reaction } = req.body;
        if (!reaction) return res.status(400).json({ message: 'Reaction is required' });

        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const existingIdx = message.reactions.findIndex(
            r => r.emoji === reaction && r.user.toString() === req.user.id
        );

        if (existingIdx > -1) {
            message.reactions.splice(existingIdx, 1);
        } else {
            message.reactions.push({ emoji: reaction, user: req.user.id });
        }

        await message.save();
        const populated = await Message.findById(message._id)
            .populate('sender', 'firstName lastName role organizerName');
        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = { getMessages, postMessage, togglePin, deleteMessage, toggleReaction };
