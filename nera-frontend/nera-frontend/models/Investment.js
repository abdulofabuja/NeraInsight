// /backend/models/Investment.js

const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  dailyReturn: {
    type: Number,
    required: true,
  },
  totalReturn: {
    type: Number,
    default: 0,
  },
  daysElapsed: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Investment', investmentSchema);