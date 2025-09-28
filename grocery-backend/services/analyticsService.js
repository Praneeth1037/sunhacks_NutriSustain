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

// Calculate wasted amounts for expired items
async function calculateWastedAmounts(expiredItems) {
  if (!azureOpenAI) {
    return getFallbackWastedAmounts(expiredItems);
  }
  
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
  
  try {
    const completion = await azureOpenAI.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
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
      return result.items;
    } catch (parseError) {
      console.error('Error parsing wasted amount JSON:', parseError);
      return getFallbackWastedAmounts(expiredItems);
    }
  } catch (error) {
    console.error('Error calculating wasted amounts:', error);
    return getFallbackWastedAmounts(expiredItems);
  }
}

// Fallback wasted amount calculation
function getFallbackWastedAmounts(expiredItems) {
  return expiredItems.map(item => {
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
}

module.exports = {
  calculateWastedAmounts
};
