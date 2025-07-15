const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const auth = require('../middlewares/auth');

// REQUEST WITHDRAWAL
router.post('/request', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount.' });
    }

    // 🔒 Enforce ₦3000 minimum withdrawal
    if (amount < 3000) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₦3000.' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    if (!user.bankName || !user.accountNumber) {
      return res.status(400).json({ message: 'Please save your bank details first.' });
    }

    const withdrawal = new Withdrawal({
      user: user._id,
      amount,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      status: 'pending',
    });

    await withdrawal.save();

    user.wallet -= amount;
    await user.save();

    res.json({ message: 'Withdrawal request submitted successfully.' });
  } catch (err) {
    console.error('Withdrawal request error:', err);
    res.status(500).json({ message: 'Server error. Try again later.' });
  }
});

// GET WITHDRAWAL HISTORY
router.get('/history', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json({ withdrawals });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ message: 'Could not fetch withdrawal history.' });
  }
});

module.exports = router;