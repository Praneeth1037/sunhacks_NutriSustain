const GroceryItem = require('../models/GroceryItem');

// Check and update expired items
async function checkExpiringItems() {
  try {
    console.log('Running expiry check...');
    
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    // Find items expiring within 3 days
    const expiringItems = await GroceryItem.find({
      status: 'active',
      expiryDate: {
        $gte: today.toISOString().split('T')[0],
        $lte: threeDaysFromNow.toISOString().split('T')[0]
      }
    });
    
    // Find items that are now expired
    const expiredItems = await GroceryItem.find({
      status: 'active',
      expiryDate: {
        $lt: today.toISOString().split('T')[0]
      }
    });
    
    // Update expired items
    if (expiredItems.length > 0) {
      await GroceryItem.updateMany(
        { _id: { $in: expiredItems.map(item => item._id) } },
        { $set: { status: 'expired' } }
      );
      console.log(`Updated ${expiredItems.length} items to expired status`);
    }
    
    // Send WebSocket notifications for expiring items
    if (global.wss && expiringItems.length > 0) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'expiry_alert',
            items: expiringItems,
            message: `${expiringItems.length} items are expiring soon!`
          }));
        }
      });
    }
    
    console.log(`Found ${expiringItems.length} items expiring within 3 days`);
    console.log(`Updated ${expiredItems.length} items to expired status`);
    
  } catch (error) {
    console.error('Error checking expiring items:', error);
  }
}

// Get items expiring within specified days
async function getExpiringItems(days = 5) {
  try {
    const today = new Date();
    const targetDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const expiringItems = await GroceryItem.find({
      status: 'active',
      expiryDate: {
        $gte: today.toISOString().split('T')[0],
        $lte: targetDate.toISOString().split('T')[0]
      }
    }).sort({ expiryDate: 1 });
    
    return expiringItems;
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    return [];
  }
}

// Calculate days until expiry
function calculateDaysUntilExpiry(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Check if item is expired
function isItemExpired(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return expiry < today;
}

// Get expiry status
function getExpiryStatus(expiryDate) {
  const daysLeft = calculateDaysUntilExpiry(expiryDate);
  
  if (daysLeft < 0) {
    return { status: 'expired', daysLeft: 0, urgency: 'expired' };
  } else if (daysLeft <= 1) {
    return { status: 'urgent', daysLeft, urgency: 'high' };
  } else if (daysLeft <= 3) {
    return { status: 'warning', daysLeft, urgency: 'medium' };
  } else if (daysLeft <= 7) {
    return { status: 'notice', daysLeft, urgency: 'low' };
  } else {
    return { status: 'fresh', daysLeft, urgency: 'none' };
  }
}

module.exports = {
  checkExpiringItems,
  getExpiringItems,
  calculateDaysUntilExpiry,
  isItemExpired,
  getExpiryStatus
};
