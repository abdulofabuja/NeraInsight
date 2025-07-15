const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CheckIn = require('../models/CheckIn'); // ✅ Add this
const authenticateToken = require('../middlewares/auth');

// ✅ Daily Check-In – Reward ₦50 if 24hrs passed since last check-in
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const lastCheckIn = user.lastCheckIn || new Date(0);
    const hoursSince = (now - lastCheckIn) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return res.status(400).json({ message: 'You can only check-in once every 24 hours' });
    }

    // Reward ₦50, update lastCheckIn
    user.wallet += 50;
    user.lastCheckIn = now;
    await user.save();

    // Optional: Log the check-in for history
    await CheckIn.create({ user: userId, timestamp: now });

    res.json({
      message: 'Check-in successful. ₦50 added to your wallet.',
      wallet: user.wallet,
      lastCheckIn: user.lastCheckIn
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📅 Get user check-in history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkins = await CheckIn.find({ user: userId }).sort({ createdAt: -1 });
    res.json(checkins);
  } catch (err) {
    console.error('Check-in history error:', err);
    res.status(500).json({ message: 'Failed to fetch check-in history' });
  }
});

module.exports = router;