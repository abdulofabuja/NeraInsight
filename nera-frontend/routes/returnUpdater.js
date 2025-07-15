// /backend/routes/updateReturns.js

const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const User = require('../models/User');

router.post('/update-returns', async (req, res) => {
  try {
    const now = new Date();

    // Get all active investments (not expired and < 7 days)
    const investments = await Investment.find({
      expiresAt: { $gt: now },
      daysElapsed: { $lt: 7 },
    });

    for (let inv of investments) {
      const user = await User.findById(inv.user);
      if (!user) continue;

      // Add daily return to user's wallet
      user.wallet += inv.dailyReturn;

      // Update investment
      inv.totalReturn += inv.dailyReturn;
      inv.daysElapsed += 1;

      await user.save();
      await inv.save();
    }

    res.json({ message: 'Returns updated successfully', count: investments.length });
  } catch (err) {
    console.error('Update returns error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;