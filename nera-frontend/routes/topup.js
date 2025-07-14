// backend/routes/topup.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TopupRequest = require('../models/TopupRequest'); // ✅ New Model
const authMiddleware = require('../middleware/auth');

// 🧾 User requests top-up (amount saved for admin to approve)
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount < 2000) {
      return res.status(400).json({ message: 'Minimum top-up is ₦2000' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const request = new TopupRequest({ user: userId, amount });
    await request.save();

    res.json({ message: 'Top-up request submitted. Awaiting admin approval.' });
  } catch (err) {
    console.error('Top-up request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Admin - View all top-up requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await TopupRequest.find({ status: 'pending' })
      .populate('user')
      .sort({ requestedAt: -1 });

    const formatted = requests.map(r => ({
      _id: r._id,
      amount: r.amount,
      userPhone: r.user.phone,
      requestedAt: r.requestedAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Admin - Approve top-up
router.post('/approve/:id', authMiddleware, async (req, res) => {
  try {
    const topup = await TopupRequest.findById(req.params.id).populate('user');
    if (!topup || topup.status !== 'pending') {
      return res.status(404).json({ message: 'Top-up not found or already processed' });
    }

    const user = topup.user;
    const amount = topup.amount;
    const isFirstTopup = !user.firstTopupDone;

    // Add top-up amount to wallet
    user.wallet += amount;

    // Unlock ₦2000 bonus if first top-up
    if (!user.bonusUnlocked && amount >= 2000) {
      user.wallet += 2000;
      user.bonusUnlocked = true;
    }

    // Handle referral bonus
    if (isFirstTopup && user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer) {
        const bonus = Math.floor(amount * 0.1);
        referrer.wallet += bonus;
        await referrer.save();
      }
    }

    user.firstTopupDone = true;
    await user.save();

    topup.status = 'approved';
    await topup.save();

    res.json({ message: 'Top-up approved and wallet credited.' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Admin - Decline top-up
router.post('/decline/:id', authMiddleware, async (req, res) => {
  try {
    const topup = await TopupRequest.findById(req.params.id);
    if (!topup || topup.status !== 'pending') {
      return res.status(404).json({ message: 'Top-up not found or already processed' });
    }

    topup.status = 'declined';
    await topup.save();

    res.json({ message: 'Top-up declined.' });
  } catch (err) {
    console.error('Decline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;