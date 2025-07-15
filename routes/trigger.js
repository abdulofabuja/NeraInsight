const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/trigger-returns', async (req, res) => {
  const secretKey = req.query.key;

  if (secretKey !== process.env.RETURN_TRIGGER_KEY) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const result = await axios.post(`${baseUrl}/api/update-returns`);
    res.json({ message: 'Triggered successfully', result: result.data });
  } catch (err) {
    console.error('❌ Trigger failed:', err.message);
    res.status(500).json({ message: 'Trigger failed', error: err.message });
  }
});

module.exports = router;