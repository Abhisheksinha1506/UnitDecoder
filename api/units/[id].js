const Database = require('better-sqlite3');

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
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        error: 'Missing unit ID',
        message: 'Unit ID is required'
      });
    }
    
    // Try to use database first, fallback to static data
    try {
      const dbPath = process.env.DB_PATH || '/tmp/unit_decoder.db';
      const db = new Database(dbPath);
      
      const unit = db.prepare('SELECT * FROM units WHERE id = ? AND status = ?').get(parseInt(id), 'verified');
      
      db.close();
      
      if (unit) {
        return res.json(unit);
      }
    } catch (dbError) {
      console.log('Database not available, using fallback data');
    }
    
    // Use fallback data
    const unit = fallbackUnits.find(u => u.id === parseInt(id));
    
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
