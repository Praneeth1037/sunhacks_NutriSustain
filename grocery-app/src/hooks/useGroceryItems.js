import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { ITEM_STATUS } from '../constants/app';

export const useGroceryItems = () => {
  const [groceryItems, setGroceryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all grocery items
  const fetchGroceryItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GROCERY_ITEMS}`);
      setGroceryItems(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch grocery items');
      console.error('Error fetching grocery items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new grocery item
  const addGroceryItem = useCallback(async (itemData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.GROCERY_ITEMS}`, itemData);
      setGroceryItems(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to add grocery item';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update grocery item
  const updateGroceryItem = useCallback(async (id, itemData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.GROCERY_ITEMS}/${id}`, itemData);
      setGroceryItems(prev => 
        prev.map(item => item._id === id ? response.data : item)
      );
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update grocery item';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete grocery item
  const deleteGroceryItem = useCallback(async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.GROCERY_ITEMS}/${id}`);
      setGroceryItems(prev => prev.filter(item => item._id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete grocery item';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get items by status
  const getItemsByStatus = useCallback((status) => {
    return groceryItems.filter(item => item.status === status);
  }, [groceryItems]);

  // Get expiring items
  const getExpiringItems = useCallback((days = 5) => {
    const today = new Date();
    const targetDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return groceryItems.filter(item => {
      if (item.status !== ITEM_STATUS.ACTIVE) return false;
      
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate <= targetDate;
    });
  }, [groceryItems]);

  // Calculate days until expiry
  const calculateDaysUntilExpiry = useCallback((expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Check if item is expired
  const isItemExpired = useCallback((expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  }, []);

  // Get expiry status
  const getExpiryStatus = useCallback((expiryDate) => {
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
  }, [calculateDaysUntilExpiry]);

  // Fetch items on mount
  useEffect(() => {
    fetchGroceryItems();
  }, [fetchGroceryItems]);

  return {
    // State
    groceryItems,
    loading,
    error,
    
    // Actions
    fetchGroceryItems,
    addGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    
    // Utilities
    getItemsByStatus,
    getExpiringItems,
    calculateDaysUntilExpiry,
    isItemExpired,
    getExpiryStatus,
    
    // Computed values
    activeItems: getItemsByStatus(ITEM_STATUS.ACTIVE),
    expiredItems: getItemsByStatus(ITEM_STATUS.EXPIRED),
    completedItems: getItemsByStatus(ITEM_STATUS.COMPLETED),
    expiringItems: getExpiringItems(5)
  };
};
