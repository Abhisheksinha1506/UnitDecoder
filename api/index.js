// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const config = require('../config');

// Import routes
const searchRoutes = require('../routes/search');
const unitsRoutes = require('../routes/units');
const convertRoutes = require('../routes/convert');

const app = express();

// Trust proxy for correct IP detection (important for Vercel)
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/search', searchRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/convert', convertRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: 'The requested API endpoint does not exist'
  });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/unit', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'unit.html'));
});

// 404 handler for frontend routes
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});

// Export the handler for Vercel
module.exports = app;
