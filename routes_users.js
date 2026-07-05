const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.put('/profile', protect, [
  body('displayName').optional().trim().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 })
], async (req, res, next) => {
  try {
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profile: { ...req.user.profile, ...updates } } },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.put('/academic', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { academicInfo: req.body } },
      { new: true }
    );
    res.json({ success: true, academicInfo: user.academicInfo });
  } catch (error) {
    next(error);
  }
});

router.put('/interests', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { interests: req.body } },
      { new: true }
    );
    res.json({ success: true, interests: user.interests });
  } catch (error) {
    next(error);
  }
});

router.put('/personality', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { personality: req.body } },
      { new: true }
    );
    res.json({ success: true, personality: user.personality });
  } catch (error) {
    next(error);
  }
});

router.put('/preferences', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { preferences: req.body } },
      { new: true }
    );
    res.json({ success: true, preferences: user.preferences });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
