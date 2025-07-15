// manualInvestment.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Investment = require('../models/Investment');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const phone = '09169152652'; // Target user's phone
    const amount = 3000; // Amount to invest

    const user = await User.findOne({ phone });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    if (user.wallet < amount) {
      console.log('❌ Not enough balance in wallet');
      process.exit(1);
    }

    // Calculate daily return based on your new return logic
    let dailyReturn = 0;
    if (amount === 2000) dailyReturn = Math.floor(1000 / 7);
    else if (amount === 3000) dailyReturn = Math.floor(2500 / 7);
    else if (amount === 5000) dailyReturn = Math.floor(4000 / 7);
    else if (amount === 7500) dailyReturn = Math.floor(5000 / 7);
    else return console.log('❌ Invalid investment amount');

    user.wallet -= amount;

    const newInvestment = new Investment({
      user: user._id,
      amount,
      dailyReturn,
      totalReturn: 0,
      daysElapsed: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await user.save();
    await newInvestment.save();

    console.log('\x1b[32m%s\x1b[0m', `✅ ₦${amount} investment created for ${phone}`);
    console.log(`💰 Daily Return: ₦${dailyReturn} for 7 days`);
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();