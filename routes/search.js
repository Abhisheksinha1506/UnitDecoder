const express = require('express');
const router = express.Router();
const { searchUnits } = require('../utils/search');
// Rate limiting removed - no longer needed

/**
 * Search for units
 * GET /api/search?q=query
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }
    
    const results = searchUnits(query.trim());
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for units'
    });
  }
});

module.exports = router;
