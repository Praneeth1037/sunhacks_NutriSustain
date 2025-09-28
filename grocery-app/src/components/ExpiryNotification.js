import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExpiryNotification.css';

const ExpiryNotification = ({ onExpiringItemsUpdate }) => {
  const [expiringItems, setExpiringItems] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      const response = await axios.get('http://localhost:3001/groceryItems/expiring');
      const items = response.data;
      setExpiringItems(items);
      
      if (items.length > 0) {
        setShowNotification(true);
        onExpiringItemsUpdate(items);
      }
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowNotification(false);
    }, 300);
  };

  const handleDismiss = () => {
    handleClose();
    // Store dismissal in localStorage to avoid showing again today
    const today = new Date().toDateString();
    localStorage.setItem('expiryNotificationDismissed', today);
  };

  // Check if notification was dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem('expiryNotificationDismissed');
    const today = new Date().toDateString();
    
    if (dismissedDate === today) {
      setShowNotification(false);
    }
  }, []);

  if (!showNotification || expiringItems.length === 0) {
    return null;
  }

  return (
    <div className={`expiry-notification ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="notification-content">
        <div className="notification-header">
          <div className="notification-icon">⚠️</div>
          <div className="notification-title">
            <h4>Items Expiring Soon!</h4>
            <p>{expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring within 3 days</p>
          </div>
          <button className="close-btn" onClick={handleDismiss}>×</button>
        </div>
        
        <div className="expiring-items-list">
          {expiringItems.map(item => {
            const daysLeft = getDaysUntilExpiry(item.expiryDate);
            return (
              <div key={item.id} className="expiring-item">
                <div className="item-details">
                  <span className="product-name">{item.productName}</span>
                  <span className="expiry-info">
                    Expires: {formatDate(item.expiryDate)} 
                    <span className={`days-left ${daysLeft <= 1 ? 'urgent' : daysLeft <= 2 ? 'warning' : 'normal'}`}>
                      ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="notification-actions">
          <button className="view-list-btn" onClick={handleClose}>
            View in List
          </button>
          <button className="dismiss-btn" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryNotification;
