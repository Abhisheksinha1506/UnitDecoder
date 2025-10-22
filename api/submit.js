const express = require('express');
const router = express.Router();

/**
 * Submit a new unit for review
 * POST /api/submit
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, base_unit, conversion_factor, region, era, description, source_url } = req.body;
    
    // Validate required fields
    if (!name || !category || !base_unit || conversion_factor === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, category, base_unit, and conversion_factor are required'
      });
    }
    
    // For Vercel deployment, we'll simulate the submission
    // In a real implementation, this would save to a database
    const submissionId = Math.floor(Math.random() * 10000) + 1;
    
    res.json({
      success: true,
      message: 'Unit submission received and will be reviewed',
      id: submissionId,
      submittedData: {
        name,
        category,
        base_unit,
        conversion_factor,
        region: region || '',
        era: era || '',
        description: description || '',
        source_url: source_url || ''
      }
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({
      error: 'Submission failed',
      message: 'An error occurred while submitting the unit'
    });
  }
});

module.exports = router;
