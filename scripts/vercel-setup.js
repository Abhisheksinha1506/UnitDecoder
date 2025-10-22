#!/usr/bin/env node

/**
 * Vercel deployment setup script
 * Initializes database and seeds data for serverless deployment
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Vercel-specific database path
const DB_PATH = process.env.DB_PATH || '/tmp/unit_decoder.db';

console.log('🚀 Setting up database for Vercel deployment...');
console.log(`📁 Database path: ${DB_PATH}`);

try {
  // Ensure directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Initialize database
  const db = new Database(DB_PATH);
  
  // Configure SQLite for serverless environment
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000');
  db.pragma('temp_store = MEMORY');
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  
  console.log('✅ Database schema created');
  
  // Check if we need to seed data
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get();
  
  if (unitCount.count === 0) {
    console.log('🌱 Seeding database with initial data...');
    
    // Insert some basic units for demonstration
    const basicUnits = [
      {
        name: 'Meter',
        category: 'Length',
        base_unit: 'meter',
        conversion_factor: 1.0,
        description: 'The base unit of length in the International System of Units (SI)',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Metre',
        status: 'verified'
      },
      {
        name: 'Kilogram',
        category: 'Mass',
        base_unit: 'kilogram',
        conversion_factor: 1.0,
        description: 'The base unit of mass in the International System of Units (SI)',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Kilogram',
        status: 'verified'
      },
      {
        name: 'Tola',
        category: 'Mass',
        base_unit: 'gram',
        conversion_factor: 11.6638038,
        description: 'Traditional unit of mass used in South Asia, particularly in India and Pakistan',
        region: 'South Asia',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Tola_(unit)',
        status: 'verified'
      },
      {
        name: 'Foot',
        category: 'Length',
        base_unit: 'meter',
        conversion_factor: 0.3048,
        description: 'Imperial unit of length equal to 12 inches',
        region: 'United States',
        era: 'Imperial',
        source_url: 'https://en.wikipedia.org/wiki/Foot_(unit)',
        status: 'verified'
      }
    ];
    
    const insertUnit = db.prepare(`
      INSERT INTO units (name, category, base_unit, conversion_factor, description, region, era, source_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const unit of basicUnits) {
      insertUnit.run(
        unit.name,
        unit.category,
        unit.base_unit,
        unit.conversion_factor,
        unit.description,
        unit.region,
        unit.era,
        unit.source_url,
        unit.status
      );
    }
    
    // Add aliases for better search
    const insertAlias = db.prepare(`
      INSERT INTO aliases (unit_id, alias, normalized_alias, phonetic_key)
      VALUES (?, ?, ?, ?)
    `);
    
    const aliases = [
      { unit_id: 1, alias: 'm', normalized_alias: 'm', phonetic_key: 'M' },
      { unit_id: 1, alias: 'metre', normalized_alias: 'metre', phonetic_key: 'MTR' },
      { unit_id: 2, alias: 'kg', normalized_alias: 'kg', phonetic_key: 'KG' },
      { unit_id: 2, alias: 'kilo', normalized_alias: 'kilo', phonetic_key: 'KL' },
      { unit_id: 3, alias: 'tola', normalized_alias: 'tola', phonetic_key: 'TL' },
      { unit_id: 4, alias: 'ft', normalized_alias: 'ft', phonetic_key: 'FT' },
      { unit_id: 4, alias: 'feet', normalized_alias: 'feet', phonetic_key: 'FT' }
    ];
    
    for (const alias of aliases) {
      insertAlias.run(alias.unit_id, alias.alias, alias.normalized_alias, alias.phonetic_key);
    }
    
    console.log('✅ Database seeded with basic units');
  } else {
    console.log(`✅ Database already contains ${unitCount.count} units`);
  }
  
  db.close();
  console.log('🎉 Vercel setup completed successfully!');
  
} catch (error) {
  console.error('❌ Error setting up database:', error.message);
  process.exit(1);
}
