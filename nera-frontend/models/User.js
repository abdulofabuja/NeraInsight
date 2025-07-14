const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  referredBy: {
    type: String,
    default: null,
  },
  referralCode: {
    type: String,
    unique: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase(),
  },
  bonusUnlocked: {
    type: Boolean,
    default: false,
  },
  firstTopupDone: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastCheckIn: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);