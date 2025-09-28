const { OpenAI } = require('openai');

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

// Generate nutrition facts for a recipe
async function generateNutritionFacts(recipe) {
  if (!azureOpenAI) {
    return getFallbackNutrition(recipe);
  }
  
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
  
  try {
    const completion = await azureOpenAI.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
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
      return nutrition;
    } catch (parseError) {
      console.error('Error parsing nutrition JSON:', parseError);
      return getFallbackNutrition(recipe);
    }
  } catch (error) {
    console.error('Error generating nutrition facts:', error);
    return getFallbackNutrition(recipe);
  }
}

// Fallback nutrition data
function getFallbackNutrition(recipe) {
  // Basic nutrition estimation based on recipe type
  let baseNutrition = {
    calories: "150-200",
    protein: "8-12",
    carbs: "20-30",
    fats: "5-8",
    fiber: "2-4",
    vitamins: "Vitamin C, B6, Folate"
  };
  
  // Adjust based on recipe type
  if (recipe.type && recipe.type.toLowerCase().includes('dessert')) {
    baseNutrition = {
      calories: "300-400",
      protein: "4-6",
      carbs: "45-60",
      fats: "12-18",
      fiber: "1-2",
      vitamins: "Vitamin A, C"
    };
  } else if (recipe.type && recipe.type.toLowerCase().includes('salad')) {
    baseNutrition = {
      calories: "80-120",
      protein: "3-5",
      carbs: "10-15",
      fats: "4-6",
      fiber: "3-5",
      vitamins: "Vitamin A, C, K"
    };
  } else if (recipe.type && recipe.type.toLowerCase().includes('soup')) {
    baseNutrition = {
      calories: "100-150",
      protein: "6-10",
      carbs: "15-25",
      fats: "3-6",
      fiber: "2-4",
      vitamins: "Vitamin A, C, B6"
    };
  }
  
  return baseNutrition;
}

module.exports = {
  generateNutritionFacts
};
