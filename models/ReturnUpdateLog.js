const mongoose = require('mongoose');

const returnUpdateLogSchema = new mongoose.Schema({
  lastRun: {
    type: Date,
    default: new Date(0) // Set default to old date
  }
});

module.exports = mongoose.model('ReturnUpdateLog', returnUpdateLogSchema);