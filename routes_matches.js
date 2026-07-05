const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Match = require('../models/Match');
const { protect } = require('../middleware/auth');
const { findBestMatches } = require('../utils/matchCalculator');

router.get('/discover', protect, async (req, res, next) => {
  try {
    const matches = await findBestMatches(req.user._id, 20);
    
    const sanitizedMatches = matches.map(m => ({
      userId: m.user._id,
      anonymousName: m.user.anonymousProfile.anonymousName,
      compatibilityScore: m.score,
      breakdown: m.breakdown,
      commonInterests: m.commonInterests,
      profile: {
        ageRange: m.user.profile.ageRange,
        gender: m.user.profile.gender,
        country: m.user.profile.country,
        bio: m.user.profile.bio
      }
    }));

    res.json({ success: true, count: sanitizedMatches.length, matches: sanitizedMatches });
  } catch (error) {
    next(error);
  }
});

router.post('/request', protect, async (req, res, next) => {
  try {
    const { targetUserId, compatibilityScore, scoreBreakdown } = req.body;

    const existingMatch = await Match.findOne({
      $or: [
        { user1: req.user._id, user2: targetUserId },
        { user1: targetUserId, user2: req.user._id }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({ success: false, error: 'Match already exists' });
    }

    const match = await Match.create({
      matchId: uuidv4(),
      user1: req.user._id,
      user2: targetUserId,
      compatibilityScore,
      scoreBreakdown,
      initiatedBy: req.user._id
    });

    res.status(201).json({ success: true, match });
  } catch (error) {
    next(error);
  }
});

router.put('/:matchId/respond', protect, async (req, res, next) => {
  try {
    const { action } = req.body;
    
    const match = await Match.findOne({
      matchId: req.params.matchId,
      $or: [{ user1: req.user._id }, { user2: req.user._id }]
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    if (action === 'accept') {
      match.status = 'accepted';
      match.acceptedAt = new Date();
      match.chatRoomId = uuidv4();
    } else {
      match.status = 'rejected';
      match.rejectedAt = new Date();
    }

    await match.save();

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
});

router.get('/', protect, async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [{ user1: req.user._id }, { user2: req.user._id }],
      status: 'accepted'
    }).populate('user1 user2', 'username anonymousProfile profile');

    res.json({ success: true, matches });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
