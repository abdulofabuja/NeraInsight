const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');
const Investment = require('../models/Investment');

// 📊 GET user insight summary
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const investments = await Investment.find({ user: userId });

    const totalInvestments = investments.length;
    const activePackages = investments.filter(inv => inv.status === 'active').length;
    const totalProfit = investments.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);

    res.json({
      totalInvestments,
      activePackages,
      totalProfit
    });

  } catch (err) {
    console.error('Insight route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;