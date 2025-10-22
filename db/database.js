const Database = require('better-sqlite3');
const config = require('../config');

let db = null;
const preparedStatements = new Map();

function getConnection() {
  if (!db) {
    const dbConfig = config.database?.enableOptimizations ? {
      cacheSize: config.database.cacheSize || 2000,
      journalMode: config.database.journalMode || 'WAL',
      synchronous: config.database.synchronous || 'NORMAL',
      tempStore: config.database.tempStore || 'MEMORY',
      mmapSize: config.database.mmapSize || 134217728
    } : {};
    
    db = new Database(config.dbPath, dbConfig);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Create additional indexes for performance
    if (config.database?.enableOptimizations) {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_units_category_status ON units(category, status);
        CREATE INDEX IF NOT EXISTS idx_aliases_unit_id_alias ON aliases(unit_id, alias);
      `);
    }
  }
  return db;
}

// Unit operations - Optimized with single query
function findUnitById(id) {
  const conn = getConnection();
  
  // Use prepared statement caching
  const cacheKey = 'findUnitById';
  if (!preparedStatements.has(cacheKey)) {
    const stmt = conn.prepare(`
      SELECT u.*, 
             GROUP_CONCAT(a.alias, '|') as aliases
      FROM units u
      LEFT JOIN aliases a ON u.id = a.unit_id
      WHERE u.id = ?
      GROUP BY u.id
    `);
    preparedStatements.set(cacheKey, stmt);
  }
  
  const stmt = preparedStatements.get(cacheKey);
  const result = stmt.get(id);
  
  if (!result) return null;
  
  return {
    ...result,
    aliases: result.aliases ? result.aliases.split('|') : []
  };
}

function findUnitsBySearch(query) {
  const conn = getConnection();
  const normalizedQuery = query.toLowerCase().trim();
  
  const cacheKey = 'searchUnits';
  if (!preparedStatements.has(cacheKey)) {
    const stmt = conn.prepare(`
      WITH search_results AS (
        -- Exact match (highest priority)
        SELECT DISTINCT u.*, 1 as priority
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.normalized_alias = ? AND u.status = 'verified'
        
        UNION ALL
        
        -- Phonetic match (medium priority)
        SELECT DISTINCT u.*, 2 as priority
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.phonetic_key = ? AND u.status = 'verified'
        
        UNION ALL
        
        -- Fuzzy match (lowest priority)
        SELECT DISTINCT u.*, 3 as priority
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.normalized_alias LIKE ? AND u.status = 'verified'
        LIMIT 20
      )
      SELECT DISTINCT * FROM search_results
      ORDER BY priority, name
      LIMIT 20
    `);
    preparedStatements.set(cacheKey, stmt);
  }
  
  const stmt = preparedStatements.get(cacheKey);
  return stmt.all(normalizedQuery, normalizedQuery, `%${normalizedQuery}%`);
}

function getUnitsByCategory(category) {
  const conn = getConnection();
  return conn.prepare(`
    SELECT * FROM units WHERE category = ? AND status = 'verified'
  `).all(category);
}


// Verification operations
function addVerifiedUnit(unitData) {
  const conn = getConnection();
  
  // Insert into units table
  const unitStmt = conn.prepare(`
    INSERT INTO units (name, category, base_unit, conversion_factor, description, region, era, source_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified')
  `);
  
  const unitResult = unitStmt.run(
    unitData.name,
    unitData.category,
    unitData.base_unit,
    unitData.conversion_factor,
    unitData.description,
    unitData.region,
    unitData.era,
    unitData.source_url
  );
  
  const unitId = unitResult.lastInsertRowid;
  
  // Insert aliases
  if (unitData.aliases && unitData.aliases.length > 0) {
    const aliasStmt = conn.prepare(`
      INSERT INTO aliases (unit_id, alias, normalized_alias, phonetic_key)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const alias of unitData.aliases) {
      const normalized = alias.toLowerCase().trim();
      const phonetic = require('natural').DoubleMetaphone.process(normalized);
      aliasStmt.run(unitId, alias, normalized, phonetic);
    }
  }
  
  return unitId;
}


// Connection cleanup
function closeConnection() {
  if (db) {
    preparedStatements.clear();
    db.close();
    db = null;
  }
}

// Graceful shutdown
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
  getConnection,
  findUnitById,
  findUnitsBySearch,
  getUnitsByCategory,
  addVerifiedUnit,
  closeConnection
};
