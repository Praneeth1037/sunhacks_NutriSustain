const express = require('express');
const GroceryItem = require('../models/GroceryItem');
const { calculateWastedAmounts } = require('../services/analyticsService');
const router = express.Router();

// Get analytics data
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get all items for the current month
    const monthItems = await GroceryItem.find({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });
    
    // Calculate statistics
    const totalItems = monthItems.length;
    const activeItems = monthItems.filter(item => item.status === 'active').length;
    const consumedItems = monthItems.filter(item => item.status === 'completed').length;
    const expiredItems = monthItems.filter(item => item.status === 'expired').length;
    
    // Calculate waste rate
    const wasteRate = totalItems > 0 ? (expiredItems / totalItems) * 100 : 0;
    const efficiencyRate = 100 - wasteRate;
    
    // Category breakdown
    const categoryStats = {};
    monthItems.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { total: 0, active: 0, consumed: 0, expired: 0 };
      }
      categoryStats[item.category].total++;
      categoryStats[item.category][item.status]++;
    });
    
    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthData = await GroceryItem.find({
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd
        }
      });
      
      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthData.length,
        active: monthData.filter(item => item.status === 'active').length,
        consumed: monthData.filter(item => item.status === 'completed').length,
        expired: monthData.filter(item => item.status === 'expired').length
      });
    }
    
    res.json({
      success: true,
      data: {
        summary: {
          totalItems,
          activeItems,
          consumedItems,
          expiredItems,
          wasteRate: Math.round(wasteRate * 100) / 100,
          efficiencyRate: Math.round(efficiencyRate * 100) / 100
        },
        categoryStats,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Calculate wasted amounts
router.post('/calculate-wasted-amount', async (req, res) => {
  try {
    const { expiredItems } = req.body;
    
    if (!expiredItems || expiredItems.length === 0) {
      return res.json({
        success: true,
        items: []
      });
    }
    
    const wastedAmounts = await calculateWastedAmounts(expiredItems);
    
    res.json({
      success: true,
      items: wastedAmounts
    });
  } catch (error) {
    console.error('Error calculating wasted amounts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate wasted amounts',
      error: error.message 
    });
  }
});

module.exports = router;
