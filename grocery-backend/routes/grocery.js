const express = require('express');
const GroceryItem = require('../models/GroceryItem');
const router = express.Router();

// Get all grocery items
router.get('/', async (req, res) => {
  try {
    console.log('GET /groceryItems - Fetching all items...');
    
    // Get all items first
    const allItems = await GroceryItem.find().sort({ createdAt: -1 });
    console.log(`Found ${allItems.length} items in database`);
    
    // Check and update status for each item based on expiry date
    const today = new Date();
    let updatedCount = 0;
    
    for (const item of allItems) {
      if (item.status === 'completed') continue; // Skip completed items
      
      const expiryDate = new Date(item.expiryDate);
      const isExpired = (expiryDate - today) < 0;
      
      // Update status based on expiry logic
      if (isExpired && item.status !== 'expired') {
        await GroceryItem.findByIdAndUpdate(item._id, { $set: { status: 'expired' } });
        updatedCount++;
        console.log(`Updated item "${item.productName}" from ${item.status} to expired`);
      } else if (!isExpired && item.status === 'expired') {
        await GroceryItem.findByIdAndUpdate(item._id, { $set: { status: 'active' } });
        updatedCount++;
        console.log(`Updated item "${item.productName}" from expired to active`);
      }
    }
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} items based on expiry date logic`);
    }
    
    // Return updated items
    const updatedItems = await GroceryItem.find().sort({ createdAt: -1 });
    console.log(`Returning ${updatedItems.length} items to frontend`);
    
    res.json(updatedItems);
  } catch (error) {
    console.error('Error fetching grocery items:', error);
    res.status(500).json({ error: 'Failed to fetch grocery items' });
  }
});

// Get expiring items (within 3 days)
router.get('/expiring', async (req, res) => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const expiringItems = await GroceryItem.find({
      status: 'active',
      expiryDate: {
        $gte: today.toISOString().split('T')[0],
        $lte: threeDaysFromNow.toISOString().split('T')[0]
      }
    }).sort({ expiryDate: 1 });
    
    res.json(expiringItems);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

// Create new grocery item
router.post('/', async (req, res) => {
  try {
    const { productName, expiryDate, quantity, category, purchaseDate } = req.body;
    
    // Check if item is already expired
    const today = new Date();
    const itemExpiryDate = new Date(expiryDate);
    const isExpired = (itemExpiryDate - today) < 0;
    
    const initialStatus = isExpired ? 'expired' : 'active';
    
    if (isExpired) {
      console.log(`New item "${productName}" is already expired, setting status to 'expired'`);
    }
    
    const newItem = new GroceryItem({
      productName,
      expiryDate,
      quantity,
      category,
      purchaseDate,
      status: initialStatus,
      completedDate: null,
      imageUrl: null
    });
    
    console.log('Creating new item:', newItem);
    
    const savedItem = await newItem.save();
    console.log('Item saved successfully:', savedItem);
    
    // Send WebSocket notification
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'item_added',
            item: savedItem
          }));
        }
      });
    }
    
    console.log('Sending response:', savedItem);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating grocery item:', error);
    res.status(500).json({ error: 'Failed to create grocery item' });
  }
});

// Update grocery item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, expiryDate, quantity, category, purchaseDate, status } = req.body;
    
    // Check if item is expired based on expiry date
    const today = new Date();
    const itemExpiryDate = new Date(expiryDate);
    const isExpired = (itemExpiryDate - today) < 0;
    
    // Determine final status
    let finalStatus = status;
    if (isExpired && status !== 'completed') {
      finalStatus = 'expired';
    }
    
    const updatedItem = await GroceryItem.findByIdAndUpdate(
      id,
      {
        productName,
        expiryDate,
        quantity,
        category,
        purchaseDate,
        status: finalStatus,
        completedDate: finalStatus === 'completed' ? new Date() : null
      },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Grocery item not found' });
    }
    
    // Send WebSocket notification
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'item_updated',
            item: updatedItem
          }));
        }
      });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(500).json({ error: 'Failed to update grocery item' });
  }
});

// Delete grocery item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await GroceryItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Grocery item not found' });
    }
    
    // Send WebSocket notification
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'item_deleted',
            itemId: id
          }));
        }
      });
    }
    
    res.json({ message: 'Grocery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    res.status(500).json({ error: 'Failed to delete grocery item' });
  }
});

module.exports = router;
