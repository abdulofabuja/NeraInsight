const express = require('express');
const router = express.Router();
const processDailyReturns = require('../creditDailyReturns'); // ✅ Ensure this file exists and exports a function

// Optional: Add auth middleware if needed
// const auth = require('../middlewares/auth');

router.post('/', async (req, res) => {
  try {
    await processDailyReturns();
    res.status(200).json({ success: true, message: '✅ Daily returns processed successfully.' });
  } catch (err) {
    console.error('❌ Error processing returns:', err);
    res.status(500).json({ success: false, message: '❌ Server error while processing returns.' });
  }
});

module.exports = router;