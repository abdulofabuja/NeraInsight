const express = require('express');
const router = express.Router();
const TopupRequest = require('../models/TopupRequest');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth');

// 📌 1. Create top-up request (user)
router.post('/request', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount < 2000) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    const request = new TopupRequest({ userId, amount });
    await request.save();

    res.json({ message: 'Top-up request submitted', request });
  } catch (err) {
    console.error('Top-up request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 2. Get all top-up requests (admin)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await TopupRequest.find().sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Error fetching top-up requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 3. Approve top-up (admin)
router.post('/approve/:id', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await TopupRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const user = await User.findById(request.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Credit user's wallet
    user.wallet += request.amount;

    // ✅ Unlock ₦2000 bonus if it's first top-up
    if (!user.bonusUnlocked && request.amount >= 2000) {
      user.wallet += 2000;
      user.bonusUnlocked = true;
    }

    // ✅ Handle referral bonus
    if (!user.firstTopupDone && user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });
      if (referrer) {
        const bonus = Math.floor(request.amount * 0.1);
        referrer.wallet += bonus;
        await referrer.save();
      }
    }

    user.firstTopupDone = true;
    await user.save();

    // ✅ Delete request after approval
    await request.remove();

    res.json({ message: 'Top-up approved and wallet credited' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 4. Decline top-up (admin)
router.post('/decline/:id', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await TopupRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await request.deleteOne();
    res.json({ message: 'Top-up request declined and removed' });
  } catch (err) {
    console.error('Decline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;