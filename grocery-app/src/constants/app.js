// App Configuration
export const APP_CONFIG = {
  NAME: 'NutriSustain',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Grocery Management with AI'
};

// Grocery Categories
export const GROCERY_CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Meat',
  'Dairy',
  'Grains',
  'Beverages',
  'Pantry',
  'Frozen',
  'Other'
];

// Item Status
export const ITEM_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  COMPLETED: 'completed'
};

// Expiry Alerts
export const EXPIRY_ALERTS = {
  URGENT: { days: 1, color: '#ef4444', label: 'URGENT' },
  WARNING: { days: 3, color: '#f59e0b', label: 'WARNING' },
  NOTICE: { days: 7, color: '#3b82f6', label: 'NOTICE' }
};

// Health Metrics
export const HEALTH_METRICS = {
  SUGAR_LEVEL: { min: 0, max: 500, unit: 'mg/dL' },
  CHOLESTEROL: { min: 0, max: 1000, unit: 'mg/dL' },
  BLOOD_PRESSURE_SYSTOLIC: { min: 50, max: 250, unit: 'mmHg' },
  BLOOD_PRESSURE_DIASTOLIC: { min: 30, max: 150, unit: 'mmHg' },
  WEIGHT: { min: 20, max: 500, unit: 'lbs' },
  HEIGHT: { min: 36, max: 96, unit: 'inches' }
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: { color: '#10b981', label: 'Low Risk' },
  MEDIUM: { color: '#f59e0b', label: 'Medium Risk' },
  HIGH: { color: '#ef4444', label: 'High Risk' }
};

// Navigation Sections
export const NAVIGATION_SECTIONS = {
  HOME: 'home',
  GROCERY: 'grocery',
  RECIPES: 'recipes',
  HEALTH: 'health',
  ANALYTICS: 'analytics',
  WASTED: 'wasted'
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf']
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/DD/YYYY',
  API: 'YYYY-MM-DD',
  LOCALE: 'en-US'
};

// Animation Durations
export const ANIMATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
  ORANGE: '#f97316'
};

// Responsive Breakpoints
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE: 1200
};
