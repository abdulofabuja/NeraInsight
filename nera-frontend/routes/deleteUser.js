// deleteUser.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function deleteUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to database");

    const phone = "07070724430"; // Change this if needed
    const user = await User.findOne({ phone });

    if (!user) {
      console.log(`❌ No user found with phone: ${phone}`);
      return;
    }

    const result = await User.deleteOne({ phone });
    console.log(`🗑️ User (${phone}) deleted.`, result);

  } catch (error) {
    console.error("❌ Error deleting user:", error.message || error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

deleteUser();