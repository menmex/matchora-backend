const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderAnonymousName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice', 'system'],
    default: 'text'
  },
  mediaUrl: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    unique: true,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    anonymousName: {
      type: String,
      required: true
    },
    isRevealed: {
      type: Boolean,
      default: false
    },
    revealConsent: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isBlocked: {
      type: Boolean,
      default: false
    }
  }],
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: Date,
    messageType: {
      type: String,
      default: 'text'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  typingUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isTyping: {
      type: Boolean,
      default: false
    },
    startedAt: Date
  }]
}, {
  timestamps: true
});

chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ 'lastMessage.sentAt': -1 });
chatSchema.index({ isActive: 1 });

module.exports = mongoose.model('Chat', chatSchema);
