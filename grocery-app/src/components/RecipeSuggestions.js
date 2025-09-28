import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecipeSuggestions.css';

const RecipeSuggestions = ({ expiringItems = [], onRecipeGenerated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'suggestions'
  const [nutritionFacts, setNutritionFacts] = useState({});
  const [nutritionLoading, setNutritionLoading] = useState({});

  useEffect(() => {
    // Auto-generate suggestions when expiring items change
    if (expiringItems.length > 0) {
      generateExpirySuggestions();
    }
  }, [expiringItems]);

  // Auto-generate suggestions when component mounts with expiring items
  useEffect(() => {
    if (expiringItems.length > 0) {
      generateExpirySuggestions();
    }
  }, []);

  const generateExpirySuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Generating suggestions for expiring items:', expiringItems);
      
      const response = await axios.post('http://localhost:3001/recipes/suggestions', {
        expiringItems: expiringItems
      });
      
      console.log('Suggestions API Response:', response.data);
      
      if (response.data.recipes && response.data.recipes.length > 0) {
        setRecipes(response.data.recipes);
        setActiveTab('suggestions');
        onRecipeGenerated && onRecipeGenerated(response.data.recipes);
      }
    } catch (error) {
      console.error('Error generating expiry suggestions:', error);
      setError(`Failed to generate recipe suggestions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const searchRecipes = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      console.log('Searching for:', searchQuery.trim());
      console.log('Expiring items:', expiringItems);
      
      const response = await axios.post('http://localhost:3001/recipes/search', {
        query: searchQuery.trim(),
        expiringItems: expiringItems
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.recipes && response.data.recipes.length > 0) {
        setRecipes(response.data.recipes);
        setActiveTab('search');
        onRecipeGenerated && onRecipeGenerated(response.data.recipes);
      } else {
        setError('No recipes found for your search. Try a different dish name.');
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      setError(`Failed to search recipes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearRecipes = () => {
    setRecipes([]);
    setSearchQuery('');
    setError('');
    setNutritionFacts({});
    setNutritionLoading({});
  };

  const getNutritionFacts = async (recipe, index) => {
    try {
      setNutritionLoading(prev => ({ ...prev, [index]: true }));
      
      const response = await axios.post('http://localhost:3001/recipes/nutrition', {
        recipe: recipe
      });
      
      console.log('Nutrition API Response:', response.data);
      
      if (response.data.nutrition) {
        setNutritionFacts(prev => ({ ...prev, [index]: response.data.nutrition }));
      }
    } catch (error) {
      console.error('Error getting nutrition facts:', error);
      setNutritionFacts(prev => ({ ...prev, [index]: { error: 'Failed to load nutrition facts' } }));
    } finally {
      setNutritionLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="recipe-suggestions">
      <div className="recipe-header">
        <h2>🍳 AI Recipe Suggestions</h2>
      </div>

      <div className="recipe-layout">
        {/* Left Side - Search Section */}
        <div className="search-panel">
          <div className="search-section">
            <h3>🔍 Search Recipes</h3>
            <form onSubmit={searchRecipes} className="recipe-search-form">
              <div className="search-input-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter dish name (e.g., 'tomato curry', 'pasta')"
                  className="search-input"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="search-btn"
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
            </form>
          </div>

          <div className="suggestions-section">
            <h3>💡 Expiry Suggestions</h3>
            <div className="suggestions-info">
              <p>Recipe suggestions based on your expiring items:</p>
              <div className="expiring-items-preview">
                {expiringItems.slice(0, 3).map(item => (
                  <span key={item.id} className="expiring-item-tag">
                    {item.productName}
                  </span>
                ))}
                {expiringItems.length > 3 && (
                  <span className="more-items">+{expiringItems.length - 3} more</span>
                )}
              </div>
            </div>
            <button 
              onClick={generateExpirySuggestions}
              className="generate-suggestions-btn"
              disabled={loading || expiringItems.length === 0}
            >
              {loading ? 'Generating...' : '🔄 Refresh Suggestions'}
            </button>
          </div>

          {/* Nutrition Content Section */}
          <div className="nutrition-section">
            <div className="nutrition-header">
              <h3>🥗 Nutrition Content</h3>
            </div>
            
            {recipes.length > 0 ? (
              <div className="nutrition-facts">
                {recipes.map((recipe, index) => (
                  <div key={index} className="nutrition-card">
                    <div className="nutrition-recipe-title">
                      <button 
                        onClick={() => getNutritionFacts(recipe, index)}
                        className="nutrition-btn"
                        disabled={nutritionLoading[index]}
                      >
                        {nutritionLoading[index] ? 'Loading...' : 'Get Nutrition Facts'}
                      </button>
                    </div>
                    
                    {nutritionFacts[index] && (
                      <div className="nutrition-data">
                        {nutritionFacts[index].error ? (
                          <p className="nutrition-error">{nutritionFacts[index].error}</p>
                        ) : (
                          <div className="nutrition-grid">
                            <div className="nutrition-item">
                              <span className="nutrition-label">Calories</span>
                              <span className="nutrition-value">{nutritionFacts[index].calories || 'N/A'} kcal</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrition-label">Protein</span>
                              <span className="nutrition-value">{nutritionFacts[index].protein || 'N/A'}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrition-label">Carbs</span>
                              <span className="nutrition-value">{nutritionFacts[index].carbs || 'N/A'}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrition-label">Fats</span>
                              <span className="nutrition-value">{nutritionFacts[index].fats || 'N/A'}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrition-label">Fiber</span>
                              <span className="nutrition-value">{nutritionFacts[index].fiber || 'N/A'}g</span>
                            </div>
                            <div className="nutrition-item">
                              <span className="nutrition-label">Vitamins</span>
                              <span className="nutrition-value">{nutritionFacts[index].vitamins || 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="nutrition-empty">
                <p>Generate recipes to see nutrition facts</p>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        {/* Right Side - Recipe Results */}
        <div className="results-panel">
          <div className="recipes-container">
            <div className="recipes-header">
              <h3>Recipe Results</h3>
              {recipes.length > 0 && (
                <button onClick={clearRecipes} className="clear-btn">Clear</button>
              )}
            </div>
            
            {recipes.length > 0 ? (
              <div className="recipes-list">
                {recipes.map((recipe, index) => (
                  <div key={index} className="recipe-card">
                    <div className="recipe-title">
                      <h4>{recipe.title}</h4>
                      <span className="recipe-type">{recipe.type || 'Main Course'}</span>
                    </div>
                    
                    <div className="recipe-content">
                      <div className="ingredients-section">
                        <h5>📋 Ingredients</h5>
                        <ul className="ingredients-list">
                          {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="ingredient-item">
                              <span className="ingredient-name">{ingredient.name}</span>
                              <span className="ingredient-amount">{ingredient.amount}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="steps-section">
                        <h5>👨‍🍳 Instructions</h5>
                        <ol className="steps-list">
                          {recipe.steps.map((step, idx) => (
                            <li key={idx} className="step-item">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    
                    {recipe.tips && (
                      <div className="recipe-tips">
                        <h5>💡 Tips</h5>
                        <p>{recipe.tips}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recipes yet. Search for a dish or generate expiry suggestions!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeSuggestions;
