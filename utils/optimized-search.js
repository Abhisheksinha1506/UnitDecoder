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
  
  // Single optimized query with UNION for all three search layers
  const results = conn.prepare(`
    WITH search_results AS (
      -- Layer 1: Exact Match (Priority 1)
      SELECT DISTINCT u.*, 1 as priority, a.normalized_alias as match_type
      FROM units u 
      JOIN aliases a ON u.id = a.unit_id 
      WHERE a.normalized_alias = ? AND u.status = 'verified'
      
      UNION ALL
      
      -- Layer 2: Phonetic Match (Priority 2)
      SELECT DISTINCT u.*, 2 as priority, 'phonetic' as match_type
      FROM units u 
      JOIN aliases a ON u.id = a.unit_id 
      WHERE a.phonetic_key = ? AND u.status = 'verified'
      
      UNION ALL
      
      -- Layer 3: Fuzzy Match (Priority 3)
      SELECT DISTINCT u.*, 3 as priority, 'fuzzy' as match_type
      FROM units u 
      JOIN aliases a ON u.id = a.unit_id 
      WHERE a.normalized_alias LIKE ? AND u.status = 'verified'
      LIMIT 20
    )
    SELECT DISTINCT * FROM search_results
    ORDER BY priority, LENGTH(name) ASC
    LIMIT 20
  `).all(normalizedQuery, phoneticKey, `%${normalizedQuery}%`);
  
  return results;
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

/**
 * Advanced search with multiple filters
 */
function advancedSearch(options) {
  const {
    query = '',
    category = '',
    region = '',
    era = '',
    limit = 20
  } = options;
  
  const conn = db.getConnection();
  let whereClause = "u.status = 'verified'";
  let params = [];
  
  // Build dynamic WHERE clause
  if (query && query.trim()) {
    const normalizedQuery = normalizeString(query);
    const phoneticKey = generatePhoneticKey(query);
    
    whereClause += ` AND (a.normalized_alias = ? OR a.phonetic_key = ? OR a.normalized_alias LIKE ?)`;
    params.push(normalizedQuery, phoneticKey, `%${normalizedQuery}%`);
  }
  
  if (category) {
    whereClause += ` AND u.category = ?`;
    params.push(category);
  }
  
  if (region) {
    whereClause += ` AND u.region = ?`;
    params.push(region);
  }
  
  if (era) {
    whereClause += ` AND u.era = ?`;
    params.push(era);
  }
  
  const results = conn.prepare(`
    SELECT DISTINCT u.* FROM units u 
    JOIN aliases a ON u.id = a.unit_id 
    WHERE ${whereClause}
    ORDER BY u.name ASC
    LIMIT ?
  `).all(...params, limit);
  
  return results;
}

/**
 * Search suggestions for autocomplete
 */
function getSearchSuggestions(query, limit = 10) {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const normalizedQuery = normalizeString(query);
  const conn = db.getConnection();
  
  const suggestions = conn.prepare(`
    SELECT DISTINCT a.alias, u.name, u.category
    FROM aliases a
    JOIN units u ON a.unit_id = u.id
    WHERE a.normalized_alias LIKE ? AND u.status = 'verified'
    ORDER BY 
      CASE WHEN a.normalized_alias = ? THEN 1 ELSE 2 END,
      LENGTH(a.alias) ASC
    LIMIT ?
  `).all(`%${normalizedQuery}%`, normalizedQuery, limit);
  
  return suggestions;
}

/**
 * Popular searches tracking
 */
function trackSearch(query) {
  if (!query || query.trim().length < 2) {
    return;
  }
  
  // This would typically be stored in a separate analytics table
  // For now, we'll just log it
  console.log(`Search tracked: ${query}`);
}

/**
 * Get unit with optimized aliases loading
 */
function getUnitWithAliases(unitId) {
  const conn = db.getConnection();
  
  const result = conn.prepare(`
    SELECT u.*, 
           GROUP_CONCAT(a.alias, '|') as aliases,
           GROUP_CONCAT(a.normalized_alias, '|') as normalized_aliases
    FROM units u
    LEFT JOIN aliases a ON u.id = a.unit_id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(unitId);
  
  if (!result) return null;
  
  return {
    ...result,
    aliases: result.aliases ? result.aliases.split('|') : [],
    normalized_aliases: result.normalized_aliases ? result.normalized_aliases.split('|') : []
  };
}

/**
 * Batch search for multiple queries
 */
function batchSearch(queries) {
  if (!Array.isArray(queries) || queries.length === 0) {
    return [];
  }
  
  const conn = db.getConnection();
  const results = [];
  
  // Process queries in parallel using Promise.all
  const searchPromises = queries.map(async (query) => {
    const normalizedQuery = normalizeString(query);
    const phoneticKey = generatePhoneticKey(query);
    
    return conn.prepare(`
      SELECT DISTINCT u.*, ? as search_query
      FROM units u 
      JOIN aliases a ON u.id = a.unit_id 
      WHERE (a.normalized_alias = ? OR a.phonetic_key = ? OR a.normalized_alias LIKE ?)
      AND u.status = 'verified'
      ORDER BY 
        CASE WHEN a.normalized_alias = ? THEN 1 ELSE 2 END
      LIMIT 5
    `).all(query, normalizedQuery, phoneticKey, `%${normalizedQuery}%`, normalizedQuery);
  });
  
  return Promise.all(searchPromises);
}

module.exports = {
  searchUnits,
  searchUnitsByCategory,
  advancedSearch,
  getSearchSuggestions,
  trackSearch,
  getUnitWithAliases,
  batchSearch
};
