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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromUnitId, toUnitId, value } = req.body;
    
    // Validate input
    if (!fromUnitId || !toUnitId || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fromUnitId, toUnitId, and value are required'
      });
    }
    
    const fromId = parseInt(fromUnitId);
    const toId = parseInt(toUnitId);
    const numValue = parseFloat(value);
    
    if (isNaN(fromId) || isNaN(toId) || isNaN(numValue)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'fromUnitId, toUnitId must be numbers and value must be a valid number'
      });
    }
    
    // Initialize database connection for serverless environment
    const dbPath = process.env.DB_PATH || '/tmp/unit_decoder.db';
    const db = new Database(dbPath);
    
    // Get both units
    const fromUnit = db.prepare('SELECT * FROM units WHERE id = ? AND status = ?').get(fromId, 'verified');
    const toUnit = db.prepare('SELECT * FROM units WHERE id = ? AND status = ?').get(toId, 'verified');
    
    db.close();
    
    if (!fromUnit) {
      return res.status(404).json({
        error: 'Source unit not found',
        message: 'No unit found with the specified fromUnitId'
      });
    }
    
    if (!toUnit) {
      return res.status(404).json({
        error: 'Target unit not found',
        message: 'No unit found with the specified toUnitId'
      });
    }
    
    // Check if units are in the same category
    if (fromUnit.category !== toUnit.category) {
      return res.status(400).json({
        error: 'Incompatible units',
        message: `Cannot convert between ${fromUnit.category} and ${toUnit.category} units`
      });
    }
    
    // Perform conversion
    // Step 1: Convert from source unit to base unit
    const baseValue = numValue * fromUnit.conversion_factor;
    
    // Step 2: Convert from base unit to target unit
    const result = baseValue / toUnit.conversion_factor;
    
    // Create formula explanation
    const formula = `${numValue} ${fromUnit.name} × ${fromUnit.conversion_factor} ÷ ${toUnit.conversion_factor} = ${result.toFixed(6)} ${toUnit.name}`;
    
    res.json({
      result: parseFloat(result.toFixed(6)),
      formula,
      fromUnit: {
        id: fromUnit.id,
        name: fromUnit.name,
        category: fromUnit.category,
        conversion_factor: fromUnit.conversion_factor
      },
      toUnit: {
        id: toUnit.id,
        name: toUnit.name,
        category: toUnit.category,
        conversion_factor: toUnit.conversion_factor
      },
      inputValue: numValue
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: 'An error occurred while performing the conversion'
    });
  }
};
