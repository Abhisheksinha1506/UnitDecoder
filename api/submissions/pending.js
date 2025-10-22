const express = require('express');
const router = express.Router();

/**
 * Get pending submissions
 * GET /api/submissions/pending
 */
router.get('/', async (req, res) => {
  try {
    // For Vercel deployment, we'll return mock pending submissions
    // In a real implementation, this would query the database
    const mockSubmissions = [
      {
        id: 1,
        submitted_data: JSON.stringify({
          name: 'Shaku',
          category: 'Length',
          base_unit: 'Meter',
          conversion_factor: 0.303,
          region: 'Japan',
          era: 'Traditional',
          description: 'Traditional Japanese unit of length',
          source_url: 'https://en.wikipedia.org/wiki/Shaku_(unit)'
        }),
        yes_votes: 3,
        no_votes: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        submitted_data: JSON.stringify({
          name: 'Candela',
          category: 'Luminous Intensity',
          base_unit: 'Candela',
          conversion_factor: 1.0,
          region: 'International',
          era: 'Modern',
          description: 'Base unit of luminous intensity in the SI system',
          source_url: 'https://en.wikipedia.org/wiki/Candela'
        }),
        yes_votes: 5,
        no_votes: 0,
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(mockSubmissions);
  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({
      error: 'Failed to get pending submissions',
      message: 'An error occurred while retrieving pending submissions'
    });
  }
});

module.exports = router;