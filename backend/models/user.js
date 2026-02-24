const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  //shared
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Participant', 'Organizer', 'Admin'],
    required: true
  },
  disabled: { type: Boolean, default: false },

  //user
  firstName: { type: String },
  lastName: { type: String },
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT']
  },
  collegeName: { type: String },
  contactNumber: { type: String },

  //extra
  interests: [{ type: String }],
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  //organizer
  organizerName: { type: String },
  category: { type: String },
  description: { type: String },
  contactEmail: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);