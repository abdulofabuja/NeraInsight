const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const User = require('../models/User');

// POST /api/update-returns
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

      // If 24 hours passed
      if (timeDiff >= 24 * 60 * 60 * 1000) {
        let dailyReturn = 0;

        switch (invest.amount) {
          case 2000: dailyReturn = 429; break;
          case 3000: dailyReturn = 715; break;
          case 5000: dailyReturn = 1286; break;
          case 7500: dailyReturn = 1857; break;
          default: continue; // Skip unknown package
        }

        const user = await User.findById(invest.user);
        if (!user) continue;

        user.wallet += dailyReturn;
        await user.save();

        invest.returns += dailyReturn;
        invest.lastUpdated = now;

        // Deactivate after full returns
        if (
          (invest.amount === 2000 && invest.returns >= 3005) ||
          (invest.amount === 3000 && invest.returns >= 5005) ||
          (invest.amount === 5000 && invest.returns >= 9000) ||
          (invest.amount === 7500 && invest.returns >= 13000)
        ) {
          invest.isActive = false;
        }

        await invest.save();
        updated++;
      }
    }

    res.json({ message: `✅ Returns updated for ${updated} investment(s)` });
  } catch (err) {
    console.error('❌ Error updating returns:', err);
    res.status(500).json({ message: 'Server error while updating returns' });
  }
});

module.exports = router;