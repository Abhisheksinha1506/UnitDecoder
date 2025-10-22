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
    const { submissionId, vote } = req.body;
    
    if (!submissionId || vote === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'submissionId and vote are required'
      });
    }
    
    // For now, just return a success response
    // In a real implementation, this would save the vote to a database
    res.json({
      success: true,
      message: 'Vote recorded',
      submissionId,
      vote
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      error: 'Vote failed',
      message: 'An error occurred while recording the vote'
    });
  }
};
