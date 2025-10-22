const Database = require('better-sqlite3');
const config = require('../config');

let db = null;
const preparedStatements = new Map();

function getConnection() {
  if (!db) {
    db = new Database(config.dbPath, {
      // Performance optimizations
      cacheSize: 2000, // Increase cache size
      journalMode: 'WAL', // Write-Ahead Logging for better concurrency
      synchronous: 'NORMAL', // Balance between safety and performance
      tempStore: 'MEMORY', // Store temp tables in memory
      mmapSize: 134217728 // 128MB memory mapping
    });
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Create additional indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_units_category_status ON units(category, status);
      CREATE INDEX IF NOT EXISTS idx_aliases_unit_id_alias ON aliases(unit_id, alias);
      CREATE INDEX IF NOT EXISTS idx_votes_submission_vote ON votes(submission_id, vote);
      CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON submissions(status, created_at);
    `);
  }
  return db;
}

// Optimized unit retrieval with single query
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

// Optimized search with single query using UNION
function findUnitsBySearch(query) {
  const conn = getConnection();
  const normalizedQuery = query.toLowerCase().trim();
  
  const cacheKey = 'searchUnits';
  if (!preparedStatements.has(cacheKey)) {
    const stmt = conn.prepare(`
      WITH search_results AS (
        -- Exact match (highest priority)
        SELECT u.*, 1 as priority
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.normalized_alias = ? AND u.status = 'verified'
        
        UNION ALL
        
        -- Phonetic match (medium priority)
        SELECT u.*, 2 as priority
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.phonetic_key = ? AND u.status = 'verified'
        
        UNION ALL
        
        -- Fuzzy match (lowest priority)
        SELECT u.*, 3 as priority
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

// Batch operations for better performance
function addVerifiedUnitBatch(unitDataArray) {
  const conn = getConnection();
  
  const transaction = conn.transaction((units) => {
    const unitStmt = conn.prepare(`
      INSERT INTO units (name, category, base_unit, conversion_factor, description, region, era, source_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified')
    `);
    
    const aliasStmt = conn.prepare(`
      INSERT INTO aliases (unit_id, alias, normalized_alias, phonetic_key)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const unitData of units) {
      const unitResult = unitStmt.run(
        unitData.name, unitData.category, unitData.base_unit,
        unitData.conversion_factor, unitData.description,
        unitData.region, unitData.era, unitData.source_url
      );
      
      const unitId = unitResult.lastInsertRowid;
      
      if (unitData.aliases && unitData.aliases.length > 0) {
        for (const alias of unitData.aliases) {
          const normalized = alias.toLowerCase().trim();
          const phonetic = require('natural').DoubleMetaphone.process(normalized);
          aliasStmt.run(unitId, alias, normalized, phonetic);
        }
      }
    }
  });
  
  return transaction(unitDataArray);
}

// Optimized pending submissions with single query
function getAllPendingSubmissionsOptimized() {
  const conn = getConnection();
  
  const cacheKey = 'getAllPendingSubmissions';
  if (!preparedStatements.has(cacheKey)) {
    const stmt = conn.prepare(`
      SELECT s.*, 
             COUNT(CASE WHEN v.vote = 'yes' THEN 1 END) as yes_votes,
             COUNT(CASE WHEN v.vote = 'no' THEN 1 END) as no_votes
      FROM submissions s
      LEFT JOIN votes v ON s.id = v.submission_id
      WHERE s.status IN ('pending', 'flagged_for_review')
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `);
    preparedStatements.set(cacheKey, stmt);
  }
  
  const stmt = preparedStatements.get(cacheKey);
  const submissions = stmt.all();
  
  return submissions.map(sub => ({
    ...sub,
    submitted_data: JSON.parse(sub.submitted_data)
  }));
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
  addVerifiedUnitBatch,
  getAllPendingSubmissionsOptimized,
  closeConnection
};
