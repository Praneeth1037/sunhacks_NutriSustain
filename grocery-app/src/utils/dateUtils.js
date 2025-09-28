// Date utility functions

// Format date for display
export const formatDate = (date, format = 'MM/DD/YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MMM DD, YYYY':
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
      });
    default:
      return d.toLocaleDateString();
  }
};

// Calculate days until expiry
export const calculateDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 0;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Check if date is expired
export const isDateExpired = (date) => {
  if (!date) return false;
  
  const today = new Date();
  const targetDate = new Date(date);
  
  return targetDate < today;
};

// Get expiry status
export const getExpiryStatus = (expiryDate) => {
  const daysLeft = calculateDaysUntilExpiry(expiryDate);
  
  if (daysLeft < 0) {
    return { status: 'expired', daysLeft: 0, urgency: 'expired' };
  } else if (daysLeft <= 1) {
    return { status: 'urgent', daysLeft, urgency: 'high' };
  } else if (daysLeft <= 3) {
    return { status: 'warning', daysLeft, urgency: 'medium' };
  } else if (daysLeft <= 7) {
    return { status: 'notice', daysLeft, urgency: 'low' };
  } else {
    return { status: 'fresh', daysLeft, urgency: 'none' };
  }
};

// Format time for display
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Get relative time (e.g., "2 days ago", "in 3 hours")
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return `${absDays} day${absDays !== 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else if (diffHours < 0) {
    const absHours = Math.abs(diffHours);
    return `${absHours} hour${absHours !== 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffMinutes < 0) {
    const absMinutes = Math.abs(diffMinutes);
    return `${absMinutes} minute${absMinutes !== 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
};

// Validate date format
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Parse date from various formats
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Handle MM/DD/YYYY format
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  
  // Handle YYYY-MM-DD format
  if (dateString.includes('-')) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try parsing as-is
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Get start of day
export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get end of day
export const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Get start of month
export const getStartOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get end of month
export const getEndOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};
