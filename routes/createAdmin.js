// createAdmin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load .env config
dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const phone = '07000000000'; // Change to your preferred admin phone
    const password = 'Admin123'; // Must follow your password rule
    const isAdmin = true;

    // Validate password format
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      console.log('❌ Password must be at least 6 characters, include 1 uppercase letter and a number.');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ phone });
    if (existingAdmin) {
      console.log('❌ Admin already exists with this phone');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      phone,
      password: hashedPassword,
      isAdmin,
      wallet: 0,
      bonusUnlocked: true,
    });

    await admin.save();

    console.log('\x1b[32m%s\x1b[0m', '✅ Admin created successfully!');
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔐 Password: ${password}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();