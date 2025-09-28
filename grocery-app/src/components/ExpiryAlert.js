import React, { useState, useEffect } from 'react';
import './ExpiryAlert.css';
import axios from 'axios';

const ExpiryAlert = ({ onNavigateToRecipes }) => {
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      const response = await axios.get('http://localhost:3001/groceryItems');
      const allItems = response.data;
      
      // Filter items expiring within 5 days
      const today = new Date();
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      
      const expiring = allItems.filter(item => {
        if (item.status !== 'active') return false;
        
        const expiryDate = new Date(item.expiryDate);
        return expiryDate <= fiveDaysFromNow && expiryDate >= today;
      });
      
      setExpiringItems(expiring);
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBackgroundColor = (daysLeft) => {
    if (daysLeft <= 1) {
      return 'rgba(239, 68, 68, 0.3)'; // Red for urgent
    } else if (daysLeft <= 3) {
      return 'rgba(245, 158, 11, 0.3)'; // Orange for warning
    } else {
      return 'rgba(34, 197, 94, 0.3)'; // Green for normal
    }
  };

  const getBorderColor = (daysLeft) => {
    if (daysLeft <= 1) {
      return 'rgba(239, 68, 68, 0.8)'; // Red border for urgent
    } else if (daysLeft <= 3) {
      return 'rgba(245, 158, 11, 0.8)'; // Orange border for warning
    } else {
      return 'rgba(34, 197, 94, 0.8)'; // Green border for normal
    }
  };

  const handleGetRecipes = () => {
    // Navigate to recipes page and pass expiring items
    onNavigateToRecipes(expiringItems);
  };

  const getAlertTitle = () => {
    if (expiringItems.length === 0) return "✅ All Good!";
    
    const urgentCount = expiringItems.filter(item => {
      const daysLeft = getDaysUntilExpiry(item.expiryDate);
      return daysLeft <= 1;
    }).length;
    
    const warningCount = expiringItems.filter(item => {
      const daysLeft = getDaysUntilExpiry(item.expiryDate);
      return daysLeft <= 3 && daysLeft > 1;
    }).length;
    
    if (urgentCount > 0) {
      return "🚨 URGENT ALERT";
    } else if (warningCount > 0) {
      return "⚠️ WARNING ALERT";
    } else {
      return "📢 EXPIRY ALERT";
    }
  };

  if (loading) {
    return (
      <div className="expiry-alert">
        <h3>🔄 Loading...</h3>
      </div>
    );
  }

  if (expiringItems.length === 0) {
    return (
      <div className="expiry-alert">
        <div className="alert-header">
          <h3 className="alert-title">{getAlertTitle()}</h3>
          <p>No items expiring within 5 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expiry-alert">
      <div className="alert-header">
        <h3 className="alert-title">{getAlertTitle()}</h3>
        <p>{expiringItems.length} item{expiringItems.length !== 1 ? 's' : ''} expiring soon</p>
      </div>
      
      <div className="expiring-items-list">
        {expiringItems.map((item, index) => {
          const daysLeft = getDaysUntilExpiry(item.expiryDate);
          const backgroundColor = getBackgroundColor(daysLeft);
          const borderColor = getBorderColor(daysLeft);
          
          return (
            <div 
              key={index} 
              className="expiring-item"
              style={{
                backgroundColor: backgroundColor,
                borderColor: borderColor
              }}
            >
              <div className="item-info">
                <span className="item-name">{item.productName}</span>
                <span className={`days-left ${daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal'}`}>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                </span>
              </div>
              <div className="item-category">{item.category}</div>
            </div>
          );
        })}
      </div>
      
      <button 
        className="get-recipes-btn"
        onClick={handleGetRecipes}
      >
        🍳 Get AI Recipes
      </button>
    </div>
  );
};

export default ExpiryAlert;
