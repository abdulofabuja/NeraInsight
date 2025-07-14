const express = require("express");
const router = express.Router();
const Investment = require("../models/Investment");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Fixed investment packages and their daily returns
const packages = {
  2000: 300,
  3000: 400,
  5000: 700,
  7500: 1000,
};

// POST /api/investments/invest
router.post("/invest", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { amount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!packages[amount]) {
      return res.status(400).json({ message: "Invalid package selected" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const active = await Investment.findOne({
      user: userId,
      expiresAt: { $gt: new Date() },
    });
    if (active) {
      return res.status(400).json({ message: "You already have an active investment." });
    }

    user.wallet -= amount;

    const isFirstInvestment = !(await Investment.findOne({ user: userId }));
    if (isFirstInvestment && user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });

      if (referrer) {
        const referralBonus = 500 + 0.1 * amount;
        referrer.wallet += referralBonus;
        await referrer.save();
      }

      if (!user.bonusUnlocked) {
        user.wallet += 2000;
        user.bonusUnlocked = true;
      }
    }

    await user.save();

    const newInvestment = new Investment({
      user: userId,
      amount,
      dailyReturn: packages[amount],
      totalReturn: 0,
      daysElapsed: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await newInvestment.save();

    res.json({ message: "Investment successful", investment: newInvestment });
  } catch (error) {
    console.error("Investment Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;