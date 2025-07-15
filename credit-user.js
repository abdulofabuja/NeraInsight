require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const phone = '09169152652'; // ✅ User's phone number
    const amountToSubtract = 2000; // ✅ Amount to subtract

    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found!');
      process.exit();
    }

    user.wallet -= amountToSubtract;
    await user.save();

    console.log(`✅ Deducted ₦${amountToSubtract} from ${phone}. New wallet balance: ₦${user.wallet}`);
    process.exit();
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err);
    process.exit();
  });
