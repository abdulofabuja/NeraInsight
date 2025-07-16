// creditDailyReturns.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');

const MONGO_URI = process.env.MONGO_URI;

async function processDailyReturns() {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  const today = new Date();

  // Get all active investments
  const investments = await Investment.find({ isActive: true });

  for (let inv of investments) {
    const startDate = inv.startDate || inv.createdAt;
    const daysPassed = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24));

    // Process only if less than 7 days
    if (daysPassed < 7) {
      const user = await User.findById(inv.userId);
      const dailyReturn = inv.dailyReturn || 0;

      if (user && dailyReturn) {
        user.wallet += dailyReturn;
        await user.save();
      }
    }

    // Deactivate investment after 7 days
    if (daysPassed >= 7) {
      inv.isActive = false;
      await inv.save();
    }
  }

  console.log('🎉 Done processing daily returns!');
}

// Export the function
module.exports = processDailyReturns;