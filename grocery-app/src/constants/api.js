// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  // Grocery
  GROCERY_ITEMS: '/groceryItems',
  EXPIRING_ITEMS: '/groceryItems/expiring',
  
  // Recipes
  RECIPE_SEARCH: '/recipes/search',
  RECIPE_SUGGESTIONS: '/recipes/suggestions',
  NUTRITION_FACTS: '/recipes/nutrition',
  
  // Health
  HEALTH_METRICS: '/health-metrics',
  HEALTH_UPDATE: '/health-metrics/update',
  HEALTH_RISK_ANALYSIS: '/health-metrics/risk-analysis',
  HEALTH_PDF_EXTRACT: '/health-metrics/extract-pdf',
  HEALTH_FACTS: '/health-metrics/facts',
  
  // Analytics
  ANALYTICS: '/analytics',
  WASTED_AMOUNTS: '/analytics/calculate-wasted-amount',
  
  // System
  HEALTH_CHECK: '/health'
};

// WebSocket Configuration
export const WS_CONFIG = {
  URL: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5
};

// Request Timeouts
export const REQUEST_TIMEOUTS = {
  DEFAULT: 10000,
  UPLOAD: 30000,
  AI_GENERATION: 60000
};
