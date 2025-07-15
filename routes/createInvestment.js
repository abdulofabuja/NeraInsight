const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Investment = require('../models/Investment');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const phone = '09169152652'; // User's phone number
  const amount = 3000; // Investment amount

  const user = await User.findOne({ phone });
  if (!user) return console.log('❌ User not found');

  if (user.wallet < amount) {
    return console.log('❌ Not enough balance in wallet');
  }

  user.wallet -= amount;

  const newInvestment = new Investment({
    user: user._id,
    amount,
    dailyReturn: 500, // you can calculate percentage if needed
    totalReturn: 0,
    daysElapsed: 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();
  await newInvestment.save();

  console.log('✅ Investment created and wallet updated!');
  mongoose.disconnect();
};

run();