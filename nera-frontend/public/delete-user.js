const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const result = await User.deleteOne({ phone: "08123456789" });
    console.log("User deleted:", result);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("MongoDB error:", err);
  });
