require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');

const MONGO_URI = process.env.MONGO_URI;

async function processDailyReturns() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  const today = new Date();

  const investments = await Investment.find({ isActive: true });

  for (let inv of investments) {
    const daysPassed = Math.floor((today - new Date(inv.startDate)) / (1000 * 60 * 60 * 24));

    if (daysPassed < 7) {
      const user = await User.findById(inv.userId);
      const dailyReturn = inv.dailyReturn || 0;

      if (user && dailyReturn) {
        user.wallet += dailyReturn;
        await user.save();
      }
    }

    if (daysPassed >= 7) {
      inv.isActive = false;
      await inv.save();
    }
  }

  console.log('🎉 Done processing daily returns!');
}

// Export it
module.exports = processDailyReturns;