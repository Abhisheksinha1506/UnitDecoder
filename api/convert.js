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
    base_unit: 'kilogram',
    conversion_factor: 0.0116638038,
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
  },
  {
    id: 5,
    name: 'Meter',
    category: 'Length',
    base_unit: 'meter',
    conversion_factor: 1.0,
    description: 'The base unit of length in the International System of Units (SI)',
    region: 'International',
    era: 'Modern',
    source_url: 'https://en.wikipedia.org/wiki/Metre',
    status: 'verified'
  },
  {
    id: 6,
    name: 'Inch',
    category: 'Length',
    base_unit: 'meter',
    conversion_factor: 0.0254,
    description: 'Imperial unit of length equal to 1/12 of a foot',
    region: 'United States',
    era: 'Imperial',
    source_url: 'https://en.wikipedia.org/wiki/Inch',
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromUnitId, toUnitId, value } = req.body;
    
    // Debug logging
    console.log('Convert API received:', { fromUnitId, toUnitId, value });
    
    // Validate input
    if (!fromUnitId || !toUnitId || value === undefined) {
      console.log('Missing required fields:', { fromUnitId, toUnitId, value });
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
    
    // Try to use database first, fallback to static data
    let fromUnit, toUnit;
    
    try {
      const dbPath = process.env.DB_PATH || '/tmp/unit_decoder.db';
      const db = new Database(dbPath);
      
      fromUnit = db.prepare('SELECT * FROM units WHERE id = ? AND status = ?').get(fromId, 'verified');
      toUnit = db.prepare('SELECT * FROM units WHERE id = ? AND status = ?').get(toId, 'verified');
      
      db.close();
    } catch (dbError) {
      console.log('Database not available, using fallback data');
    }
    
    // Use fallback data if database units not found
    if (!fromUnit) {
      fromUnit = fallbackUnits.find(u => u.id === fromId);
    }
    if (!toUnit) {
      toUnit = fallbackUnits.find(u => u.id === toId);
    }
    
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
    
    // Check if units have the same base unit
    if (fromUnit.base_unit !== toUnit.base_unit) {
      return res.status(400).json({
        error: 'Incompatible base units',
        message: `Cannot convert between units with different base units: ${fromUnit.base_unit} and ${toUnit.base_unit}`
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
