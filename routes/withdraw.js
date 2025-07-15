const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// 📤 Request withdrawal
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    const user = await User.findById(userId);

    if (!user || !user.hasInvested) {
      return res.status(403).json({ message: 'You must invest before withdrawing.' });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    const newWithdrawal = new Withdrawal({
      user: userId,
      amount,
    });

    await newWithdrawal.save();

    user.wallet -= amount;
    await user.save();

    res.json({ message: 'Withdrawal request submitted.' });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📜 Get all withdrawal requests (admin)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.phone !== '07070724430') {
      return res.status(403).json({ message: 'Admin only.' });
    }

    const requests = await Withdrawal.find().populate('user').sort({ requestedAt: -1 });

    const formatted = requests.map(req => ({
      _id: req._id,
      name: req.user.phone,
      amount: req.amount,
      status: req.status,
      requestedAt: req.requestedAt,
      bankName: req.user.bankName,
      accountNumber: req.user.accountNumber,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Admin get requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Admin approve withdrawal
router.put('/approve/:id', authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin || admin.phone !== '07070724430') {
      return res.status(403).json({ message: 'Admin only.' });
    }

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found.' });
    }

    withdrawal.status = 'approved';
    await withdrawal.save();

    res.json({ message: 'Withdrawal approved.' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ❌ Admin decline withdrawal
router.put('/decline/:id', authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin || admin.phone !== '07070724430') {
      return res.status(403).json({ message: 'Admin only.' });
    }

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found.' });
    }

    withdrawal.status = 'declined';
    await withdrawal.save();

    // refund back to user
    const user = await User.findById(withdrawal.user);
    user.wallet += withdrawal.amount;
    await user.save();

    res.json({ message: 'Withdrawal declined & amount refunded.' });
  } catch (err) {
    console.error('Decline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📜 Get withdrawal history for logged-in user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const withdrawals = await Withdrawal.find({ user: userId }).sort({ requestedAt: -1 });

    const formatted = withdrawals.map(w => ({
      _id: w._id,
      amount: w.amount,
      status: w.status,
      requestedAt: w.requestedAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Withdrawal history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;