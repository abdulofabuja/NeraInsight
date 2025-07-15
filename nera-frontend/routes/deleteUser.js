const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function deleteUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB");

    const result = await User.deleteOne({ phone: "07070724430" });
    console.log("🗑️ User deleted:", result);

    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error deleting user:", error);
  }
}

deleteUser();