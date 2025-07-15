const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Investment = require('../models/Investment');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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

// POST /api/payment/verify
router.post('/verify', authenticate, async (req, res) => {
  const { reference, amount } = req.body;

  if (!reference || !amount) {
    return res.status(400).json({ message: 'Missing reference or amount' });
  }

  try {
    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = paystackRes.data.data;

    if (paymentData.status === 'success' && paymentData.amount === amount * 100) {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Activate investment
      const newInvestment = new Investment({
        userId: user._id,
        amount,
        createdAt: new Date(),
      });
      await newInvestment.save();

      // Unlock ₦2000 bonus if it's the first investment
      const isFirstInvestment = !(await Investment.findOne({ userId: user._id, _id: { $ne: newInvestment._id } }));
      if (isFirstInvestment && !user.bonusUnlocked) {
        user.wallet += 2000;
        user.bonusUnlocked = true;
      }

      // Referral bonus (10%) only if first investment
      if (isFirstInvestment && user.referredBy) {
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
        message: '✅ Payment verified and investment activated!',
      });
    } else {
      return res.status(400).json({ message: '❌ Invalid payment confirmation' });
    }
  } catch (err) {
    console.error('Payment verification error:', err.message);
    return res.status(500).json({ message: 'Server error during payment verification' });
  }
});

module.exports = router;