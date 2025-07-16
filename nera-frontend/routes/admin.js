// /backend/routes/admin.js

const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const auth = require('../middlewares/auth');

// ✅ Approve withdrawal
router.post('/withdraw/approve/:id', auth, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    withdrawal.status = 'approved';
    await withdrawal.save();

    res.json({ message: 'Withdrawal approved successfully' });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ❌ Decline withdrawal and refund wallet
router.post('/withdraw/decline/:id', auth, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    // Refund amount to user wallet
    const user = await User.findById(withdrawal.user._id);
    user.wallet += withdrawal.amount;
    await user.save();

    withdrawal.status = 'declined';
    await withdrawal.save();

    res.json({ message: 'Withdrawal declined and refunded to wallet' });
  } catch (err) {
    console.error('Decline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ View all users (admin only)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

module.exports = router;