// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
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

// API routes (remove /api prefix since this is already in /api/ directory)
app.use('/search', searchRoutes);
app.use('/units', unitsRoutes);
app.use('/convert', convertRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
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
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: 'The requested API endpoint does not exist'
  });
});

// Export the handler for Vercel
module.exports = app;
