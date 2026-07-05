const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    unique: true,
    required: true
  },
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  compatibilityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  scoreBreakdown: {
    interestMatch: Number,
    ageCompatibility: Number,
    languageMatch: Number,
    personalityMatch: Number,
    locationMatch: Number,
    academicMatch: Number
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked', 'expired'],
    default: 'pending'
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acceptedAt: Date,
  rejectedAt: Date,
  expiredAt: Date,
  chatRoomId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ status: 1, compatibilityScore: -1 });

module.exports = mongoose.model('Match', matchSchema);
