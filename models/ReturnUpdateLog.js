// models/ReturnUpdateLog.js
const mongoose = require('mongoose');

const returnUpdateLogSchema = new mongoose.Schema({
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amountAdded: Number,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReturnUpdateLog', returnUpdateLogSchema);