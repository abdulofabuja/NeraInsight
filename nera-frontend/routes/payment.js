const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Investment = require('../models/Investment');
require('dotenv').config();

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

// Middleware to protect routes
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Investment packages with daily return
const packages = {
  2000: 429,
  3000: 715,
  5000: 1286,
  7500: 1857,
};

// POST /api/payment/flutterwave/verify
router.post('/flutterwave/verify', authenticate, async (req, res) => {
  const { transaction_id, amount } = req.body;

  if (!transaction_id || !amount) {
    return res.status(400).json({ message: 'Missing transaction ID or amount' });
  }

  try {
    // Verify transaction with Flutterwave
    const flutterRes = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`
        }
      }
    );

    const paymentData = flutterRes.data.data;

    if (paymentData.status === 'successful' && paymentData.amount === amount && paymentData.currency === 'NGN') {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const hasInvestedBefore = await Investment.exists({ user: user._id });

      // Unlock ₦2000 bonus if first topup
      if (!hasInvestedBefore && !user.bonusUnlocked && amount >= 2000) {
        user.wallet += 2000;
        user.bonusUnlocked = true;
      }

      // Create investment
      const newInvestment = new Investment({
        user: user._id,
        amount,
        dailyReturn: packages[amount] || 0,
        totalReturn: 0,
        daysElapsed: 0,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await newInvestment.save();

      // Referral bonus on first topup
      if (!hasInvestedBefore && user.referredBy) {
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (referrer) {
          const bonus = Math.floor(amount * 0.1);
          referrer.wallet += bonus;
          await referrer.save();
        }
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: '✅ Investment activated after successful Flutterwave payment!'
      });
    } else {
      return res.status(400).json({ message: '❌ Payment verification failed' });
    }
  } catch (err) {
    console.error('Flutterwave verify error:', err.message);
    return res.status(500).json({ message: 'Server error during Flutterwave verification' });
  }
});

module.exports = router;