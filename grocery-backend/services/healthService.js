const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const fs = require('fs');

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

// Generate health risk analysis
async function generateHealthAnalysis(healthMetrics, groceryItems) {
  if (!azureOpenAI) {
    return generateFallbackAnalysis(healthMetrics, groceryItems);
  }
  
  const activeItems = groceryItems.filter(item => item.status === 'active');
  const availableItems = activeItems.map(item => item.productName).join(', ');
  
  const systemMessage = `You are a medical AI assistant specializing in nutrition and health risk assessment. Analyze the provided health metrics and grocery inventory to provide personalized health recommendations.
  
  Health Metrics:
  - Blood Sugar: ${healthMetrics.sugarLevel} mg/dL
  - Cholesterol: ${healthMetrics.cholesterol} mg/dL
  - Blood Pressure: ${healthMetrics.bloodPressureSystolic}/${healthMetrics.bloodPressureDiastolic} mmHg
  - Weight: ${healthMetrics.weight} lbs
  - Height: ${healthMetrics.height} inches
  
  Available Grocery Items: ${availableItems}
  
  Provide a comprehensive health risk analysis with:
  1. Risk level assessment (Low/Medium/High)
  2. Specific health risks identified
  3. General health recommendations
  4. Items to avoid from the grocery list (2-3 items with reasons)
  5. Better alternatives (2-3 items, can be outside the database, with reasons)
  
  Respond with ONLY valid JSON in this exact format:
  {
    "riskLevel": "Low/Medium/High",
    "risks": ["Risk 1", "Risk 2", "Risk 3"],
    "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
    "avoidItems": ["Item 1: Reason", "Item 2: Reason", "Item 3: Reason"],
    "preferredItems": ["Item 1: Reason", "Item 2: Reason", "Item 3: Reason"]
  }
  
  IMPORTANT: 
  - Base recommendations on medical guidelines
  - Provide specific, actionable advice
  - Consider the user's current health metrics
  - Respond with ONLY the JSON, no additional text`;
  
  try {
    const completion = await azureOpenAI.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: 'Analyze my health data and provide recommendations based on my grocery inventory.' }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    console.log('Azure OpenAI response:', completion.choices[0].message.content);
    
    try {
      const analysis = JSON.parse(completion.choices[0].message.content);
      return analysis;
    } catch (parseError) {
      console.error('Error parsing health analysis JSON:', parseError);
      return generateFallbackAnalysis(healthMetrics, groceryItems);
    }
  } catch (error) {
    console.error('Error calling Azure OpenAI for health analysis:', error);
    return generateFallbackAnalysis(healthMetrics, groceryItems);
  }
}

// Fallback health analysis
function generateFallbackAnalysis(healthMetrics, groceryItems) {
  const activeItems = groceryItems.filter(item => item.status === 'active');
  
  // Basic risk assessment
  let riskLevel = 'Low';
  const risks = [];
  const recommendations = [];
  
  if (healthMetrics.sugarLevel > 126) {
    riskLevel = 'High';
    risks.push('High blood sugar levels detected');
    recommendations.push('Monitor blood sugar levels regularly');
  } else if (healthMetrics.sugarLevel > 100) {
    riskLevel = 'Medium';
    risks.push('Elevated blood sugar levels');
    recommendations.push('Consider reducing sugar intake');
  }
  
  if (healthMetrics.cholesterol > 200) {
    riskLevel = 'High';
    risks.push('High cholesterol levels');
    recommendations.push('Limit saturated fats and increase fiber intake');
  }
  
  if (healthMetrics.bloodPressureSystolic > 140 || healthMetrics.bloodPressureDiastolic > 90) {
    riskLevel = 'High';
    risks.push('High blood pressure');
    recommendations.push('Reduce sodium intake and increase physical activity');
  }
  
  // Identify items to avoid
  const avoidItems = [];
  const preferredItems = [];
  
  // High sugar items
  const highSugarItems = activeItems.filter(item => 
    item.productName.toLowerCase().includes('juice') ||
    item.productName.toLowerCase().includes('soda') ||
    item.productName.toLowerCase().includes('candy')
  );
  
  highSugarItems.slice(0, 2).forEach(item => {
    avoidItems.push(`${item.productName}: High sugar content can affect blood sugar levels`);
  });
  
  // High fat items
  const highFatItems = activeItems.filter(item => 
    item.productName.toLowerCase().includes('butter') ||
    item.productName.toLowerCase().includes('cheese') ||
    item.productName.toLowerCase().includes('cream')
  );
  
  highFatItems.slice(0, 1).forEach(item => {
    avoidItems.push(`${item.productName}: High saturated fat content can affect cholesterol levels`);
  });
  
  // Preferred items
  preferredItems.push('Leafy Greens: Low in calories and high in nutrients');
  preferredItems.push('Whole Grains: High in fiber, helps manage blood sugar');
  preferredItems.push('Lean Proteins: Essential for muscle health and satiety');
  
  return {
    riskLevel,
    risks,
    recommendations,
    avoidItems: avoidItems.slice(0, 3),
    preferredItems: preferredItems.slice(0, 3)
  };
}

// Extract health metrics from PDF
async function extractHealthMetricsFromPDF(pdfPath) {
  if (!azureOpenAI) {
    throw new Error('Azure OpenAI not configured');
  }
  
  let pdfTextContent = '';
  let extractionMethod = 'unknown';
  
  try {
    // First attempt: Standard PDF parsing
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer, { max: 0, version: 'v1.10.100' });
    pdfTextContent = pdfData.text;
    extractionMethod = 'pdf-parse standard';
  } catch (error) {
    console.log('PDF parsing failed, using fallback approach');
    
    try {
      // Second attempt: PDF parsing with different options
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(pdfBuffer, { max: 10, version: 'v1.10.100' });
      pdfTextContent = pdfData.text;
      extractionMethod = 'pdf-parse fallback';
    } catch (secondError) {
      console.log('Error parsing PDF:', secondError);
      
      try {
        // Third attempt: Raw text extraction
        const pdfBuffer = fs.readFileSync(pdfPath);
        const rawText = pdfBuffer.toString('utf8');
        
        // Look for common health metrics patterns
        const glucosePattern = /glucose[:\s]*(\d+(?:\.\d+)?)\s*mg\/dl/i;
        const cholesterolPattern = /cholesterol[:\s]*(\d+(?:\.\d+)?)\s*mg\/dl/i;
        const bpPattern = /blood\s*pressure[:\s]*(\d+)\/(\d+)\s*mmhg/i;
        const weightPattern = /weight[:\s]*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)/i;
        const heightPattern = /height[:\s]*(\d+(?:\.\d+)?)\s*(?:inches?|cm)/i;
        
        const glucoseMatch = rawText.match(glucosePattern);
        const cholesterolMatch = rawText.match(cholesterolPattern);
        const bpMatch = rawText.match(bpPattern);
        const weightMatch = rawText.match(weightPattern);
        const heightMatch = rawText.match(heightPattern);
        
        if (glucoseMatch || cholesterolMatch || bpMatch || weightMatch || heightMatch) {
          pdfTextContent = `Health Report: Glucose: ${glucoseMatch ? glucoseMatch[1] : 'N/A'}, Cholesterol: ${cholesterolMatch ? cholesterolMatch[1] : 'N/A'}, Blood Pressure: ${bpMatch ? `${bpMatch[1]}/${bpMatch[2]}` : 'N/A'}, Weight: ${weightMatch ? weightMatch[1] : 'N/A'}, Height: ${heightMatch ? heightMatch[1] : 'N/A'}`;
          extractionMethod = 'regex pattern matching';
        } else {
          pdfTextContent = 'PDF contains health data but specific metrics could not be extracted automatically.';
          extractionMethod = 'generic health data';
        }
      } catch (thirdError) {
        console.log('All PDF extraction methods failed');
        pdfTextContent = 'Unable to extract text from PDF. The file may be corrupted, password-protected, or in an unsupported format.';
        extractionMethod = 'failed';
      }
    }
  }
  
  console.log(`PDF extraction method used: ${extractionMethod}`);
  
  const systemMessage = `You are a medical data extraction specialist. Extract health metrics from the provided text content.
  
  Text Content: ${pdfTextContent}
  
  Look for and extract the following health metrics:
  - Blood sugar/glucose levels (mg/dL)
  - Cholesterol levels (mg/dL)
  - Blood pressure (systolic/diastolic in mmHg)
  - Weight (convert kg to lbs if needed)
  - Height (convert cm to inches if needed)
  
  Respond with ONLY valid JSON in this exact format:
  {
    "sugarLevel": number or null,
    "cholesterol": number or null,
    "bloodPressureSystolic": number or null,
    "bloodPressureDiastolic": number or null,
    "weight": number or null,
    "height": number or null
  }
  
  IMPORTANT: 
  - Convert units: 1 kg = 2.2 lbs, 1 cm = 0.39 inches
  - Return null for any metric not found
  - Use only numeric values
  - Respond with ONLY the JSON, no additional text`;
  
  try {
    const completion = await azureOpenAI.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: 'Extract health metrics from this medical report text.' }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    
    console.log('Azure OpenAI PDF extraction response:', completion.choices[0].message.content);
    
    try {
      const extractedMetrics = JSON.parse(completion.choices[0].message.content);
      console.log('Extracted health metrics:', extractedMetrics);
      return extractedMetrics;
    } catch (parseError) {
      console.error('Error parsing extracted metrics JSON:', parseError);
      return {
        sugarLevel: null,
        cholesterol: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        weight: null,
        height: null
      };
    }
  } catch (error) {
    console.error('Error calling Azure OpenAI for PDF extraction:', error);
    return {
      sugarLevel: null,
      cholesterol: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      weight: null,
      height: null
    };
  }
}

// Generate health facts
async function generateHealthFacts(topic, count = 5) {
  if (!azureOpenAI) {
    return getFallbackHealthFacts();
  }
  
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
  
  try {
    const completion = await azureOpenAI.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
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
      return facts;
    } catch (parseError) {
      console.error('Error parsing health facts JSON:', parseError);
      return getFallbackHealthFacts();
    }
  } catch (error) {
    console.error('Error generating health facts:', error);
    return getFallbackHealthFacts();
  }
}

// Fallback health facts
function getFallbackHealthFacts() {
  return [
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
}

module.exports = {
  generateHealthAnalysis,
  extractHealthMetricsFromPDF,
  generateHealthFacts
};
