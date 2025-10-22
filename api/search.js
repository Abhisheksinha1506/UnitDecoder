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
    const db = new Database(dbPath);
    
    const normalizedQuery = normalizeString(query.trim());
    const phoneticKey = generatePhoneticKey(query.trim());
    
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
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for units'
    });
  }
};
