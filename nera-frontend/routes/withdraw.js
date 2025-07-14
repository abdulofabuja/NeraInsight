const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Investment = require('../models/Investment'); // ✅ Added this
const authMiddleware = require('../middlewares/auth');

// 🏧 User requests withdrawal
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Check if user has invested before
    const hasInvestment = await Investment.findOne({ user: userId });
    if (!hasInvestment) {
      return res.status(400).json({ message: 'You must invest in a package before requesting withdrawal.' });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const withdrawal = new Withdrawal({
      user: user._id,
      amount,
    });

    user.wallet -= amount;

    await withdrawal.save();
    await user.save();

    res.json({ message: 'Withdrawal request submitted', withdrawal });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Admin - Get all withdrawal requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ requestedAt: -1 }).populate('user');

    const formatted = withdrawals.map(w => ({
      _id: w._id,
      amount: w.amount,
      status: w.status,
      userPhone: w.user.phone,
      bankName: w.user.bankName,
      accountNumber: w.user.accountNumber,
      requestedAt: w.requestedAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Admin - Approve withdrawal
router.post('/approve/:id', authMiddleware, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    withdrawal.status = 'approved';
    await withdrawal.save();

    res.json({ message: 'Withdrawal approved' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Admin - Decline withdrawal and refund user
router.post('/decline/:id', authMiddleware, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    withdrawal.status = 'declined';
    await withdrawal.save();

    // Refund user
    const user = await User.findById(withdrawal.user._id);
    user.wallet += withdrawal.amount;
    await user.save();

    res.json({ message: 'Withdrawal declined and user refunded' });
  } catch (err) {
    console.error('Decline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;