const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * Get unit by ID
 * GET /api/units/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const unitId = parseInt(req.params.id);
    
    if (isNaN(unitId)) {
      return res.status(400).json({
        error: 'Invalid unit ID',
        message: 'Unit ID must be a number'
      });
    }
    
    const unit = db.findUnitById(unitId);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Unit not found',
        message: 'No unit found with the specified ID'
      });
    }
    
    res.json(unit);
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({
      error: 'Failed to get unit',
      message: 'An error occurred while retrieving the unit'
    });
  }
});

/**
 * Get units by category
 * GET /api/units/category/:category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const units = db.getUnitsByCategory(category);
    
    res.json(units);
  } catch (error) {
    console.error('Get units by category error:', error);
    res.status(500).json({
      error: 'Failed to get units',
      message: 'An error occurred while retrieving units by category'
    });
  }
});

module.exports = router;
