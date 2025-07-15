const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const auth = require('../middlewares/auth');

// Helper: Admin check middleware (optional, uncomment and use if you want)
// const adminCheck = (req, res, next) => {
//   if (!req.user.isAdmin) return res.status(403).json({ message: 'Access denied: Admins only.' });
//   next();
// };

// REQUEST WITHDRAWAL
router.post('/request', auth, async (req, res) => {
  console.log('[Withdraw Request] User:', req.user.userId);
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      console.log('[Withdraw Request] Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid withdrawal amount.' });
    }

    if (amount < 3000) {
      console.log('[Withdraw Request] Amount less than minimum:', amount);
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₦3000.' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      console.log('[Withdraw Request] User not found:', req.user.userId);
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.bankName || !user.accountNumber) {
      console.log('[Withdraw Request] Bank details missing for user:', user._id);
      return res.status(400).json({ message: 'Please save your bank details first.' });
    }

    if (user.wallet < amount) {
      console.log('[Withdraw Request] Insufficient balance:', user.wallet, 'requested:', amount);
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    const withdrawal = new Withdrawal({
      user: user._id,
      amount,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      status: 'pending',
    });

    await withdrawal.save();

    console.log('[Withdraw Request] Withdrawal saved for user:', user._id, 'amount:', amount);

    res.json({ message: 'Withdrawal request submitted successfully.' });
  } catch (err) {
    console.error('[Withdraw Request] Server error:', err);
    res.status(500).json({ message: 'Server error. Try again later.' });
  }
});

// GET WITHDRAWAL HISTORY
router.get('/history', auth, async (req, res) => {
  console.log('[Withdraw History] User:', req.user.userId);
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json({ withdrawals });
  } catch (err) {
    console.error('[Withdraw History] Error:', err);
    res.status(500).json({ message: 'Could not fetch withdrawal history.' });
  }
});

// ADMIN: GET ALL WITHDRAWAL REQUESTS
router.get('/requests', auth, /* adminCheck, */ async (req, res) => {
  console.log('[Admin Withdraw Requests] Requested by:', req.user.userId);
  try {
    const withdrawals = await Withdrawal.find().populate('user', 'phone bankName accountNumber').sort({ createdAt: -1 });

    const data = withdrawals.map(w => ({
      _id: w._id,
      userId: w.user._id,
      userPhone: w.user.phone,
      amount: w.amount,
      bankName: w.bankName,
      accountNumber: w.accountNumber,
      status: w.status,
      createdAt: w.createdAt
    }));

    res.json(data);
  } catch (err) {
    console.error('[Admin Withdraw Requests] Error:', err);
    res.status(500).json({ message: 'Server error retrieving withdrawals.' });
  }
});

// ADMIN: APPROVE WITHDRAWAL
router.post('/approve/:id', auth, /* adminCheck, */ async (req, res) => {
  console.log('[Admin Approve Withdraw] ID:', req.params.id, 'By:', req.user.userId);
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');

    if (!withdrawal) {
      console.log('[Admin Approve Withdraw] Withdrawal not found:', req.params.id);
      return res.status(404).json({ message: 'Withdrawal request not found.' });
    }

    if (withdrawal.status !== 'pending') {
      console.log('[Admin Approve Withdraw] Already processed:', withdrawal.status);
      return res.status(400).json({ message: 'Withdrawal request already processed.' });
    }

    const user = withdrawal.user;

    if (user.wallet < withdrawal.amount) {
      console.log('[Admin Approve Withdraw] User insufficient balance:', user.wallet, 'needed:', withdrawal.amount);
      return res.status(400).json({ message: 'User has insufficient balance.' });
    }

    user.wallet -= withdrawal.amount;
    await user.save();

    withdrawal.status = 'approved';
    await withdrawal.save();

    console.log('[Admin Approve Withdraw] Approved withdrawal ID:', withdrawal._id);

    res.json({ message: 'Withdrawal approved and user wallet updated.' });
  } catch (err) {
    console.error('[Admin Approve Withdraw] Server error:', err);
    res.status(500).json({ message: 'Server error approving withdrawal.' });
  }
});

// ADMIN: DECLINE WITHDRAWAL
router.post('/decline/:id', auth, /* adminCheck, */ async (req, res) => {
  console.log('[Admin Decline Withdraw] ID:', req.params.id, 'By:', req.user.userId);
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      console.log('[Admin Decline Withdraw] Withdrawal not found:', req.params.id);
      return res.status(404).json({ message: 'Withdrawal request not found.' });
    }

    if (withdrawal.status !== 'pending') {
      console.log('[Admin Decline Withdraw] Already processed:', withdrawal.status);
      return res.status(400).json({ message: 'Withdrawal request already processed.' });
    }

    withdrawal.status = 'declined';
    await withdrawal.save();

    console.log('[Admin Decline Withdraw] Declined withdrawal ID:', withdrawal._id);

    res.json({ message: 'Withdrawal request declined.' });
  } catch (err) {
    console.error('[Admin Decline Withdraw] Server error:', err);
    res.status(500).json({ message: 'Server error declining withdrawal.' });
  }
});

module.exports = router;