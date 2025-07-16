const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const phoneToDelete = '08111112222'; // change to the phone number to delete

    const result = await User.deleteOne({ phone: phoneToDelete });
    console.log('✅ User deleted:', result);
    mongoose.disconnect();
  })
  .catch((err) => console.error('❌ Error:', err));
