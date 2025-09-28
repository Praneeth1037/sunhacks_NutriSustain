// Validation utility functions

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Validate URL format
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate required field
export const isRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Validate minimum length
export const hasMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

// Validate maximum length
export const hasMaxLength = (value, maxLength) => {
  return !value || value.toString().length <= maxLength;
};

// Validate numeric range
export const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Validate positive number
export const isPositive = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Validate non-negative number
export const isNonNegative = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
};

// Validate integer
export const isInteger = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && Number.isInteger(num);
};

// Validate date format (MM/DD/YYYY)
export const isValidDateFormat = (dateString) => {
  if (!dateString) return false;
  
  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Validate future date
export const isFutureDate = (dateString) => {
  if (!isValidDateFormat(dateString)) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date > today;
};

// Validate past date
export const isPastDate = (dateString) => {
  if (!isValidDateFormat(dateString)) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
};

// Validate file type
export const isValidFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes) return false;
  return allowedTypes.includes(file.type);
};

// Validate file size
export const isValidFileSize = (file, maxSizeInMB) => {
  if (!file || !maxSizeInMB) return false;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// Validate grocery item
export const validateGroceryItem = (item) => {
  const errors = [];
  
  if (!isRequired(item.productName)) {
    errors.push('Product name is required');
  }
  
  if (!isValidDateFormat(item.expiryDate)) {
    errors.push('Valid expiry date is required (MM/DD/YYYY)');
  }
  
  if (!isPositive(item.quantity)) {
    errors.push('Quantity must be a positive number');
  }
  
  if (!isRequired(item.category)) {
    errors.push('Category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate health metrics
export const validateHealthMetrics = (metrics) => {
  const errors = [];
  
  if (metrics.sugarLevel && !isInRange(metrics.sugarLevel, 0, 500)) {
    errors.push('Blood sugar level must be between 0 and 500 mg/dL');
  }
  
  if (metrics.cholesterol && !isInRange(metrics.cholesterol, 0, 1000)) {
    errors.push('Cholesterol must be between 0 and 1000 mg/dL');
  }
  
  if (metrics.bloodPressureSystolic && !isInRange(metrics.bloodPressureSystolic, 50, 250)) {
    errors.push('Systolic blood pressure must be between 50 and 250 mmHg');
  }
  
  if (metrics.bloodPressureDiastolic && !isInRange(metrics.bloodPressureDiastolic, 30, 150)) {
    errors.push('Diastolic blood pressure must be between 30 and 150 mmHg');
  }
  
  if (metrics.weight && !isInRange(metrics.weight, 20, 500)) {
    errors.push('Weight must be between 20 and 500 lbs');
  }
  
  if (metrics.height && !isInRange(metrics.height, 36, 96)) {
    errors.push('Height must be between 36 and 96 inches');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate recipe search query
export const validateRecipeQuery = (query) => {
  const errors = [];
  
  if (!isRequired(query)) {
    errors.push('Recipe search query is required');
  }
  
  if (!hasMinLength(query, 2)) {
    errors.push('Recipe search query must be at least 2 characters long');
  }
  
  if (!hasMaxLength(query, 100)) {
    errors.push('Recipe search query must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Format validation error message
export const formatValidationError = (field, error) => {
  return `${field}: ${error}`;
};

// Get validation error for field
export const getFieldError = (errors, field) => {
  return errors.find(error => error.field === field)?.message || '';
};

// Check if form has errors
export const hasFormErrors = (errors) => {
  return Object.values(errors).some(error => error !== '');
};

// Clear form errors
export const clearFormErrors = (setErrors) => {
  setErrors({});
};
