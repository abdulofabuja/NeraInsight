const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/investment', require('./routes/investment'));
app.use('/api/topup', require('./routes/topup'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/returns', require('./routes/returnUpdater'));
app.use('/api/payment', require('./routes/payment'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is alive' });
});
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Render healthz passed' });
});
app.get('/test', (req, res) => {
  res.send('🔥 Test successful!');
});

// Default redirect
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Serve .html files manually
app.get('/*.html', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  res.sendFile(filePath, err => {
    if (err) {
      console.error(`❌ HTML file not found: ${filePath}`);
      res.status(404).send('Page not found');
    }
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});