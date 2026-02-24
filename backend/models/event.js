const mongoose = require('mongoose');
const { events } = require('./user');

//eventschema 
const EventSchema = new mongoose.Schema({
    eventname: { type: String, required: true },
    description: { type: String },
    type: {type: String, enum: ['Normal', 'Merchandise'], required: true},
    eligibility: { type: String },
    regdeadline: { type: Date },
    eventstart: { type: Date },
    eventend: { type: Date },
    reglimit: { type: Number },
    regfee: { type: Number },
    orgID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],

    //for only merch events
    iteminfo: { size: [String], color: [String], variants: [String] },
    quantity: { type: Number },
    purchaselimit: { type: Number, default: 1 },

    //status stuff
    status: { type: String, enum: ['Draft', 'Published', 'Closed', 'Ongoing'], default: 'Draft' },

    //form to sign up
    form: [
        {
            label: { type: String, required: true },
            fieldType: { type: String, enum: ['text', 'dropdown', 'checkbox', 'file upload'], required: true },
            options: [String], //dropdwon and checkbox
            required: { type: Boolean, default: false },
            order: { type: Number}
        }
    ],


}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);