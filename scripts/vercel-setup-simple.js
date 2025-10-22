#!/usr/bin/env node

/**
 * Simple Vercel deployment setup script
 * Uses the existing local database to seed Vercel
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Vercel-specific database path
const DB_PATH = process.env.DB_PATH || '/tmp/unit_decoder.db';
const LOCAL_DB_PATH = path.join(__dirname, '..', 'db', 'unit_decoder.db');

console.log('🚀 Setting up database for Vercel deployment...');
console.log(`📁 Database path: ${DB_PATH}`);
console.log(`📁 Local database: ${LOCAL_DB_PATH}`);

try {
  // Ensure directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Check if local database exists
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.error('❌ Local database not found. Please run npm run seed first.');
    process.exit(1);
  }

  // Copy the local database to Vercel location
  console.log('📋 Copying local database to Vercel location...');
  fs.copyFileSync(LOCAL_DB_PATH, DB_PATH);

  // Verify the copied database
  const db = new Database(DB_PATH);
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get();
  const aliasCount = db.prepare('SELECT COUNT(*) as count FROM aliases').get();
  
  console.log(`📊 Database copied successfully:`);
  console.log(`   Units: ${unitCount.count}`);
  console.log(`   Aliases: ${aliasCount.count}`);
  
  db.close();
  
  // Ensure public directory exists for Vercel
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    console.log('📁 Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  console.log('🎉 Vercel setup completed successfully!');
  
} catch (error) {
  console.error('❌ Error setting up database:', error.message);
  process.exit(1);
}
