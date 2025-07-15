const express = require("express");
const router = express.Router();
const Investment = require("../models/Investment");
const User = require("../models/User");
const authMiddleware = require("../middlewares/auth");

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

    // Validate package
    if (!packages[amount]) {
      return res.status(400).json({ message: "Invalid package selected" });
    }

    // Prevent using locked bonus
    const usableBalance = user.bonusUnlocked ? user.wallet : user.wallet - 2000;
    if (usableBalance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Check for existing active investment
    const active = await Investment.findOne({
      user: userId,
      expiresAt: { $gt: new Date() },
    });
    if (active) {
      return res.status(400).json({ message: "You already have an active investment." });
    }

    // Deduct amount from wallet
    user.wallet -= amount;

    // ❌ No referral bonus logic here anymore
    // ✅ Bonus unlocking is already handled in topup.js

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