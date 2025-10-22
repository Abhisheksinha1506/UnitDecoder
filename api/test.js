module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.json({
    message: 'Test API working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};
