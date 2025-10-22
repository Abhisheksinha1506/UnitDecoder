const Database = require('better-sqlite3');

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
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        error: 'Missing unit ID',
        message: 'Unit ID is required'
      });
    }
    
    // Initialize database connection for serverless environment
    const dbPath = process.env.DB_PATH || '/tmp/unit_decoder.db';
    
    let db;
    try {
      db = new Database(dbPath);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({
        error: 'Database unavailable',
        message: 'Database is not accessible'
      });
    }
    
    const unit = db.prepare('SELECT * FROM units WHERE id = ? AND status = ?').get(parseInt(id), 'verified');
    
    db.close();
    
    if (!unit) {
      return res.status(404).json({
        error: 'Unit not found',
        message: 'No unit found with the specified ID'
      });
    }
    
    res.json(unit);
  } catch (error) {
    console.error('Unit details error:', error);
    res.status(500).json({
      error: 'Failed to fetch unit',
      message: 'An error occurred while fetching unit details'
    });
  }
};
