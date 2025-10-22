const Database = require('better-sqlite3');
const { normalizeString, generatePhoneticKey } = require('../utils/normalize');

// Fallback data for when database is not available
const fallbackUnits = [
  {
    id: 1,
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
    id: 2,
    name: 'Gram',
    category: 'Mass',
    base_unit: 'kilogram',
    conversion_factor: 0.001,
    description: 'A metric unit of mass equal to one thousandth of a kilogram',
    region: 'International',
    era: 'Modern',
    source_url: 'https://en.wikipedia.org/wiki/Gram',
    status: 'verified'
  },
  {
    id: 3,
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
    id: 4,
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

function searchFallbackData(query) {
  const normalizedQuery = normalizeString(query).toLowerCase();
  return fallbackUnits.filter(unit => 
    unit.name.toLowerCase().includes(normalizedQuery) ||
    unit.description.toLowerCase().includes(normalizedQuery) ||
    unit.category.toLowerCase().includes(normalizedQuery)
  );
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const query = req.query.q;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }
    
    // Try to use database first, fallback to static data
    try {
      const dbPath = process.env.DB_PATH || '/tmp/unit_decoder.db';
      const db = new Database(dbPath);
      
      const normalizedQuery = normalizeString(query.trim());
      
      const results = db.prepare(`
        SELECT * FROM units 
        WHERE (name LIKE ? OR description LIKE ?) AND status = 'verified'
        ORDER BY LENGTH(name) ASC
        LIMIT 20
      `).all(`%${normalizedQuery}%`, `%${normalizedQuery}%`);
      
      db.close();
      
      if (results && results.length > 0) {
        return res.json(results);
      }
    } catch (dbError) {
      console.log('Database not available, using fallback data');
    }
    
    // Use fallback data
    const results = searchFallbackData(query.trim());
    res.json(results);
    
  } catch (error) {
    console.error('Search error:', error);
    // Return fallback data even on error
    const results = searchFallbackData(query.trim());
    res.json(results);
  }
};
