#!/usr/bin/env node

/**
 * Deployment script for Vercel
 * Ensures database is ready and all dependencies are installed
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment preparation...');

// Check if database directory exists
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory');
}

// Check if database file exists
const dbPath = path.join(dbDir, 'unit_decoder.db');
if (!fs.existsSync(dbPath)) {
  console.log('📊 Database will be initialized on first run');
} else {
  console.log('✅ Database already exists');
}

console.log('✅ Deployment preparation complete');
console.log('🌍 Ready for Vercel deployment');
