const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CheckIn = require('../models/checkin'); // ⬅️ add this line
const authenticateToken = require('../middleware/auth');

// ✅ Daily check-in route
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

    // Update user wallet and check-in time
    user.wallet += 50;
    user.lastCheckIn = now;

    await user.save();

    // Save to CheckIn history
    const checkInRecord = new CheckIn({
      user: user._id,
      reward: 50,
    });

    await checkInRecord.save();

    res.json({
      message: 'Check-in successful. ₦50 added to your wallet.',
      wallet: user.wallet,
      lastCheckIn: user.lastCheckIn,
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Check-in history route
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const checkins = await CheckIn.find({ user: userId }).sort({ createdAt: -1 });

    res.json({ history: checkins });

  } catch (err) {
    console.error('Check-in history error:', err);
    res.status(500).json({ message: 'Failed to fetch check-in history' });
  }
});

module.exports = router;