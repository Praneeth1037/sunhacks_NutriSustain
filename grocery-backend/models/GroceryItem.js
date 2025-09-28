const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true,
    enum: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 'Beverages', 'Snacks', 'Frozen', 'Pantry', 'Other']
  },
  purchaseDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  completedDate: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
groceryItemSchema.index({ expiryDate: 1 });
groceryItemSchema.index({ status: 1 });
groceryItemSchema.index({ category: 1 });

module.exports = mongoose.model('GroceryItem', groceryItemSchema);
