const express = require('express');
const router = express.Router();

/**
 * Vote on a unit submission
 * POST /api/vote
 */
router.post('/', async (req, res) => {
  try {
    const { submissionId, vote } = req.body;
    
    if (!submissionId || vote === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'submissionId and vote are required'
      });
    }
    
    // For Vercel deployment, we'll simulate the voting
    // In a real implementation, this would save to a database
    res.json({
      success: true,
      message: 'Vote recorded',
      submissionId,
      vote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      error: 'Vote failed',
      message: 'An error occurred while recording the vote'
    });
  }
});

module.exports = router;
