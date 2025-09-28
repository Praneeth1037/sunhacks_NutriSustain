import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroceryList.css';

const GroceryList = ({ expiringItems = [] }) => {
  const [groceryItems, setGroceryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroceryItems();
  }, []);

  const fetchGroceryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/groceryItems');
      setGroceryItems(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching grocery items:', error);
      setError('Failed to load grocery items');
    } finally {
      setLoading(false);
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

  const isExpired = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const isExpiringSoon = (itemId) => {
    return expiringItems.some(item => item.id === itemId);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkCompleted = async (itemId) => {
    try {
      await axios.put(`http://localhost:3001/groceryItems/${itemId}`, { 
        status: 'completed',
        completedDate: new Date().toISOString()
      });
      
      // Remove the item from the list
      setGroceryItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error marking item as completed:', error);
      setError('Failed to mark item as completed');
    }
  };

  const sortByExpiryDate = (items) => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.expiryDate);
      const dateB = new Date(b.expiryDate);
      return dateA - dateB;
    });
  };

  const activeItems = groceryItems.filter(item => !isExpired(item.expiryDate) && item.status !== 'completed');
  const expiredItems = groceryItems.filter(item => isExpired(item.expiryDate) && item.status !== 'completed');

  const sortedActiveItems = sortByExpiryDate(activeItems);
  const sortedExpiredItems = sortByExpiryDate(expiredItems);

  if (loading) {
    return (
      <div className="grocery-list">
        <h3>Grocery List</h3>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="grocery-list">
      <h3>Grocery List</h3>
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="list-container">
        {/* Active Items */}
        {sortedActiveItems.length > 0 && (
          <div className="section">
            <h4 className="section-title">Active Items</h4>
            <div className="items-list">
              {sortedActiveItems.map(item => {
                const expiringSoon = isExpiringSoon(item.id);
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                return (
                  <div 
                    key={item.id} 
                    className={`grocery-item active ${expiringSoon ? 'expiring-soon' : ''}`}
                  >
                    <div className="item-info">
                      <span className="product-name">{item.productName}</span>
                      <span className="expiry-date">
                        Expires: {formatDate(item.expiryDate)}
                        {expiringSoon && (
                          <span className={`days-left ${daysLeft <= 1 ? 'urgent' : daysLeft <= 2 ? 'warning' : 'normal'}`}>
                            ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                          </span>
                        )}
                      </span>
                    </div>
                    <button 
                      className="complete-btn"
                      onClick={() => handleMarkCompleted(item.id)}
                      title="Mark as completed"
                    >
                      ✓
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expired Items */}
        {sortedExpiredItems.length > 0 && (
          <div className="section">
            <h4 className="section-title expired">Expired Items</h4>
            <div className="items-list">
              {sortedExpiredItems.map(item => (
                <div key={item.id} className="grocery-item expired">
                  <div className="item-info">
                    <span className="product-name">{item.productName}</span>
                    <span className="expiry-date">Expired: {formatDate(item.expiryDate)}</span>
                  </div>
                  <button 
                    className="complete-btn"
                    onClick={() => handleMarkCompleted(item.id)}
                    title="Mark as completed"
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedActiveItems.length === 0 && sortedExpiredItems.length === 0 && (
          <div className="empty-state">
            <p>No grocery items found.</p>
            <p>Add items using the form above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
