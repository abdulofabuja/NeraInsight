const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middlewares/auth');

// 📱 Register User
router.post('/register', async (req, res) => {
  try {
    const { phone, password, referredBy } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      phone,
      password: hashedPassword,
      referredBy: referredBy || null,
      wallet: 2000,
      bonusUnlocked: false,
    });

    await newUser.save();

    res.json({ message: 'User registered successfully', userId: newUser._id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        wallet: user.wallet,
        referredBy: user.referredBy,
        referralCode: user.referralCode,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👤 Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      phone: user.phone,
      wallet: user.wallet,
      bonusUnlocked: user.bonusUnlocked,
      referralCode: user.referralCode,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 💳 Save or Update Bank Details
router.post('/bank-details', authenticateToken, async (req, res) => {
  try {
    const { accountName, bankName, accountNumber } = req.body;

    if (!accountName || !bankName || !accountNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.accountName = accountName;
    user.bankName = bankName;
    user.accountNumber = accountNumber;

    await user.save();

    res.json({ message: 'Bank details saved successfully' });
  } catch (err) {
    console.error('Bank update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📅 Daily Check-in
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const lastCheckIn = user.lastCheckIn || new Date(0);
    const isSameDay = lastCheckIn.toDateString() === now.toDateString();

    if (isSameDay) {
      return res.status(400).json({ message: 'You have already checked in today' });
    }

    user.wallet += 50;
    user.lastCheckIn = now;
    await user.save();

    res.json({ message: 'Checked in successfully! You earned ₦50.', wallet: user.wallet });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📊 Platform Insight
router.get('/insight', authenticateToken, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const investments = await Investment.find();
    const withdrawals = await Withdrawal.find();

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    res.json({
      totalUsers,
      totalInvested,
      totalWithdrawn,
    });
  } catch (err) {
    console.error('Insight fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch insight data' });
  }
});

module.exports = router;