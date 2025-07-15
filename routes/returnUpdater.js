// routes/returnUpdater.js
const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const User = require('../models/User');

router.post('/update-returns', async (req, res) => {
  try {
    const investments = await Investment.find({ isActive: true });

    let updated = 0;

    for (const invest of investments) {
      if (!invest.lastUpdated) {
        invest.lastUpdated = invest.createdAt;
      }

      const now = new Date();
      const timeDiff = now - invest.lastUpdated;

      // Check if 24 hours has passed since last update
      if (timeDiff >= 24 * 60 * 60 * 1000) {
        // Daily return based on original amount
        let dailyReturn = 0;
        if (invest.amount === 2000) dailyReturn = 429;
        if (invest.amount === 3000) dailyReturn = 715;
        if (invest.amount === 5000) dailyReturn = 1286;
        if (invest.amount === 7500) dailyReturn = 1857;

        // Add daily return to wallet
        const user = await User.findById(invest.userId);
        if (user) {
          user.wallet += dailyReturn;
          await user.save();
        }

        invest.lastUpdated = now;
        invest.returns += dailyReturn;

        // After 7 updates, mark as inactive
        if (invest.returns >= 3005 && invest.amount === 2000) invest.isActive = false;
        if (invest.returns >= 5005 && invest.amount === 3000) invest.isActive = false;
        if (invest.returns >= 9000 && invest.amount === 5000) invest.isActive = false;
        if (invest.returns >= 13000 && invest.amount === 7500) invest.isActive = false;

        await invest.save();
        updated++;
      }
    }

    res.json({ message: 'Returns updated successfully', count: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
