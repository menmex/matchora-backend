const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

router.post('/signup', [
  body('username').trim().isLength({ min: 3, max: 30 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('ageRange').isIn(['13-17', '18-20', '21-25', '26-30', '31+']),
  body('gender').isIn(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  body('country').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { username, email, password, ageRange, gender, country } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: existingUser.email === email ? 'Email already registered' : 'Username taken' 
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      profile: { ageRange, gender, country }
    });

    user.generateAnonymousName();
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        anonymousName: user.anonymousProfile.anonymousName,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    user.lastActive = new Date();
    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        anonymousName: user.anonymousProfile.anonymousName,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

router.post('/logout', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastActive: new Date() });
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
