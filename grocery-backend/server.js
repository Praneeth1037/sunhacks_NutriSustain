require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const connectDB = require('./config/database');
const GroceryItem = require('./models/GroceryItem');
const SugarHealth = require('./models/SugarHealth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Spoonacular API removed - using Azure OpenAI only

// Azure OpenAI configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

// Initialize Azure OpenAI client
let azureOpenAI = null;
if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY) {
  azureOpenAI = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}`,
    defaultQuery: { 'api-version': AZURE_OPENAI_API_VERSION },
    defaultHeaders: {
      'api-key': AZURE_OPENAI_API_KEY,
    },
  });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/sugar-reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `sugar-report-${Date.now()}-${file.originalname}`);
  }
});

// Multer configuration for PDF uploads
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Multer configuration for image uploads (camera scans)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/grocery-scans';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `grocery-scan-${Date.now()}-${file.originalname}`);
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Broadcast function to send notifications to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Function to check for expiring items
async function checkExpiringItems() {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const expiringItems = await GroceryItem.find({
      status: { $ne: 'completed' },
      expiryDate: {
        $gte: today.toISOString().split('T')[0],
        $lte: threeDaysFromNow.toISOString().split('T')[0]
      }
    });

    if (expiringItems.length > 0) {
      console.log(`Found ${expiringItems.length} items expiring within 3 days`);
      broadcast({
        type: 'expiring_items',
        items: expiringItems,
        message: `${expiringItems.length} items are expiring within 3 days!`
      });
    }

    return expiringItems;
  } catch (error) {
    console.error('Error checking expiring items:', error);
    return [];
  }
}

// Schedule daily check at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running daily expiry check...');
  checkExpiringItems();
});

// API Routes

// Get all grocery items
app.get('/groceryItems', async (req, res) => {
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
    
    // Check if wheat is in the response
    const wheatItem = updatedItems.find(item => item.productName.toLowerCase().includes('wheat'));
    if (wheatItem) {
      console.log('Wheat item found in response:', wheatItem);
    } else {
      console.log('Wheat item NOT found in response');
    }
    
    res.json(updatedItems);
  } catch (error) {
    console.error('Error fetching grocery items:', error);
    res.status(500).json({ error: 'Failed to fetch grocery items' });
  }
});

// Get expiring items (within 3 days)
app.get('/groceryItems/expiring', async (req, res) => {
  try {
    const expiringItems = await checkExpiringItems();
    res.json(expiringItems);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

// Create new grocery item
app.post('/groceryItems', async (req, res) => {
  try {
    console.log('POST /groceryItems - Request body:', req.body);
    
    const today = new Date();
    const expiryDate = new Date(req.body.expiryDate);
    
    console.log('Today:', today.toDateString());
    console.log('Expiry Date:', expiryDate.toDateString());
    
    // Determine initial status based on expiry date
    // If (expiryDate - today) < 0, then item is expired
    let initialStatus = 'active';
    if ((expiryDate - today) < 0) {
      initialStatus = 'expired';
      console.log(`New item "${req.body.productName}" is already expired, setting status to 'expired'`);
    }
    
    const newItem = new GroceryItem({
      ...req.body,
      status: initialStatus
    });
    
    console.log('Creating new item:', newItem);
    const savedItem = await newItem.save();
    console.log('Item saved successfully:', savedItem);
    
    // Check if the new item is expiring soon (only for active items)
    if (initialStatus === 'active') {
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      if (expiryDate <= threeDaysFromNow && expiryDate >= today) {
        broadcast({
          type: 'new_expiring_item',
          item: savedItem,
          message: `New item "${savedItem.productName}" is expiring soon!`
        });
      }
    }
    
    console.log('Sending response:', savedItem);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating grocery item:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create grocery item' });
  }
});

// Update grocery item
app.put('/groceryItems/:id', async (req, res) => {
  try {
    const today = new Date();
    const expiryDate = new Date(req.body.expiryDate);
    
    // Determine status based on expiry date
    // If (expiryDate - today) < 0, then item is expired
    let status = req.body.status;
    if ((expiryDate - today) < 0 && req.body.status !== 'completed') {
      status = 'expired';
      console.log(`Updated item "${req.body.productName}" is expired, setting status to 'expired'`);
    }
    
    const updatedItem = await GroceryItem.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status },
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(500).json({ error: 'Failed to update grocery item' });
  }
});

// Delete grocery item
app.delete('/groceryItems/:id', async (req, res) => {
  try {
    const deletedItem = await GroceryItem.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    res.status(500).json({ error: 'Failed to delete grocery item' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const itemCount = await GroceryItem.countDocuments();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      items: itemCount,
      connectedClients: clients.size
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Manual trigger for testing
app.post('/trigger-expiry-check', async (req, res) => {
  try {
    const expiringItems = await checkExpiringItems();
    res.json({ 
      message: 'Expiry check triggered',
      expiringItems: expiringItems.length
    });
  } catch (error) {
    console.error('Error triggering expiry check:', error);
    res.status(500).json({ error: 'Failed to trigger expiry check' });
  }
});

// Spoonacular API removed - using Azure OpenAI only

// Analytics functions
async function calculateGroceryAnalytics(month) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  
  // Filter items for the target month
  const monthlyItems = await GroceryItem.find({
    purchaseDate: { $regex: `^${targetMonth}` }
  });

  // Calculate item statistics
  const itemStats = {};
  monthlyItems.forEach(item => {
    if (!itemStats[item.productName]) {
      itemStats[item.productName] = {
        name: item.productName,
        category: item.category,
        purchased: 0,
        consumed: 0,
        expired: 0,
        totalQuantity: 0
      };
    }
    
    itemStats[item.productName].purchased += item.quantity;
    itemStats[item.productName].totalQuantity += item.quantity;
    
    if (item.status === 'completed') {
      itemStats[item.productName].consumed += item.quantity;
    } else if (item.status === 'expired') {
      itemStats[item.productName].expired += item.quantity;
    }
  });

  // Categorize items
  const categorizedItems = {
    'Very Important': [],
    'Less Important': [],
    'Waste': []
  };

  Object.values(itemStats).forEach(item => {
    const consumptionRate = item.purchased > 0 ? (item.consumed / item.purchased) * 100 : 0;
    const wasteRate = item.purchased > 0 ? (item.expired / item.purchased) * 100 : 0;
    
    if (consumptionRate >= 80 && wasteRate <= 10) {
      categorizedItems['Very Important'].push({
        ...item,
        status: 'Very Important',
        consumptionRate,
        wasteRate
      });
    } else if (consumptionRate >= 50 && wasteRate <= 30) {
      categorizedItems['Less Important'].push({
        ...item,
        status: 'Less Important',
        consumptionRate,
        wasteRate
      });
    } else {
      categorizedItems['Waste'].push({
        ...item,
        status: 'Waste',
        consumptionRate,
        wasteRate
      });
    }
  });

  // Calculate category summaries
  const categories = Object.keys(categorizedItems).map(categoryName => {
    const items = categorizedItems[categoryName];
    const totalPurchased = items.reduce((sum, item) => sum + item.purchased, 0);
    const totalConsumed = items.reduce((sum, item) => sum + item.consumed, 0);
    const totalExpired = items.reduce((sum, item) => sum + item.expired, 0);
    
    return {
      name: categoryName,
      totalItems: items.length,
      purchased: totalPurchased,
      consumed: totalConsumed,
      expired: totalExpired,
      wasteRate: totalPurchased > 0 ? ((totalExpired / totalPurchased) * 100).toFixed(1) : 0,
      topItems: items.slice(0, 5).map(item => ({
        name: item.name,
        quantity: item.totalQuantity,
        unit: 'pieces',
        status: item.status
      }))
    };
  });

  // Calculate overall summary
  const totalItems = monthlyItems.length;
  const totalPurchased = monthlyItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalConsumed = monthlyItems.filter(item => item.status === 'completed').reduce((sum, item) => sum + item.quantity, 0);
  const totalExpired = monthlyItems.filter(item => item.status === 'expired').reduce((sum, item) => sum + item.quantity, 0);
  
  const consumptionRate = totalPurchased > 0 ? ((totalConsumed / totalPurchased) * 100).toFixed(1) : 0;
  const wasteRate = totalPurchased > 0 ? ((totalExpired / totalPurchased) * 100).toFixed(1) : 0;
  const costEfficiency = totalPurchased > 0 ? (((totalConsumed / totalPurchased) * 100) - wasteRate).toFixed(1) : 0;

  // Generate insights
  const insights = [];
  
  if (wasteRate > 20) {
    insights.push({
      type: 'warning',
      message: `High waste rate of ${wasteRate}%. Consider buying smaller quantities or better planning.`
    });
  }
  
  if (consumptionRate < 60) {
    insights.push({
      type: 'warning',
      message: `Low consumption rate of ${consumptionRate}%. You might be overbuying groceries.`
    });
  }
  
  const veryImportantCount = categorizedItems['Very Important'].length;
  if (veryImportantCount > 0) {
    insights.push({
      type: 'tip',
      message: `${veryImportantCount} items are consistently used. Consider buying these in bulk for better value.`
    });
  }
  
  const wasteCount = categorizedItems['Waste'].length;
  if (wasteCount > 0) {
    insights.push({
      type: 'tip',
      message: `${wasteCount} items frequently expire. Try buying smaller quantities or find alternative uses.`
    });
  }

  // Top items by usage
  const topItems = Object.values(itemStats)
    .sort((a, b) => b.consumed - a.consumed)
    .slice(0, 10)
    .map(item => ({
      name: item.name,
      category: item.category,
      purchased: item.purchased,
      consumed: item.consumed,
      expired: item.expired,
      status: item.consumed >= item.purchased * 0.8 ? 'Very Important' : 
              item.consumed >= item.purchased * 0.5 ? 'Less Important' : 'Waste'
    }));

  return {
    summary: {
      totalItems,
      consumptionRate,
      wasteRate,
      costEfficiency,
      insights
    },
    categories,
    monthlyTrends: {
      month: targetMonth,
      totalPurchased,
      totalConsumed,
      totalExpired
    },
    topItems
  };
}

// Sugar health functions
function getHighSugarFoods() {
  return [
    'sugar', 'honey', 'maple syrup', 'agave', 'molasses',
    'candy', 'chocolate', 'cookies', 'cake', 'donuts',
    'soda', 'juice', 'energy drinks', 'sports drinks',
    'ice cream', 'frozen yogurt', 'pudding', 'jelly',
    'jam', 'marmalade', 'sweetened yogurt', 'cereal',
    'granola bars', 'trail mix', 'dried fruits',
    'white bread', 'white rice', 'pasta', 'potatoes',
    'bananas', 'grapes', 'mangoes', 'pineapple'
  ];
}

async function generateSugarRecommendations(hbA1c) {
  const highSugarFoods = getHighSugarFoods();
  const userItems = await GroceryItem.find({ status: 'active' });
  
  let recommendations = '';
  
  if (hbA1c >= 6.5) {
    recommendations += '⚠️ **Diabetes Range Detected** - Strict sugar control recommended.\n\n';
  } else if (hbA1c >= 5.7) {
    recommendations += '⚠️ **Prediabetes Range** - Monitor sugar intake carefully.\n\n';
  } else {
    recommendations += '✅ **Normal Range** - Maintain healthy eating habits.\n\n';
  }
  
  // Find high-sugar items in inventory
  const highSugarItems = userItems.filter(item => 
    highSugarFoods.some(sugarFood => 
      item.productName.toLowerCase().includes(sugarFood.toLowerCase())
    )
  );
  
  if (highSugarItems.length > 0) {
    recommendations += '🚫 **High-Sugar Items in Your Inventory:**\n';
    highSugarItems.forEach(item => {
      recommendations += `• ${item.productName} (${item.category})\n`;
    });
    recommendations += '\n💡 **Recommendations:**\n';
    recommendations += '• Limit consumption of these items\n';
    recommendations += '• Consider sugar-free alternatives\n';
    recommendations += '• Monitor portion sizes\n';
    recommendations += '• Check nutrition labels for added sugars\n\n';
  } else {
    recommendations += '✅ **Good News!** No high-sugar items detected in your current inventory.\n\n';
  }
  
  recommendations += '🥗 **Sugar-Friendly Alternatives:**\n';
  recommendations += '• Fresh vegetables (broccoli, spinach, kale)\n';
  recommendations += '• Lean proteins (chicken, fish, tofu)\n';
  recommendations += '• Whole grains (quinoa, brown rice, oats)\n';
  recommendations += '• Nuts and seeds (almonds, walnuts, chia seeds)\n';
  recommendations += '• Berries (strawberries, blueberries, raspberries)\n';
  
  return recommendations;
}

// Azure OpenAI recipe generation function
async function generateAzureOpenAIRecipe(query, availableItems) {
  if (!azureOpenAI) {
    throw new Error('Azure OpenAI not configured');
  }

  try {
    // Get non-expired items from database
    const nonExpiredItems = availableItems.filter(item => {
      if (item.status === 'expired') return false;
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      return expiryDate >= today;
    });

    const availableIngredients = nonExpiredItems.map(item => item.productName).join(', ');

        const systemPrompt = `You are a helpful cooking assistant that creates recipes using the ingredients provided by the user. 
        You should create practical, delicious recipes that can be made with the available ingredients.
        
        CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.
        
        Always include:
        1. A creative recipe title
        2. Recipe type (Main Course, Side Dish, Dessert, etc.)
        3. List of ingredients with amounts (use available ingredients + common pantry items like salt, pepper, oil)
        4. Step-by-step cooking instructions
        5. Helpful cooking tips
        
        Format your response as a JSON object with this EXACT structure:
        {
          "title": "Recipe Title",
          "type": "Recipe Type",
          "ingredients": [
            {"name": "Ingredient Name", "amount": "Amount", "expiring": true}
          ],
          "steps": ["Step 1", "Step 2", "Step 3"],
          "tips": "Helpful cooking tips and suggestions"
        }
        
        Mark ingredients as "expiring": true if they are from the user's available ingredients list.
        Use the available ingredients provided by the user and add common pantry items as needed.`;

        const userPrompt = `Create a recipe for "${query}" using these available ingredients: ${availableIngredients}
        
        Available ingredients: ${availableIngredients}
        
        Please create a practical recipe that uses as many of these ingredients as possible. Include common pantry items like salt, pepper, oil, etc. if needed.
        
        Respond with ONLY the JSON object, no additional text.`;

        const response = await azureOpenAI.chat.completions.create({
          model: AZURE_OPENAI_DEPLOYMENT,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        console.log('Azure OpenAI raw response:', content);
        
        // Try to parse JSON response
        try {
          const recipe = JSON.parse(content);
          
          // Validate and enhance the recipe
          if (!recipe.title || !recipe.ingredients || !recipe.steps) {
            throw new Error('Invalid recipe format from AI');
          }

          // Mark ingredients as expiring if they match available items
          recipe.ingredients = recipe.ingredients.map(ingredient => {
            const isExpiring = nonExpiredItems.some(item => 
              item.productName.toLowerCase().includes(ingredient.name.toLowerCase()) ||
              ingredient.name.toLowerCase().includes(item.productName.toLowerCase())
            );
            return {
              ...ingredient,
              expiring: isExpiring
            };
          });

          console.log('Azure OpenAI recipe generated successfully:', recipe.title);
          return recipe;
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          console.error('Raw content:', content);
          throw new Error('AI response format error');
        }
  } catch (error) {
    console.error('Azure OpenAI API error:', error);
    throw error;
  }
}

// Recipe generation functions
function generateRecipeFromQuery(query, availableItems) {
  const recipes = {
    'tomato curry': {
      title: 'Simple Tomato Curry',
      type: 'Main Course',
      ingredients: [
        { name: 'Tomatoes', amount: '4-5 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Onions', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('onion')) },
        { name: 'Garlic', amount: '3-4 cloves', expiring: availableItems.some(item => item.productName.toLowerCase().includes('garlic')) },
        { name: 'Ginger', amount: '1 inch piece', expiring: availableItems.some(item => item.productName.toLowerCase().includes('ginger')) },
        { name: 'Cumin seeds', amount: '1 tsp', expiring: false },
        { name: 'Turmeric powder', amount: '1/2 tsp', expiring: false },
        { name: 'Red chili powder', amount: '1 tsp', expiring: false },
        { name: 'Coriander powder', amount: '1 tsp', expiring: false },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Oil', amount: '2 tbsp', expiring: false }
      ],
      steps: [
        'Heat oil in a pan and add cumin seeds',
        'Add chopped onions and sauté until golden brown',
        'Add ginger-garlic paste and cook for 1 minute',
        'Add chopped tomatoes and cook until soft',
        'Add turmeric, red chili powder, and coriander powder',
        'Mix well and add salt to taste',
        'Cook for 5-7 minutes until oil separates',
        'Garnish with fresh coriander leaves and serve hot'
      ],
      tips: 'This curry pairs well with rice, roti, or bread. Adjust spice levels according to your preference.'
    },
    'potato curry': {
      title: 'Spicy Potato Curry',
      type: 'Main Course',
      ingredients: [
        { name: 'Potatoes', amount: '4-5 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('potato')) },
        { name: 'Onions', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('onion')) },
        { name: 'Tomatoes', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Garlic', amount: '4-5 cloves', expiring: availableItems.some(item => item.productName.toLowerCase().includes('garlic')) },
        { name: 'Ginger', amount: '1 inch piece', expiring: availableItems.some(item => item.productName.toLowerCase().includes('ginger')) },
        { name: 'Green chilies', amount: '2-3 pieces', expiring: availableItems.some(item => item.productName.toLowerCase().includes('chili')) },
        { name: 'Cumin seeds', amount: '1 tsp', expiring: false },
        { name: 'Turmeric powder', amount: '1/2 tsp', expiring: false },
        { name: 'Red chili powder', amount: '1 tsp', expiring: false },
        { name: 'Coriander powder', amount: '1 tsp', expiring: false },
        { name: 'Garam masala', amount: '1/2 tsp', expiring: false },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Oil', amount: '3 tbsp', expiring: false },
        { name: 'Fresh coriander leaves', amount: 'for garnish', expiring: false }
      ],
      steps: [
        'Wash and peel potatoes, cut into medium-sized cubes',
        'Heat oil in a pan and add cumin seeds',
        'Add chopped onions and sauté until golden brown',
        'Add ginger-garlic paste and green chilies, cook for 1 minute',
        'Add chopped tomatoes and cook until soft and mushy',
        'Add turmeric, red chili powder, and coriander powder',
        'Add potato cubes and mix well with the masala',
        'Add salt and a little water, cover and cook for 15-20 minutes',
        'Stir occasionally until potatoes are tender',
        'Add garam masala and mix well',
        'Garnish with fresh coriander leaves and serve hot'
      ],
      tips: 'This curry is perfect with rice, roti, or bread. You can adjust the spice level by reducing or increasing the chili powder.'
    },
    'pasta': {
      title: 'Creamy Tomato Pasta',
      type: 'Main Course',
      ingredients: [
        { name: 'Pasta', amount: '200g', expiring: availableItems.some(item => item.productName.toLowerCase().includes('pasta')) },
        { name: 'Tomatoes', amount: '3-4 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Onions', amount: '1 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('onion')) },
        { name: 'Garlic', amount: '3 cloves', expiring: availableItems.some(item => item.productName.toLowerCase().includes('garlic')) },
        { name: 'Cream', amount: '1/2 cup', expiring: availableItems.some(item => item.productName.toLowerCase().includes('cream')) },
        { name: 'Cheese', amount: '1/2 cup grated', expiring: availableItems.some(item => item.productName.toLowerCase().includes('cheese')) },
        { name: 'Basil leaves', amount: 'few leaves', expiring: availableItems.some(item => item.productName.toLowerCase().includes('basil')) },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Black pepper', amount: 'to taste', expiring: false },
        { name: 'Olive oil', amount: '2 tbsp', expiring: false }
      ],
      steps: [
        'Boil pasta according to package instructions',
        'Heat olive oil in a pan and add chopped garlic',
        'Add chopped onions and cook until translucent',
        'Add chopped tomatoes and cook until soft',
        'Add cream and mix well',
        'Add grated cheese and stir until melted',
        'Add cooked pasta and mix gently',
        'Season with salt and black pepper',
        'Garnish with fresh basil leaves and serve'
      ],
      tips: 'Use fresh basil for the best flavor. You can also add vegetables like bell peppers or mushrooms.'
    },
    'salad': {
      title: 'Fresh Garden Salad',
      type: 'Side Dish',
      ingredients: [
        { name: 'Lettuce', amount: '1 head', expiring: availableItems.some(item => item.productName.toLowerCase().includes('lettuce')) },
        { name: 'Tomatoes', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Cucumber', amount: '1 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('cucumber')) },
        { name: 'Carrots', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('carrot')) },
        { name: 'Onions', amount: '1/2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('onion')) },
        { name: 'Olive oil', amount: '3 tbsp', expiring: false },
        { name: 'Lemon juice', amount: '2 tbsp', expiring: false },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Black pepper', amount: 'to taste', expiring: false }
      ],
      steps: [
        'Wash and chop all vegetables',
        'Cut lettuce into bite-sized pieces',
        'Slice tomatoes and cucumber',
        'Grate or julienne carrots',
        'Thinly slice onions',
        'Mix all vegetables in a large bowl',
        'In a small bowl, whisk olive oil, lemon juice, salt, and pepper',
        'Pour dressing over salad and toss gently',
        'Serve immediately for best freshness'
      ],
      tips: 'Add the dressing just before serving to keep the vegetables crisp. You can also add nuts or seeds for extra crunch.'
    },
    'chicken curry': {
      title: 'Classic Chicken Curry',
      type: 'Main Course',
      ingredients: [
        { name: 'Chicken', amount: '500g', expiring: availableItems.some(item => item.productName.toLowerCase().includes('chicken')) },
        { name: 'Onions', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('onion')) },
        { name: 'Tomatoes', amount: '3 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Garlic', amount: '6-8 cloves', expiring: availableItems.some(item => item.productName.toLowerCase().includes('garlic')) },
        { name: 'Ginger', amount: '1 inch piece', expiring: availableItems.some(item => item.productName.toLowerCase().includes('ginger')) },
        { name: 'Green chilies', amount: '2-3 pieces', expiring: availableItems.some(item => item.productName.toLowerCase().includes('chili')) },
        { name: 'Cumin seeds', amount: '1 tsp', expiring: false },
        { name: 'Turmeric powder', amount: '1/2 tsp', expiring: false },
        { name: 'Red chili powder', amount: '1 tsp', expiring: false },
        { name: 'Coriander powder', amount: '1 tsp', expiring: false },
        { name: 'Garam masala', amount: '1/2 tsp', expiring: false },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Oil', amount: '3 tbsp', expiring: false },
        { name: 'Fresh coriander leaves', amount: 'for garnish', expiring: false }
      ],
      steps: [
        'Wash and cut chicken into medium-sized pieces',
        'Heat oil in a pan and add cumin seeds',
        'Add chopped onions and sauté until golden brown',
        'Add ginger-garlic paste and green chilies, cook for 1 minute',
        'Add chopped tomatoes and cook until soft and mushy',
        'Add turmeric, red chili powder, and coriander powder',
        'Add chicken pieces and mix well with the masala',
        'Add salt and cook for 5-7 minutes',
        'Add water, cover and cook for 20-25 minutes until chicken is tender',
        'Add garam masala and mix well',
        'Garnish with fresh coriander leaves and serve hot'
      ],
      tips: 'This curry is perfect with rice, roti, or naan. You can adjust the spice level according to your preference.'
    },
    'dal': {
      title: 'Yellow Dal (Lentil Curry)',
      type: 'Main Course',
      ingredients: [
        { name: 'Yellow lentils', amount: '1 cup', expiring: availableItems.some(item => item.productName.toLowerCase().includes('lentil')) },
        { name: 'Onions', amount: '1 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('onion')) },
        { name: 'Tomatoes', amount: '2 medium', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Garlic', amount: '4-5 cloves', expiring: availableItems.some(item => item.productName.toLowerCase().includes('garlic')) },
        { name: 'Ginger', amount: '1 inch piece', expiring: availableItems.some(item => item.productName.toLowerCase().includes('ginger')) },
        { name: 'Green chilies', amount: '2 pieces', expiring: availableItems.some(item => item.productName.toLowerCase().includes('chili')) },
        { name: 'Cumin seeds', amount: '1 tsp', expiring: false },
        { name: 'Turmeric powder', amount: '1/2 tsp', expiring: false },
        { name: 'Red chili powder', amount: '1/2 tsp', expiring: false },
        { name: 'Coriander powder', amount: '1/2 tsp', expiring: false },
        { name: 'Garam masala', amount: '1/4 tsp', expiring: false },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Oil', amount: '2 tbsp', expiring: false },
        { name: 'Fresh coriander leaves', amount: 'for garnish', expiring: false }
      ],
      steps: [
        'Wash and soak lentils for 30 minutes',
        'Cook lentils with turmeric and salt until soft',
        'Heat oil in a pan and add cumin seeds',
        'Add chopped onions and sauté until golden brown',
        'Add ginger-garlic paste and green chilies, cook for 1 minute',
        'Add chopped tomatoes and cook until soft',
        'Add red chili powder and coriander powder',
        'Add cooked lentils and mix well',
        'Add water if needed and simmer for 10-15 minutes',
        'Add garam masala and mix well',
        'Garnish with fresh coriander leaves and serve hot'
      ],
      tips: 'This dal is perfect with rice or roti. You can also add vegetables like spinach or bottle gourd for extra nutrition.'
    }
  };

  const normalizedQuery = query.toLowerCase().trim();
  
  // First, try exact matches
  if (recipes[normalizedQuery]) {
    return recipes[normalizedQuery];
  }
  
  // Then try partial matches
  for (const [key, recipe] of Object.entries(recipes)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return recipe;
    }
  }
  
  // Try word-based matching
  const queryWords = normalizedQuery.split(' ');
  for (const [key, recipe] of Object.entries(recipes)) {
    const keyWords = key.split(' ');
    if (queryWords.some(word => keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord)))) {
      return recipe;
    }
  }

  // Default recipe if no match found
  return {
    title: `${query.charAt(0).toUpperCase() + query.slice(1)} Recipe`,
    type: 'Main Course',
    ingredients: availableItems.slice(0, 5).map(item => ({
      name: item.productName,
      amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`,
      expiring: true
    })),
    steps: [
      'Gather all your ingredients',
      'Prepare the main ingredients as needed',
      'Cook according to your preferred method',
      'Season to taste',
      'Serve hot and enjoy!'
    ],
    tips: 'This is a basic recipe template. Feel free to customize based on your available ingredients and preferences.'
  };
}

function generateExpirySuggestions(expiringItems) {
  const suggestions = [];
  
  // Group items by category for better recipe suggestions
  const categories = {
    'Dairy': expiringItems.filter(item => item.category === 'Dairy'),
    'Vegetables': expiringItems.filter(item => item.category === 'Vegetables'),
    'Fruits': expiringItems.filter(item => item.category === 'Fruits'),
    'Meat': expiringItems.filter(item => item.category === 'Meat'),
    'Grains': expiringItems.filter(item => item.category === 'Grains')
  };

  // Generate suggestions based on available categories
  if (categories.Dairy.length > 0 && categories.Vegetables.length > 0) {
    suggestions.push({
      title: 'Creamy Vegetable Soup',
      type: 'Soup',
      ingredients: [
        ...categories.Dairy.map(item => ({ name: item.productName, amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`, expiring: true })),
        ...categories.Vegetables.map(item => ({ name: item.productName, amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`, expiring: true })),
        { name: 'Onions', amount: '1 medium', expiring: false },
        { name: 'Garlic', amount: '2 cloves', expiring: false },
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Black pepper', amount: 'to taste', expiring: false }
      ],
      steps: [
        'Chop all vegetables into small pieces',
        'Heat oil in a large pot and sauté onions and garlic',
        'Add vegetables and cook until tender',
        'Add dairy products and mix well',
        'Add water or stock and bring to a boil',
        'Simmer for 15-20 minutes',
        'Season with salt and pepper',
        'Blend until smooth and serve hot'
      ],
      tips: 'This soup is perfect for using up expiring dairy and vegetables. You can also add herbs for extra flavor.'
    });
  }

  if (categories.Fruits.length > 0) {
    suggestions.push({
      title: 'Fresh Fruit Smoothie',
      type: 'Beverage',
      ingredients: [
        ...categories.Fruits.map(item => ({ name: item.productName, amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`, expiring: true })),
        { name: 'Yogurt', amount: '1 cup', expiring: false },
        { name: 'Honey', amount: '2 tbsp', expiring: false },
        { name: 'Ice cubes', amount: '1/2 cup', expiring: false }
      ],
      steps: [
        'Wash and chop all fruits',
        'Add fruits to a blender',
        'Add yogurt and honey',
        'Add ice cubes and blend until smooth',
        'Taste and adjust sweetness if needed',
        'Pour into glasses and serve immediately'
      ],
      tips: 'This smoothie is a great way to use up expiring fruits. You can also freeze it for later use.'
    });
  }

  if (categories.Meat.length > 0 && categories.Vegetables.length > 0) {
    suggestions.push({
      title: 'Quick Stir-Fry',
      type: 'Main Course',
      ingredients: [
        ...categories.Meat.map(item => ({ name: item.productName, amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`, expiring: true })),
        ...categories.Vegetables.map(item => ({ name: item.productName, amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`, expiring: true })),
        { name: 'Soy sauce', amount: '2 tbsp', expiring: false },
        { name: 'Garlic', amount: '2 cloves', expiring: false },
        { name: 'Ginger', amount: '1 inch piece', expiring: false },
        { name: 'Oil', amount: '2 tbsp', expiring: false }
      ],
      steps: [
        'Cut meat and vegetables into bite-sized pieces',
        'Heat oil in a wok or large pan',
        'Add garlic and ginger, cook for 30 seconds',
        'Add meat and cook until almost done',
        'Add vegetables and stir-fry for 3-4 minutes',
        'Add soy sauce and mix well',
        'Cook for another 2-3 minutes',
        'Serve hot with rice or noodles'
      ],
      tips: 'This stir-fry is perfect for using up expiring meat and vegetables. Cook on high heat for best results.'
    });
  }

  // If no specific suggestions, create a general "Use It Up" recipe
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Everything-But-The-Kitchen-Sink Recipe',
      type: 'Main Course',
      ingredients: [
        ...expiringItems.map(item => ({ name: item.productName, amount: `${item.quantity} ${item.quantity > 1 ? 'pieces' : 'piece'}`, expiring: true })),
        { name: 'Salt', amount: 'to taste', expiring: false },
        { name: 'Pepper', amount: 'to taste', expiring: false },
        { name: 'Oil', amount: '2 tbsp', expiring: false }
      ],
      steps: [
        'Gather all your expiring ingredients',
        'Chop or prepare ingredients as needed',
        'Heat oil in a large pan or pot',
        'Add ingredients in order of cooking time (hardest first)',
        'Cook until all ingredients are tender',
        'Season with salt and pepper',
        'Mix well and serve hot',
        'Enjoy your creative dish!'
      ],
      tips: 'This recipe is designed to use up all your expiring items. Feel free to add spices or herbs you have on hand.'
    });
  }

  return suggestions;
}

// Recipe search endpoint
app.post('/recipes/search', async (req, res) => {
  const { query, expiringItems } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const activeItems = await GroceryItem.find({ status: 'active' });
    const availableItems = [...activeItems, ...expiringItems];
    
    // Try Azure OpenAI first, then predefined recipes
    let recipe;
    let source = 'predefined';
    
    try {
      recipe = await generateAzureOpenAIRecipe(query, availableItems);
      source = 'Azure OpenAI';
      console.log('Azure OpenAI recipe generated successfully');
    } catch (aiError) {
      console.log('Azure OpenAI failed, using predefined recipe:', aiError.message);
      recipe = generateRecipeFromQuery(query, availableItems);
      source = 'predefined';
    }
    
    res.json({
      success: true,
      recipes: [recipe],
      query: query,
      source: source,
      availableIngredients: availableItems.map(item => item.productName)
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

// Recipe suggestions endpoint
app.post('/recipes/suggestions', async (req, res) => {
  const { expiringItems } = req.body;
  
  if (!expiringItems || expiringItems.length === 0) {
    return res.status(400).json({ error: 'Expiring items are required' });
  }

  try {
    // Try Azure OpenAI first, then predefined suggestions
    let suggestions = [];
    let source = 'predefined';
    
    try {
      const expiringIngredients = expiringItems.map(item => item.productName).join(', ');
      const aiRecipe = await generateAzureOpenAIRecipe(`recipe using expiring ingredients: ${expiringIngredients}`, expiringItems);
      suggestions.push(aiRecipe);
      source = 'Azure OpenAI';
      console.log('Azure OpenAI expiry suggestions generated successfully');
    } catch (aiError) {
      console.log('Azure OpenAI failed, using predefined suggestions:', aiError.message);
      suggestions = generateExpirySuggestions(expiringItems);
      source = 'predefined';
    }
    
    res.json({
      success: true,
      recipes: suggestions,
      expiringItems: expiringItems,
      source: source
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Sugar Health API endpoints
app.post('/sugar-health/update', async (req, res) => {
  const { hbA1c, lastUpdated } = req.body;
  
  if (!hbA1c || isNaN(hbA1c) || hbA1c < 0 || hbA1c > 20) {
    return res.status(400).json({ error: 'Invalid HbA1c value' });
  }

  try {
    let sugarHealthData = await SugarHealth.findOne();
    
    if (!sugarHealthData) {
      sugarHealthData = new SugarHealth();
    }
    
    sugarHealthData.hbA1c = parseFloat(hbA1c);
    sugarHealthData.lastUpdated = lastUpdated || new Date();
    
    await sugarHealthData.save();
    
    const recommendations = await generateSugarRecommendations(sugarHealthData.hbA1c);
    
    res.json({
      success: true,
      hbA1c: sugarHealthData.hbA1c,
      lastUpdated: sugarHealthData.lastUpdated,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Error updating sugar health data:', error);
    res.status(500).json({ error: 'Failed to update sugar health data' });
  }
});

app.post('/sugar-health/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Store PDF information
    const pdfInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadedAt: new Date()
    };

    let sugarHealthData = await SugarHealth.findOne();
    
    if (!sugarHealthData) {
      sugarHealthData = new SugarHealth();
    }
    
    sugarHealthData.pdfReports.push(pdfInfo);
    sugarHealthData.lastUpdated = new Date();
    
    await sugarHealthData.save();

    // Generate recommendations based on current inventory
    const recommendations = await generateSugarRecommendations(sugarHealthData.hbA1c);

    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      pdfInfo: pdfInfo,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

app.get('/sugar-health/data', async (req, res) => {
  try {
    const sugarHealthData = await SugarHealth.findOne();
    
    res.json({
      success: true,
      data: sugarHealthData || { hbA1c: null, lastUpdated: null, pdfReports: [] }
    });
  } catch (error) {
    console.error('Error fetching sugar health data:', error);
    res.status(500).json({ error: 'Failed to fetch sugar health data' });
  }
});

// Analytics API endpoints
app.get('/analytics/grocery', async (req, res) => {
  try {
    const { month } = req.query;
    const analytics = await calculateGroceryAnalytics(month);
    
    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

app.get('/analytics/health', async (req, res) => {
  try {
    const sugarHealthData = await SugarHealth.findOne();
    
    res.json({
      success: true,
      data: {
        hbA1c: sugarHealthData?.hbA1c || null,
        lastUpdated: sugarHealthData?.lastUpdated || null,
        pdfReports: sugarHealthData?.pdfReports?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching health analytics:', error);
    res.status(500).json({ error: 'Failed to fetch health analytics' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${PORT}`);
  console.log('Daily expiry check scheduled for 9 AM');
  
  // Check API configurations
  if (azureOpenAI) {
    console.log('✅ Azure OpenAI configured - AI recipe generation enabled');
  } else {
    console.log('⚠️  Azure OpenAI not configured - set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY');
    console.log('   Using predefined recipes only');
  }
});

// Health Metrics API Routes
const healthMetricsSchema = new mongoose.Schema({
  sugarLevel: Number,
  cholesterol: Number,
  bloodPressureSystolic: Number,
  bloodPressureDiastolic: Number,
  weight: Number,
  height: Number,
  lastUpdated: Date
});

const HealthMetrics = mongoose.model('HealthMetrics', healthMetricsSchema, 'sugarhealths');

app.post('/health-metrics/update', async (req, res) => {
  try {
    const { sugarLevel, cholesterol, bloodPressureSystolic, bloodPressureDiastolic, weight, height, lastUpdated } = req.body;
    
    // Validate input data
    const healthData = {
      sugarLevel: sugarLevel ? parseFloat(sugarLevel) : null,
      cholesterol: cholesterol ? parseFloat(cholesterol) : null,
      bloodPressureSystolic: bloodPressureSystolic ? parseFloat(bloodPressureSystolic) : null,
      bloodPressureDiastolic: bloodPressureDiastolic ? parseFloat(bloodPressureDiastolic) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date()
    };
    
    // Create new health metrics entry (don't update existing)
    const newMetrics = new HealthMetrics(healthData);
    const savedMetrics = await newMetrics.save();
    
    console.log('New health metrics created in database:', savedMetrics);
    
    res.json({
      success: true,
      message: 'Health metrics created successfully',
      data: savedMetrics
    });
  } catch (error) {
    console.error('Error creating health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health metrics'
    });
  }
});

app.get('/health-metrics', async (req, res) => {
  try {
    // Get the most recent health metrics entry
    const healthMetrics = await HealthMetrics.findOne().sort({ lastUpdated: -1 });
    
    res.json({
      success: true,
      data: healthMetrics || {
        sugarLevel: null,
        cholesterol: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        weight: null,
        height: null,
        lastUpdated: null
      }
    });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health metrics'
    });
    }
  });


  // Health Facts API
app.post('/health-facts', async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    
    console.log('Generating health facts for topic:', topic);
    
    const systemMessage = `You are a sustainability and nutrition expert providing accurate, evidence-based facts about ${topic}. 
    Generate ${count} compelling facts that are:
    1. Statistically accurate and well-researched
    2. Include specific numbers, percentages, or data points
    3. Focus on food waste, nutrition, sustainable eating, and grocery management
    4. Include credible sources (UN, USDA, WHO, environmental organizations, etc.)
    5. Highlight the impact on health, environment, and economy
    6. Relate to smart grocery management, meal planning, and food waste reduction
    
    Format your response as a JSON array with objects containing:
    - fact: The main fact/statistic
    - source: Credible source (UN, USDA, WHO, environmental orgs, etc.)
    - impact: Brief description of the health/environmental/economic impact
    
    IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.`;
    
    const completion = await azureOpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Generate ${count} facts about ${topic} with global health impact focus.` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    console.log('Azure OpenAI response for health facts:', completion.choices[0].message.content);
    
    try {
      const facts = JSON.parse(completion.choices[0].message.content);
      res.json({ success: true, facts });
    } catch (parseError) {
      console.error('Error parsing health facts JSON:', parseError);
      // Fallback facts
      const fallbackFacts = [
        {
          fact: "1.3 billion tons of food is wasted globally each year, while 820 million people go hungry",
          source: "United Nations Food and Agriculture Organization",
          impact: "Global food security crisis"
        },
        {
          fact: "Food waste accounts for 8% of global greenhouse gas emissions, contributing to climate change",
          source: "United Nations Environment Programme",
          impact: "Environmental degradation"
        },
        {
          fact: "The average household wastes 30-40% of purchased food, costing families $1,500 annually",
          source: "USDA Economic Research Service",
          impact: "Economic burden on families"
        },
        {
          fact: "Proper meal planning and grocery management can reduce food waste by up to 50%",
          source: "Harvard School of Public Health",
          impact: "Sustainable living potential"
        },
        {
          fact: "Consuming expired or spoiled food leads to 48 million foodborne illnesses annually in the US alone",
          source: "Centers for Disease Control and Prevention",
          impact: "Public health risk"
        }
      ];
      res.json({ success: true, facts: fallbackFacts });
    }
  } catch (error) {
    console.error('Error generating health facts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate health facts',
      error: error.message 
    });
  }
});

// Health Risk Analysis API
app.get('/health-risk-analysis', async (req, res) => {
  try {
    console.log('Starting health risk analysis...');
    
    // Get latest health metrics
    const healthMetrics = await HealthMetrics.findOne().sort({ lastUpdated: -1 });
    console.log('Health metrics found:', healthMetrics ? 'Yes' : 'No');
    
    // Get all grocery items
    const groceryItems = await GroceryItem.find();
    console.log('Grocery items found:', groceryItems.length);
    
    if (!healthMetrics) {
      console.log('No health metrics available, returning empty analysis');
      return res.json({
        success: true,
        data: {
          riskLevel: 'No Data',
          risks: [],
          recommendations: [],
          avoidItems: [],
          message: 'No health metrics available for analysis'
        }
      });
    }
    
    // Prepare data for Azure OpenAI analysis
    const analysisData = {
      healthMetrics: {
        sugarLevel: healthMetrics.sugarLevel,
        cholesterol: healthMetrics.cholesterol,
        bloodPressureSystolic: healthMetrics.bloodPressureSystolic,
        bloodPressureDiastolic: healthMetrics.bloodPressureDiastolic,
        weight: healthMetrics.weight,
        height: healthMetrics.height,
        lastUpdated: healthMetrics.lastUpdated
      },
      groceryItems: groceryItems.map(item => ({
        name: item.productName,
        category: item.category,
        status: item.status,
        expiryDate: item.expiryDate
      }))
    };
    
    // Call Azure OpenAI for health risk analysis
    if (azureOpenAI && process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
      try {
        const completion = await azureOpenAI.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a health and nutrition expert. Analyze the provided health metrics and grocery items to identify potential health risks and provide specific recommendations. 
              
              Health Metrics Guidelines:
              - Blood Sugar: Normal < 100 mg/dL, Pre-diabetes 100-125 mg/dL, Diabetes > 125 mg/dL
              - Cholesterol: Normal < 200 mg/dL, Borderline 200-239 mg/dL, High > 240 mg/dL
              - Blood Pressure: Normal < 120/80 mmHg, Pre-hypertension 120-139/80-89 mmHg, Hypertension > 140/90 mmHg
              - BMI: Calculate from weight and height (weight in lbs / (height in inches)² × 703)
              
              IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON.
              
              Based on the health metrics, analyze each grocery item and provide specific recommendations:
              - For HIGH BLOOD SUGAR: Avoid items with high sugar/carbs (bread, rice, fruits, juices) and recommend low-sugar alternatives
              - For HIGH CHOLESTEROL: Avoid items with saturated fats (dairy, meat, oils) and recommend heart-healthy alternatives
              - For HIGH BLOOD PRESSURE: Avoid high-sodium items and recommend low-sodium alternatives
              
              Provide a JSON response with:
              {
                "riskLevel": "Low/Medium/High",
                "risks": ["list of identified health risks"],
                "recommendations": ["general health recommendations"],
                "avoidItems": ["2-3 specific items from grocery list to avoid with reasons"],
                "preferredItems": ["2-3 better alternatives (can be outside database) with reasons"]
              }`
            },
            {
              role: "user",
              content: `Please analyze my health data and grocery items:\n\nHealth Metrics: ${JSON.stringify(analysisData.healthMetrics, null, 2)}\n\nGrocery Items: ${JSON.stringify(analysisData.groceryItems, null, 2)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
        
        const responseContent = completion.choices[0].message.content;
        console.log('Azure OpenAI response:', responseContent);
        
        let analysisResult;
        try {
          analysisResult = JSON.parse(responseContent);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.log('Response content:', responseContent);
          // Use fallback analysis if JSON parsing fails
          analysisResult = generateFallbackAnalysis(healthMetrics, groceryItems);
        }
        
        console.log('Health risk analysis completed:', analysisResult);
        
        res.json({
          success: true,
          data: analysisResult
        });
        
      } catch (openaiError) {
        console.error('Azure OpenAI error:', openaiError);
        
        // Fallback analysis
        const fallbackAnalysis = generateFallbackAnalysis(healthMetrics, groceryItems);
        res.json({
          success: true,
          data: fallbackAnalysis
        });
      }
    } else {
      console.log('Azure OpenAI not available, using fallback analysis');
      // Fallback analysis when Azure OpenAI is not available
      const fallbackAnalysis = generateFallbackAnalysis(healthMetrics, groceryItems);
      console.log('Fallback analysis result:', fallbackAnalysis);
      res.json({
        success: true,
        data: fallbackAnalysis
      });
    }
    
  } catch (error) {
    console.error('Error in health risk analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze health risks'
    });
  }
});

// Fallback analysis function
function generateFallbackAnalysis(healthMetrics, groceryItems) {
  const risks = [];
  const recommendations = [];
  const avoidItems = [];
  const preferredItems = [];
  let riskLevel = 'Low';
  
  // Calculate BMI
  const bmi = healthMetrics.weight && healthMetrics.height ? 
    (healthMetrics.weight / (healthMetrics.height * healthMetrics.height)) * 703 : null;
  
  // Get active items from grocery list
  const activeItems = groceryItems.filter(item => item.status === 'active');
  
  // Analyze blood sugar
  if (healthMetrics.sugarLevel > 125) {
    risks.push('High blood sugar levels - potential diabetes risk');
    
    // Find high-sugar items in grocery list
    const highSugarItems = activeItems.filter(item => 
      item.name.toLowerCase().includes('bread') || 
      item.name.toLowerCase().includes('rice') || 
      item.name.toLowerCase().includes('juice') ||
      item.name.toLowerCase().includes('banana') ||
      item.name.toLowerCase().includes('apple')
    );
    
    if (highSugarItems.length > 0) {
      avoidItems.push(`${highSugarItems[0].name} (high sugar content - avoid for diabetes)`);
    }
    if (highSugarItems.length > 1) {
      avoidItems.push(`${highSugarItems[1].name} (high carbohydrates - raises blood sugar)`);
    }
    
    preferredItems.push('Oats (low glycemic index, helps control blood sugar)');
    preferredItems.push('Quinoa (complex carbs, better for blood sugar control)');
    preferredItems.push('Stevia (natural sweetener, no blood sugar impact)');
    
    riskLevel = 'High';
  } else if (healthMetrics.sugarLevel > 100) {
    risks.push('Elevated blood sugar - pre-diabetes risk');
    avoidItems.push('White bread (refined carbs spike blood sugar)');
    preferredItems.push('Whole grain bread (fiber slows sugar absorption)');
    riskLevel = 'Medium';
  }
  
  // Analyze cholesterol
  if (healthMetrics.cholesterol > 240) {
    risks.push('High cholesterol - cardiovascular disease risk');
    
    // Find high-fat items in grocery list
    const highFatItems = activeItems.filter(item => 
      item.name.toLowerCase().includes('milk') || 
      item.name.toLowerCase().includes('yogurt') || 
      item.name.toLowerCase().includes('cheese') ||
      item.name.toLowerCase().includes('meat')
    );
    
    if (highFatItems.length > 0) {
      avoidItems.push(`${highFatItems[0].name} (high saturated fat - raises cholesterol)`);
    }
    
    preferredItems.push('Olive oil (monounsaturated fats, heart-healthy)');
    preferredItems.push('Avocado (healthy fats, helps lower cholesterol)');
    preferredItems.push('Salmon (omega-3 fatty acids, reduces inflammation)');
    
    riskLevel = 'High';
  } else if (healthMetrics.cholesterol > 200) {
    risks.push('Borderline high cholesterol');
    avoidItems.push('Full-fat dairy (saturated fats raise cholesterol)');
    preferredItems.push('Almonds (monounsaturated fats, heart-healthy)');
    riskLevel = 'Medium';
  }
  
  // Analyze blood pressure
  if (healthMetrics.bloodPressureSystolic > 140 || healthMetrics.bloodPressureDiastolic > 90) {
    risks.push('High blood pressure - hypertension risk');
    avoidItems.push('Processed foods (high sodium content)');
    preferredItems.push('Celery (natural diuretic, helps lower blood pressure)');
    preferredItems.push('Beets (nitrates help dilate blood vessels)');
    riskLevel = 'High';
  } else if (healthMetrics.bloodPressureSystolic > 120 || healthMetrics.bloodPressureDiastolic > 80) {
    risks.push('Elevated blood pressure - pre-hypertension');
    avoidItems.push('Canned foods (high sodium preservatives)');
    preferredItems.push('Bananas (potassium helps regulate blood pressure)');
    riskLevel = 'Medium';
  }
  
  // Analyze BMI
  if (bmi > 30) {
    risks.push('Obesity - multiple health risks');
    avoidItems.push('High-calorie snacks (contributes to weight gain)');
    preferredItems.push('Green tea (metabolism booster, aids weight loss)');
    riskLevel = 'High';
  } else if (bmi > 25) {
    risks.push('Overweight - weight management needed');
    avoidItems.push('Large portions (calorie excess)');
    preferredItems.push('Portion control (use smaller plates)');
    riskLevel = 'Medium';
  }
  
  // General recommendations
  recommendations.push('Consult a healthcare provider for personalized advice');
  recommendations.push('Monitor health metrics regularly');
  recommendations.push('Maintain a balanced diet with portion control');
  recommendations.push('Engage in regular physical activity');
  recommendations.push('Get adequate sleep and manage stress');
  
  return {
    riskLevel,
    risks,
    recommendations,
    avoidItems: avoidItems.slice(0, 3), // Limit to 2-3 items
    preferredItems: preferredItems.slice(0, 3) // Limit to 2-3 items
  };
}

// PDF Health Metrics Extraction API
app.post('/health-metrics/extract-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('PDF uploaded:', req.file.filename);
    
    // Read the PDF file
    const pdfPath = req.file.path;
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Extract text from PDF using multiple methods
    let pdfTextContent;
    let extractionMethod = 'none';
    
    // Method 1: Try pdf-parse with different options
    try {
      const pdfData = await pdfParse(pdfBuffer, {
        // Try different parsing options
        max: 0, // No page limit
        version: 'v1.10.100' // Use specific version
      });
      pdfTextContent = pdfData.text;
      extractionMethod = 'pdf-parse';
      console.log('PDF text extracted successfully with pdf-parse, length:', pdfTextContent.length);
      
      // Check if we got meaningful text content
      if (!pdfTextContent || pdfTextContent.trim().length < 10) {
        console.log('PDF appears to be empty or contains no readable text');
        pdfTextContent = `PDF file: ${req.file.originalname} - This PDF appears to contain no readable text or may be image-based. Please enter health metrics manually.`;
      }
    } catch (parseError) {
      console.error('Error parsing PDF with pdf-parse:', parseError);
      
      // Method 2: Try alternative parsing approach
      try {
        // Try with minimal options
        const pdfData = await pdfParse(pdfBuffer, {
          max: 10, // Limit to first 10 pages
          version: 'v1.10.100'
        });
        pdfTextContent = pdfData.text;
        extractionMethod = 'pdf-parse-minimal';
        console.log('PDF text extracted successfully with minimal options, length:', pdfTextContent.length);
        
        if (!pdfTextContent || pdfTextContent.trim().length < 10) {
          throw new Error('No meaningful text extracted');
        }
      } catch (minimalError) {
        console.error('Error parsing PDF with minimal options:', minimalError);
        
        // Method 3: Try reading as raw text (for some PDFs)
        try {
          const rawText = pdfBuffer.toString('utf8');
          // Look for common health metric patterns in raw text
          const healthPatterns = [
            /glucose[:\s]*(\d+)/gi,
            /blood sugar[:\s]*(\d+)/gi,
            /cholesterol[:\s]*(\d+)/gi,
            /blood pressure[:\s]*(\d+)\/(\d+)/gi,
            /weight[:\s]*(\d+)/gi,
            /height[:\s]*(\d+)/gi
          ];
          
          let foundMetrics = [];
          healthPatterns.forEach(pattern => {
            const matches = rawText.match(pattern);
            if (matches) {
              foundMetrics.push(...matches);
            }
          });
          
          if (foundMetrics.length > 0) {
            pdfTextContent = `PDF file: ${req.file.originalname} - Found potential health metrics in raw text: ${foundMetrics.join(', ')}. Please review and enter the correct values manually.`;
            extractionMethod = 'raw-text-pattern';
            console.log('Found health patterns in raw text:', foundMetrics);
          } else {
            throw new Error('No health patterns found in raw text');
          }
        } catch (rawError) {
          console.error('Error with raw text extraction:', rawError);
          
          // Final fallback: Create a descriptive text for the AI to work with
          pdfTextContent = `PDF file: ${req.file.originalname} - This PDF could not be parsed with any method. The PDF may have a complex format or encoding. Please manually extract the health metrics from the PDF and enter them in the form. Common health metrics to look for: Blood Sugar/Glucose (mg/dL), Cholesterol (mg/dL), Blood Pressure (mmHg), Weight (lbs), Height (inches).`;
          extractionMethod = 'fallback';
        }
      }
    }
    
    console.log(`PDF extraction method used: ${extractionMethod}`);
    
    if (!azureOpenAI) {
      return res.status(500).json({
        success: false,
        message: 'Azure OpenAI not configured'
      });
    }

    // Call Azure OpenAI to extract health metrics from PDF
    const completion = await azureOpenAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical data extraction expert. I will provide you with PDF content and you need to extract health metrics from it.

          Look for these specific health metrics in the PDF content:
          - Blood Sugar/Glucose: Look for terms like "glucose", "blood sugar", "HbA1c", "fasting glucose", "random glucose" (values in mg/dL)
          - Cholesterol: Look for "total cholesterol", "cholesterol", "TC" (values in mg/dL)
          - Blood Pressure: Look for "blood pressure", "BP", "systolic", "diastolic" (values in mmHg, format like 120/80)
          - Weight: Look for "weight", "body weight", "BW" (convert kg to lbs by multiplying by 2.205)
          - Height: Look for "height", "stature", "HT" (convert cm to inches by dividing by 2.54)

          IMPORTANT RULES:
          1. Return ONLY valid JSON, no other text
          2. Extract actual numbers from the PDF content
          3. If you find a value, return the number (not null)
          4. If you cannot find a value, return null
          5. Convert units as specified above
          6. For blood pressure, split into systolic and diastolic values
        

          Example response format:
          {
            "sugarLevel": 120,
            "cholesterol": 200,
            "bloodPressureSystolic": 120,
            "bloodPressureDiastolic": 80,
            "weight": 150,
            "height": 65
          }`
        },
        {
          role: "user",
          content: `Please extract health metrics from this PDF content. Here is the PDF information:

          ${pdfTextContent}
          
          IMPORTANT: If the PDF could not be parsed or contains no readable text, return all values as null. Only extract actual health metrics if you can find specific numbers in the content.
          
          Extract any health metrics you can find and return them in the specified JSON format.`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const responseContent = completion.choices[0].message.content;
    console.log('Azure OpenAI PDF extraction response:', responseContent);

    let extractedMetrics;
    try {
      extractedMetrics = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('JSON parse error for PDF extraction:', parseError);
      console.log('Response content:', responseContent);
      
      // Fallback: return empty metrics
      extractedMetrics = {
        sugarLevel: null,
        cholesterol: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        weight: null,
        height: null
      };
    }

    // Clean up the uploaded file
    fs.unlinkSync(pdfPath);

    console.log('Extracted health metrics:', extractedMetrics);

    // Check if any metrics were actually extracted
    const hasValidMetrics = Object.values(extractedMetrics).some(value => value !== null);
    
    if (!hasValidMetrics) {
      return res.json({
        success: true,
        message: 'PDF uploaded but no health metrics could be extracted. Please enter the values manually.',
        data: extractedMetrics
      });
    }

    res.json({
      success: true,
      message: 'Health metrics extracted successfully',
      data: extractedMetrics
    });

  } catch (error) {
    console.error('Error extracting health metrics from PDF:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to extract health metrics from PDF'
    });
  }
});

// Nutrition Facts API
app.post('/recipes/nutrition', async (req, res) => {
  try {
    const { recipe } = req.body;
    
    console.log('Generating nutrition facts for recipe:', recipe.title);
    
    const systemMessage = `You are a nutrition expert. Analyze the given recipe and provide accurate nutrition facts per 100 grams of the final dish.
    
    Recipe Details:
    Title: ${recipe.title}
    Type: ${recipe.type || 'Main Course'}
    Ingredients: ${recipe.ingredients.map(ing => `${ing.name} (${ing.amount})`).join(', ')}
    Instructions: ${recipe.steps.join(' ')}
    
    Calculate and provide nutrition facts for 100 grams of the final prepared dish. Consider cooking methods, water loss, and ingredient interactions.
    
    Respond with ONLY valid JSON in this exact format:
    {
      "calories": "number (kcal per 100g)",
      "protein": "number (grams per 100g)",
      "carbs": "number (grams per 100g)",
      "fats": "number (grams per 100g)",
      "fiber": "number (grams per 100g)",
      "vitamins": "string (key vitamins present)"
    }
    
    IMPORTANT: 
    - Provide realistic, scientifically accurate values
    - Round numbers to 1 decimal place
    - For vitamins, list 2-3 key vitamins (e.g., "Vitamin C, B6, Folate")
    - Consider the cooking method and ingredient proportions
    - Respond with ONLY the JSON, no additional text`;
    
    const completion = await azureOpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Analyze this recipe and provide nutrition facts per 100g: ${recipe.title}` }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    console.log('Azure OpenAI nutrition response:', completion.choices[0].message.content);
    
    try {
      const nutrition = JSON.parse(completion.choices[0].message.content);
      res.json({ success: true, nutrition });
    } catch (parseError) {
      console.error('Error parsing nutrition JSON:', parseError);
      // Fallback nutrition data
      const fallbackNutrition = {
        calories: "150-200",
        protein: "8-12",
        carbs: "20-30",
        fats: "5-8",
        fiber: "2-4",
        vitamins: "Vitamin C, B6, Folate"
      };
      res.json({ success: true, nutrition: fallbackNutrition });
    }
  } catch (error) {
    console.error('Error generating nutrition facts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate nutrition facts',
      error: error.message 
    });
  }
});

// Calculate Wasted Amount API
app.post('/analytics/calculate-wasted-amount', async (req, res) => {
  try {
    const { expiredItems } = req.body;
    
    console.log('Calculating wasted amounts for expired items:', expiredItems.length);
    
            const systemMessage = `You are a real-time pricing expert for grocery items. Calculate the current market value for expired grocery items based on real-time market data and typical grocery store pricing.
            
            For each item, provide:
            1. Current market price per unit (based on real-time grocery store prices)
            2. Total wasted amount (price × quantity)
            
            Use current 2024-2025 market pricing based on:
            - Real-time grocery store prices (Walmart, Target, Kroger, Whole Foods, etc.)
            - Item category and type
            - Seasonal availability and demand
            - Brand vs generic pricing
            - Organic vs conventional pricing
            - Regional market variations
            
            Price ranges to consider:
            - Fresh produce: $0.50-$4.00 per unit
            - Dairy products: $1.50-$6.00 per unit
            - Meat/Protein: $3.00-$12.00 per unit
            - Grains/Pantry: $0.75-$5.00 per unit
            - Beverages: $1.00-$4.00 per unit
            
            Respond with ONLY valid JSON in this exact format:
            {
              "items": [
                {
                  "productName": "item name",
                  "category": "category",
                  "quantity": number,
                  "pricePerUnit": number (in USD, current market price),
                  "totalWastedAmount": number (in USD, price × quantity)
                }
              ]
            }
            
            IMPORTANT: 
            - Use current 2024-2025 market prices
            - Round to 2 decimal places
            - Consider inflation and current economic conditions
            - Be realistic about grocery store pricing
            - Respond with ONLY the JSON, no additional text`;
    
    const completion = await azureOpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Calculate wasted amounts for these expired items: ${JSON.stringify(expiredItems)}` }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    console.log('Azure OpenAI wasted amount response:', completion.choices[0].message.content);
    
    try {
      const result = JSON.parse(completion.choices[0].message.content);
      res.json({ success: true, items: result.items });
    } catch (parseError) {
      console.error('Error parsing wasted amount JSON:', parseError);
      // Fallback calculation with category-based pricing
      const fallbackItems = expiredItems.map(item => {
        let pricePerUnit = 2.50; // Base default
        
        // Category-based pricing for fallback
        if (item.category === 'Meat' || item.category === 'Protein') {
          pricePerUnit = 6.00;
        } else if (item.category === 'Dairy') {
          pricePerUnit = 3.50;
        } else if (item.category === 'Fruits' || item.category === 'Vegetables') {
          pricePerUnit = 2.00;
        } else if (item.category === 'Grains' || item.category === 'Pantry') {
          pricePerUnit = 2.75;
        } else if (item.category === 'Beverages') {
          pricePerUnit = 2.25;
        }
        
        return {
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          pricePerUnit: pricePerUnit,
          totalWastedAmount: item.quantity * pricePerUnit
        };
      });
      res.json({ success: true, items: fallbackItems });
    }
  } catch (error) {
    console.error('Error calculating wasted amounts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate wasted amounts',
      error: error.message 
    });
  }
});


// Initial check on startup
setTimeout(() => {
  console.log('Running initial expiry check...');
  checkExpiringItems();
}, 2000);
