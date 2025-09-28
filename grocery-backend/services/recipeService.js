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

// Generate recipe using Azure OpenAI
async function generateAzureOpenAIRecipe(query, availableItems) {
  if (!azureOpenAI) {
    throw new Error('Azure OpenAI not configured');
  }
  
  const availableIngredients = availableItems.map(item => 
    `${item.productName} (${item.quantity} ${item.category})`
  ).join(', ');
  
  const systemMessage = `You are a professional chef and nutritionist. Create a detailed recipe based on the user's query and available ingredients.
  
  Available Ingredients: ${availableIngredients}
  
  Create a recipe that:
  1. Uses the available ingredients as much as possible
  2. Is practical and easy to follow
  3. Includes detailed cooking instructions
  4. Provides nutritional information
  5. Suggests substitutions if needed
  
  Respond with ONLY valid JSON in this exact format:
  {
    "title": "Recipe Name",
    "type": "Main Course/Appetizer/Dessert/etc",
    "ingredients": [
      {"name": "Ingredient Name", "amount": "Quantity", "expiring": true/false}
    ],
    "steps": ["Step 1", "Step 2", "Step 3"],
    "tips": "Helpful cooking tips"
  }
  
  IMPORTANT: 
  - Mark ingredients as "expiring": true if they are in the available items list
  - Use realistic quantities and measurements
  - Provide 4-6 detailed cooking steps
  - Respond with ONLY the JSON, no additional text`;
  
  const completion = await azureOpenAI.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Create a recipe for: ${query}` }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });
  
  console.log('Azure OpenAI raw response:', completion.choices[0].message.content);
  
  try {
    const recipe = JSON.parse(completion.choices[0].message.content);
    console.log('Azure OpenAI recipe generated successfully:', recipe.title);
    return recipe;
  } catch (parseError) {
    console.error('Error parsing Azure OpenAI response:', parseError);
    throw new Error('Failed to parse recipe response');
  }
}

// Generate fallback recipe
function generateRecipeFromQuery(query, availableItems) {
  const availableIngredients = availableItems.map(item => item.productName).join(', ');
  
  const recipes = {
    'chicken': {
      title: 'Simple Chicken Stir-Fry',
      type: 'Main Course',
      ingredients: [
        { name: 'Chicken', amount: '1 lb, diced', expiring: availableItems.some(item => item.productName.toLowerCase().includes('chicken')) },
        { name: 'Vegetables', amount: '2 cups mixed', expiring: availableItems.some(item => item.category === 'Vegetables') },
        { name: 'Oil', amount: '2 tbsp', expiring: false },
        { name: 'Soy Sauce', amount: '3 tbsp', expiring: false }
      ],
      steps: [
        'Heat oil in a large pan over medium-high heat',
        'Add diced chicken and cook until golden brown',
        'Add vegetables and stir-fry for 3-4 minutes',
        'Add soy sauce and cook for another 2 minutes',
        'Serve hot over rice or noodles'
      ],
      tips: 'Cut chicken into uniform pieces for even cooking'
    },
    'pasta': {
      title: 'Quick Pasta Delight',
      type: 'Main Course',
      ingredients: [
        { name: 'Pasta', amount: '8 oz', expiring: availableItems.some(item => item.productName.toLowerCase().includes('pasta')) },
        { name: 'Tomatoes', amount: '2 medium, diced', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Garlic', amount: '3 cloves, minced', expiring: availableItems.some(item => item.productName.toLowerCase().includes('garlic')) },
        { name: 'Olive Oil', amount: '3 tbsp', expiring: false }
      ],
      steps: [
        'Cook pasta according to package instructions',
        'Heat olive oil in a pan and sauté garlic',
        'Add diced tomatoes and cook until soft',
        'Toss cooked pasta with the sauce',
        'Season with salt and pepper to taste'
      ],
      tips: 'Reserve some pasta water to help the sauce stick better'
    },
    'salad': {
      title: 'Fresh Garden Salad',
      type: 'Appetizer',
      ingredients: [
        { name: 'Lettuce', amount: '1 head, chopped', expiring: availableItems.some(item => item.productName.toLowerCase().includes('lettuce')) },
        { name: 'Tomatoes', amount: '2 medium, sliced', expiring: availableItems.some(item => item.productName.toLowerCase().includes('tomato')) },
        { name: 'Cucumber', amount: '1 medium, sliced', expiring: availableItems.some(item => item.productName.toLowerCase().includes('cucumber')) },
        { name: 'Olive Oil', amount: '2 tbsp', expiring: false },
        { name: 'Lemon Juice', amount: '1 tbsp', expiring: false }
      ],
      steps: [
        'Wash and chop all vegetables',
        'Combine lettuce, tomatoes, and cucumber in a bowl',
        'Whisk together olive oil and lemon juice',
        'Drizzle dressing over salad and toss gently',
        'Serve immediately'
      ],
      tips: 'Add dressing just before serving to keep vegetables crisp'
    }
  };
  
  // Find best matching recipe
  const queryLower = query.toLowerCase();
  let bestMatch = recipes['chicken']; // default
  
  for (const [key, recipe] of Object.entries(recipes)) {
    if (queryLower.includes(key)) {
      bestMatch = recipe;
      break;
    }
  }
  
  return bestMatch;
}

module.exports = {
  generateAzureOpenAIRecipe,
  generateRecipeFromQuery
};
