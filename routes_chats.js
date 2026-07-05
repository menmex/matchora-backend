const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id,
      isActive: true
    }).sort({ 'lastMessage.sentAt': -1 });

    res.json({ success: true, chats });
  } catch (error) {
    next(error);
  }
});

router.get('/:chatId/messages', protect, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      chatId: req.params.chatId,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const messages = chat.messages
      .filter(m => !m.isDeleted)
      .slice(-50);

    chat.messages.forEach(m => {
      if (m.sender.toString() !== req.user._id.toString() && !m.isRead) {
        m.isRead = true;
        m.readAt = new Date();
      }
    });
    await chat.save();

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

router.post('/:chatId/messages', protect, async (req, res, next) => {
  try {
    const { content, messageType = 'text' } = req.body;

    const chat = await Chat.findOne({
      chatId: req.params.chatId,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const participant = chat.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    const message = {
      messageId: uuidv4(),
      sender: req.user._id,
      senderAnonymousName: participant.anonymousName,
      content,
      messageType
    };

    chat.messages.push(message);
    chat.lastMessage = {
      content,
      sender: req.user._id,
      sentAt: new Date(),
      messageType
    };

    await chat.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
