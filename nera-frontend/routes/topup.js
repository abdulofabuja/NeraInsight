// backend/routes/topup.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🏦 Top-up Wallet Route
router.post('/', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Validate input
    if (!userId || !amount || amount < 2000) {
      return res.status(400).json({ message: 'Invalid top-up request' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isFirstTopup = !user.firstTopupDone;

    // Add top-up amount to wallet
    user.wallet += amount;

    // Unlock ₦2000 bonus if first top-up
    if (!user.bonusUnlocked && amount >= 2000) {
      user.wallet += 2000;
      user.bonusUnlocked = true;
    }

    // Handle referral bonus if first top-up
    if (isFirstTopup && user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });

      if (referrer) {
        const bonus = Math.floor(amount * 0.1); // 10%
        referrer.wallet += bonus;
        await referrer.save();
      }
    }

    user.firstTopupDone = true;
    await user.save();

    res.json({
      message: 'Top-up successful',
      wallet: user.wallet,
      bonusUnlocked: user.bonusUnlocked,
    });

  } catch (err) {
    console.error('Top-up error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;