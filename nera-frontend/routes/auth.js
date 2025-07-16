const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// 👤 Register User
router.post('/register', async (req, res) => {
  try {
    const { phone, password, referralCode } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    if (!/^0\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid Nigerian phone number format' });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters, contain 1 uppercase letter and numbers',
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      phone,
      password: hashedPassword,
      referredBy: referralCode || null,
      wallet: 2000,
      bonusUnlocked: false,
    });

    await newUser.save();

    // ✅ Referral Logic
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });

      if (referrer) {
        const referredBonus = 2000; // user gets this at registration
        
        const tenPercentBonus = 200; // 10% of 2000 deposit
        referrer.wallet += tenPercentBonus;
        await referrer.save();
      }
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👤 Regular User Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid phone or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone or password' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        wallet: user.wallet,
        referralCode: user.referralCode,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👨‍💼 Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const admin = await User.findOne({ phone, isAdmin: true });
    if (!admin) {
      return res.status(403).json({ message: 'Access denied. Not an admin.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      {
        userId: admin._id,
        phone: admin.phone,
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        phone: admin.phone,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;