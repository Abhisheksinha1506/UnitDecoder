const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Ensure db directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database with performance settings
const db = new Database(config.dbPath);

try {
  // Configure SQLite for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 2000');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 268435456'); // 256MB memory mapping
  
  // Read and execute schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  
  // Analyze database for optimal query planning
  db.exec('ANALYZE');
  
  console.log('✅ Database initialized successfully');
  console.log(`📁 Database location: ${config.dbPath}`);
  console.log('⚡ Performance optimizations applied');
} catch (error) {
  console.error('❌ Error initializing database:', error.message);
  process.exit(1);
} finally {
  db.close();
}
