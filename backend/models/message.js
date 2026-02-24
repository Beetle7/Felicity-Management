const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    pinned: { type: Boolean, default: false },
    reactions: [{
        emoji: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
