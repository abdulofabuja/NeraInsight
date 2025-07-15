const express = require('express');
const router = express.Router();
const processDailyReturns = require('../creditDailyReturns'); // Make sure path is correct

// Middleware (optional: secure with admin token)
// const auth = require('../middlewares/auth');

router.get('/daily', async (req, res) => {
  try {
    await processDailyReturns();
    res.status(200).json({ success: true, message: 'Daily returns processed.' });
  } catch (err) {
    console.error('Error processing returns:', err);
    res.status(500).json({ success: false, message: 'Server error while processing returns.' });
  }
});

module.exports = router;