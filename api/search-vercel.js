// Vercel serverless function format
export default async function handler(req, res) {
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
    
    // Simple fallback data for testing
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
    
    // Simple search logic
    const results = fallbackUnits.filter(unit => 
      unit.name.toLowerCase().includes(query.toLowerCase()) ||
      unit.description.toLowerCase().includes(query.toLowerCase()) ||
      unit.category.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(results);
    
  } catch (error) {
    console.error('Search error:', error);
    res.json([]);
  }
}
