import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nutritionFacts, setNutritionFacts] = useState({});
  const [nutritionLoading, setNutritionLoading] = useState({});

  // Search recipes
  const searchRecipes = useCallback(async (query, expiringItems = []) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.RECIPE_SEARCH}`, {
        query,
        expiringItems
      });
      
      if (response.data.success) {
        setRecipes(response.data.recipes);
        return { success: true, data: response.data };
      } else {
        throw new Error('Failed to generate recipes');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to search recipes';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get recipe suggestions for expiring items
  const getRecipeSuggestions = useCallback(async (expiringItems) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.RECIPE_SUGGESTIONS}`, {
        expiringItems
      });
      
      if (response.data.success) {
        setRecipes(response.data.recipes);
        return { success: true, data: response.data };
      } else {
        throw new Error('Failed to get recipe suggestions');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to get recipe suggestions';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get nutrition facts for a recipe
  const getNutritionFacts = useCallback(async (recipe, index) => {
    setNutritionLoading(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.NUTRITION_FACTS}`, {
        recipe
      });
      
      if (response.data.success) {
        setNutritionFacts(prev => ({ ...prev, [index]: response.data.nutrition }));
        return { success: true, data: response.data.nutrition };
      } else {
        throw new Error('Failed to get nutrition facts');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get nutrition facts';
      setNutritionFacts(prev => ({ ...prev, [index]: { error: errorMessage } }));
      return { success: false, error: errorMessage };
    } finally {
      setNutritionLoading(prev => ({ ...prev, [index]: false }));
    }
  }, []);

  // Clear recipes
  const clearRecipes = useCallback(() => {
    setRecipes([]);
    setError(null);
    setNutritionFacts({});
    setNutritionLoading({});
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    recipes,
    loading,
    error,
    nutritionFacts,
    nutritionLoading,
    
    // Actions
    searchRecipes,
    getRecipeSuggestions,
    getNutritionFacts,
    clearRecipes,
    clearError
  };
};
