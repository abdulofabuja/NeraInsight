const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const TopupRequest = require('../models/TopupRequest');
const Investment = require('../models/Investment'); // ✅ Add this
const authMiddleware = require('../middlewares/auth');

// 🧾 User requests manual top-up (admin approval)
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

// 🔐 Admin - View all pending top-up requests
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

// 🚀 NEW: Auto-Invest After Paystack Payment
router.post('/paystack/verify', authMiddleware, async (req, res) => {
  const { reference, amount, returns } = req.body;

  if (!reference || !amount || !returns) {
    return res.status(400).json({ message: 'Missing reference or package info' });
  }

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ VERIFY PAYSTACK PAYMENT
    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const paymentData = paystackRes.data;
    if (!paymentData.status || paymentData.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // ✅ 1. Create Investment
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

    // ✅ 3. Referral bonus
    if (!user.firstTopupDone && user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer) {
        referrer.wallet += 500 + Math.floor(amount * 0.1);
        await referrer.save();
      }
    }

    user.firstTopupDone = true;
    await user.save();

    return res.json({ message: 'Investment started successfully!' });

  } catch (err) {
    console.error('Paystack verify error:', err.message);
    return res.status(500).json({ message: 'Server error during Paystack verification' });
  }
});

module.exports = router;