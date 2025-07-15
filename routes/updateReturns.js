const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const User = require('../models/User');
const ReturnUpdateLog = require('../models/ReturnUpdateLog');

router.post('/update-returns', async (req, res) => {
  try {
    const now = new Date();

    // Get all active investments (not expired and less than 7 days)
    const investments = await Investment.find({
      expiresAt: { $gt: now },
      daysElapsed: { $lt: 7 },
    });

    let processedCount = 0;

    for (let inv of investments) {
      const user = await User.findById(inv.user);
      if (!user) continue;

      // Check if this investment has been updated in the last 24 hours
      const lastLog = await ReturnUpdateLog.findOne({
        investmentId: inv._id,
      }).sort({ updatedAt: -1 });

      if (lastLog) {
        const diff = now - lastLog.updatedAt;
        const hoursPassed = diff / (1000 * 60 * 60);
        if (hoursPassed < 24) continue; // Skip if not 24 hours yet
      }

      // Update user's wallet with daily return
      user.wallet += inv.dailyReturn;

      // Update investment progress
      inv.totalReturn += inv.dailyReturn;
      inv.daysElapsed += 1;

      await user.save();
      await inv.save();

      // Log this update
      await ReturnUpdateLog.create({
        investmentId: inv._id,
        userId: user._id,
        amountAdded: inv.dailyReturn,
        updatedAt: now,
      });

      processedCount++;
    }

    res.json({ message: '✅ Returns updated successfully', updated: processedCount });
  } catch (err) {
    console.error('Update returns error:', err);
    res.status(500).json({ message: '❌ Server error' });
  }
});

module.exports = router;