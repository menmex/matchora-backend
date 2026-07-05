const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\\S+@\\S+\\.\\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  profile: {
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    ageRange: {
      type: String,
      enum: ['13-17', '18-20', '21-25', '26-30', '31+'],
      required: [true, 'Age range is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'],
      required: [true, 'Gender is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    state: String,
    preferredLanguage: {
      type: String,
      default: 'English'
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePicture: {
      type: String,
      default: null
    }
  },
  academicInfo: {
    status: {
      type: String,
      enum: ['in-school', 'graduate', 'not-in-school'],
      default: 'in-school'
    },
    institutionName: String,
    academicLevel: {
      type: String,
      enum: [
        'JSS1', 'JSS2', 'JSS3',
        'SS1', 'SS2', 'SS3',
        'ND1', 'ND2',
        'HND1', 'HND2',
        '100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level',
        'Postgraduate',
        'Graduate'
      ]
    },
    faculty: String,
    department: String
  },
  preferences: {
    lookingFor: [{
      type: String,
      enum: ['friendship', 'study-partner', 'networking', 'gaming', 'group-chat', 'random']
    }],
    preferredAgeRange: {
      type: String,
      enum: ['13-17', '18-20', '21-25', '26-30', '31+', 'any'],
      default: 'any'
    },
    preferredGender: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    },
    preferredLocation: {
      type: String,
      enum: ['same-country', 'same-region', 'global'],
      default: 'global'
    },
    academicFilters: [{
      type: String,
      enum: ['same-institution', 'same-level', 'same-faculty', 'same-department']
    }]
  },
  interests: {
    entertainment: [{ type: String }],
    technology: [{ type: String }],
    lifestyle: [{ type: String }],
    education: [{ type: String }],
    recreation: [{ type: String }]
  },
  personality: {
    introvertExtrovert: { type: Number, min: 0, max: 100, default: 50 },
    seriousFun: { type: Number, min: 0, max: 100, default: 50 },
    leaderFollower: { type: Number, min: 0, max: 100, default: 50 },
    morningNightOwl: { type: Number, min: 0, max: 100, default: 50 },
    talkativeReserved: { type: Number, min: 0, max: 100, default: 50 },
    textChatVoiceChat: { type: Number, min: 0, max: 100, default: 50 }
  },
  anonymousProfile: {
    anonymousName: {
      type: String,
      unique: true,
      sparse: true
    },
    identityRevealed: {
      type: Boolean,
      default: false
    },
    revealConsent: {
      type: Boolean,
      default: false
    }
  },
  safety: {
    reportsReceived: { type: Number, default: 0 },
    reportsMade: { type: Number, default: 0 },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastReportedAt: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  matches: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    compatibilityScore: Number,
    matchedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAnonymousName = function() {
  const adjectives = ['Happy', 'Bright', 'Calm', 'Brave', 'Wise', 'Kind', 'Swift', 'Gentle'];
  const nouns = ['Panda', 'Eagle', 'Wolf', 'Dolphin', 'Fox', 'Owl', 'Bear', 'Lion'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);
  this.anonymousProfile.anonymousName = `${adj}${noun}${num}`;
  return this.anonymousProfile.anonymousName;
};

userSchema.index({ 'profile.ageRange': 1, 'profile.country': 1, 'profile.gender': 1 });
userSchema.index({ accountStatus: 1, isVerified: 1 });

module.exports = mongoose.model('User', userSchema);
