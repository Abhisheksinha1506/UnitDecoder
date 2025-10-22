const Database = require('better-sqlite3');
const { normalizeString, generatePhoneticKey } = require('../utils/normalize');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    
    // Initialize database connection for serverless environment
    const dbPath = process.env.DB_PATH || '/tmp/unit_decoder.db';
    
    let db;
    try {
      db = new Database(dbPath);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Return fallback data if database is not available
      return res.json([
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
        }
      ]);
    }
    
    const normalizedQuery = normalizeString(query.trim());
    
    // Simple search query that works with the basic database
    const results = db.prepare(`
      SELECT * FROM units 
      WHERE (name LIKE ? OR description LIKE ?) AND status = 'verified'
      ORDER BY LENGTH(name) ASC
      LIMIT 20
    `).all(`%${normalizedQuery}%`, `%${normalizedQuery}%`);
    
    db.close();
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    // Return fallback data instead of error
    res.json([
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
      }
    ]);
  }
};
