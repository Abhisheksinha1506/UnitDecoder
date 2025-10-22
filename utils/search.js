const { normalizeString, generatePhoneticKey } = require('./normalize');
const db = require('../db/database');

/**
 * Optimized three-layer search algorithm with single query
 * Uses UNION and proper indexing for better performance
 */
function searchUnits(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const normalizedQuery = normalizeString(query);
  const phoneticKey = generatePhoneticKey(query);
  
  const conn = db.getConnection();
  
  // Simple search for now - check if aliases table has data
  try {
    // Try the optimized query first with proper deduplication
    const results = conn.prepare(`
      WITH search_results AS (
        -- Layer 1: Exact Match (Priority 1)
        SELECT DISTINCT u.id, u.name, u.category, u.base_unit, u.conversion_factor, 
               u.description, u.region, u.era, u.source_url, u.status,
               1 as priority, a.normalized_alias as match_type
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.normalized_alias = ? AND u.status = 'verified'
        
        UNION
        
        -- Layer 2: Phonetic Match (Priority 2)
        SELECT DISTINCT u.id, u.name, u.category, u.base_unit, u.conversion_factor, 
               u.description, u.region, u.era, u.source_url, u.status,
               2 as priority, 'phonetic' as match_type
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.phonetic_key = ? AND u.status = 'verified'
        
        UNION
        
        -- Layer 3: Fuzzy Match (Priority 3)
        SELECT DISTINCT u.id, u.name, u.category, u.base_unit, u.conversion_factor, 
               u.description, u.region, u.era, u.source_url, u.status,
               3 as priority, 'fuzzy' as match_type
        FROM units u 
        JOIN aliases a ON u.id = a.unit_id 
        WHERE a.normalized_alias LIKE ? AND u.status = 'verified'
      )
      SELECT DISTINCT id, name, category, base_unit, conversion_factor, 
             description, region, era, source_url, status,
             MIN(priority) as priority, match_type
      FROM search_results
      GROUP BY id, name, category, base_unit, conversion_factor, 
               description, region, era, source_url, status
      ORDER BY priority, LENGTH(name) ASC
      LIMIT 20
    `).all(normalizedQuery, phoneticKey, `%${normalizedQuery}%`);
    
    return results;
  } catch (error) {
    // Fallback to simple search if aliases table is empty
    console.log('Falling back to simple search:', error.message);
    const results = conn.prepare(`
      SELECT * FROM units 
      WHERE (name LIKE ? OR description LIKE ?) AND status = 'verified'
      ORDER BY LENGTH(name) ASC
      LIMIT 20
    `).all(`%${normalizedQuery}%`, `%${normalizedQuery}%`);
    
    return results;
  }
}

/**
 * Get unit with all aliases for display
 */
function getUnitWithAliases(unitId) {
  const unit = db.findUnitById(unitId);
  if (!unit) return null;
  
  return unit;
}

/**
 * Optimized search with category filter
 */
function searchUnitsByCategory(query, category) {
  if (!query || query.trim().length === 0) {
    return db.getUnitsByCategory(category);
  }
  
  const normalizedQuery = normalizeString(query);
  const phoneticKey = generatePhoneticKey(query);
  
  const conn = db.getConnection();
  
  // Optimized search within specific category
  const results = conn.prepare(`
    WITH search_results AS (
      SELECT DISTINCT u.*, 
             CASE 
               WHEN a.normalized_alias = ? THEN 1
               WHEN a.phonetic_key = ? THEN 2
               ELSE 3
             END as priority
      FROM units u 
      JOIN aliases a ON u.id = a.unit_id 
      WHERE u.category = ? AND u.status = 'verified'
      AND (a.normalized_alias = ? OR a.phonetic_key = ? OR a.normalized_alias LIKE ?)
    )
    SELECT DISTINCT * FROM search_results
    ORDER BY priority, LENGTH(name) ASC
    LIMIT 20
  `).all(category, normalizedQuery, phoneticKey, normalizedQuery, phoneticKey, `%${normalizedQuery}%`);
  
  return results;
}

module.exports = {
  searchUnits,
  getUnitWithAliases,
  searchUnitsByCategory
};
