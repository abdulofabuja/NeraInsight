// routes/insight.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const Investment = require('../models/Investment');
const User = require('../models/User');

// 📊 GET /api/insights - Get insight data for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const investments = await Investment.find({ user: userId });

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activePackages = investments.length;
    const totalProfit = investments.reduce((sum, inv) => sum + (inv.profitEarned || 0), 0);

    res.json({
      totalInvested,
      activePackages,
      totalProfit
    });
  } catch (err) {
    console.error('Insight fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
