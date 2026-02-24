const { default: mongoose } = require("mongoose");

const formreg = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['Confirmed', 'Attended', 'Cancelled', 'Pending'],
        default: 'Confirmed'
    },


    //for normal events
    responses: [
        {
            label: String,
            value: mongoose.Schema.Types.Mixed //based on form questions
        }
    ],
    ticketnum: { type: String, unique: true, sparse: true },

    //for merch events
    size: String,
    color: String,
    variant: String,
    quantity: { type: Number, default: 1 },

    //payment proof for merch
    paymentProof: { type: String },
    paymentStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: null },

    //attendance tracking
    attendedAt: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('Registration', formreg);
