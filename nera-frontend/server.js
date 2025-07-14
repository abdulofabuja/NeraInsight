const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static frontend (HTML/CSS/JS) from ./public inside backend folder
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/investment', require('./routes/investment'));
app.use('/api/topup', require('./routes/topup'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/returns', require('./routes/returnUpdater'));
app.use('/api/payment', require('./routes/payment'));

// ✅ Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is alive' });
});
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Render healthz passed' });
});
app.get('/test', (req, res) => {
  res.send('🔥 Test successful!');
});

// ✅ Redirect root to login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ✅ Serve specific HTML files if they exist
app.get('/*.html', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`❌ HTML file not found: ${filePath}`);
      res.status(404).send('Page not found');
    }
  });
});

// ✅ Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Or use individual env vars
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(() => {
    console.log('✅ PostgreSQL connected');
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err);
  });

// ✅ Make the pool available globally (optional)
global.pgPool = pool;

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});