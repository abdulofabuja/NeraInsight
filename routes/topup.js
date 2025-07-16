const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Investment = require('../models/Investment');
const authMiddleware = require('../middlewares/auth');

// ✅ PAYSTACK VERIFY & INVEST
router.post('/paystack/verify', authMiddleware, async (req, res) => {
  const { reference, amount, returns } = req.body;

  if (!reference || !amount || !returns) {
    return res.status(400).json({ message: 'Missing reference or package info' });
  }

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Verify Paystack Transaction
    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const paymentData = paystackRes.data;
    if (!paymentData.status || paymentData.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // ✅ 1. Create new investment
    const newInvestment = new Investment({
      userId,
      amount,
      returns,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'running'
    });
    await newInvestment.save();

    // ✅ 2. Unlock ₦2000 bonus if first top-up
    if (!user.firstTopupDone && !user.bonusUnlocked && amount >= 2000) {
      user.wallet += 2000;
      user.bonusUnlocked = true;
    }

    // ✅ 3. Referral bonus: 10% of first deposit (no ₦500)
    if (!user.firstTopupDone && user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer) {
        const bonus = Math.floor(amount * 0.1);
        referrer.wallet += bonus;
        await referrer.save();
      }
    }

    user.firstTopupDone = true;
    await user.save();

    res.json({ message: 'Investment started successfully!' });

  } catch (err) {
    console.error('Paystack verify error:', err.message);
    res.status(500).json({ message: 'Server error during Paystack verification' });
  }
});

module.exports = router;