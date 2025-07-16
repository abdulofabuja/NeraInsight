// createAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const phone = '07000000000'; // You can change this
    const password = 'Admin123'; // Must follow the password rule
    const isAdmin = true;

    const existingAdmin = await User.findOne({ phone });
    if (existingAdmin) {
      console.log('❌ Admin already exists with this phone');
      process.exit();
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
    console.log('✅ Admin created successfully!');
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();