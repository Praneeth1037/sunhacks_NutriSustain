const express = require('express');
const GroceryItem = require('../models/GroceryItem');
const { generateAzureOpenAIRecipe, generateRecipeFromQuery } = require('../services/recipeService');
const router = express.Router();

// Recipe search endpoint
router.post('/search', async (req, res) => {
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
router.post('/suggestions', async (req, res) => {
  const { expiringItems } = req.body;
  
  if (!expiringItems || expiringItems.length === 0) {
    return res.status(400).json({ error: 'Expiring items are required' });
  }

  try {
    const activeItems = await GroceryItem.find({ status: 'active' });
    const availableItems = [...activeItems, ...expiringItems];
    
    // Generate suggestions for expiring items
    const suggestions = [];
    
    for (const item of expiringItems) {
      try {
        const recipe = await generateAzureOpenAIRecipe(
          `recipe using ${item.productName}`, 
          availableItems
        );
        suggestions.push(recipe);
      } catch (aiError) {
        console.log(`Failed to generate recipe for ${item.productName}:`, aiError.message);
        // Add fallback recipe
        const fallbackRecipe = generateRecipeFromQuery(
          `recipe using ${item.productName}`, 
          availableItems
        );
        suggestions.push(fallbackRecipe);
      }
    }
    
    res.json({
      success: true,
      recipes: suggestions,
      expiringItems: expiringItems,
      availableIngredients: availableItems.map(item => item.productName)
    });
  } catch (error) {
    console.error('Error generating recipe suggestions:', error);
    res.status(500).json({ error: 'Failed to generate recipe suggestions' });
  }
});

// Nutrition facts endpoint
router.post('/nutrition', async (req, res) => {
  try {
    const { recipe } = req.body;
    
    console.log('Generating nutrition facts for recipe:', recipe.title);
    
    const { generateNutritionFacts } = require('../services/nutritionService');
    const nutrition = await generateNutritionFacts(recipe);
    
    res.json({ success: true, nutrition });
  } catch (error) {
    console.error('Error generating nutrition facts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate nutrition facts',
      error: error.message 
    });
  }
});

module.exports = router;
