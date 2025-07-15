const mongoose = require('mongoose');

const topupRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TopupRequest', topupRequestSchema);