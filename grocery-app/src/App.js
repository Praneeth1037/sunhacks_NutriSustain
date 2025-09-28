import React, { useState, useEffect } from 'react';
import './styles/design-system.css';
import './App.css';
import HomePage from './components/HomePage';
import FeatureTutorial from './components/FeatureTutorial';
import HelpCenter from './components/HelpCenter';
import AISupportBot from './components/AISupportBot';
import FloatingAIBot from './components/FloatingAIBot';
import ManualGroceryEntry from './components/ManualGroceryEntry';
import RecipeSuggestions from './components/RecipeSuggestions';
import SugarHealthTracker from './components/SugarHealthTracker';
import NewAnalytics from './components/NewAnalytics';
import WastedItems from './components/WastedItems';
import ExpiryNotification from './components/ExpiryNotification';
import ExpiryAlert from './components/ExpiryAlert';

function App() {
  const [expiringItems, setExpiringItems] = useState([]);
  const [activeSection, setActiveSection] = useState('home');
  const [tutorialFeature, setTutorialFeature] = useState(null);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showAIBot, setShowAIBot] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      if (data.type === 'expiring_items' || data.type === 'new_expiring_item') {
        setExpiringItems(data.items || [data.item]);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        setWs(new WebSocket('ws://localhost:3001'));
      }, 3000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const handleExpiringItemsUpdate = (items) => {
    setExpiringItems(items);
  };

  const handleFeatureClick = (feature) => {
    setTutorialFeature(feature);
    // Scroll to top when opening tutorial
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setTutorialFeature(null);
    setShowHelpCenter(false);
    setShowAIBot(false);
    setActiveSection('home');
    // Scroll to top when returning to home
    window.scrollTo(0, 0);
  };

  const handleHelpCenterClick = () => {
    setShowHelpCenter(true);
    // Scroll to top when opening help center
    window.scrollTo(0, 0);
  };

  const handleAIBotClick = () => {
    setShowAIBot(true);
    // Scroll to top when opening AI bot
    window.scrollTo(0, 0);
  };

  const handleNavigateToRecipes = (expiringItems) => {
    setExpiringItems(expiringItems);
    setActiveSection('recipes');
    // Scroll to top when navigating to recipes
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    if (showAIBot) {
      return <AISupportBot onBack={handleBackToHome} />;
    }

    if (showHelpCenter) {
      return <HelpCenter onBack={handleBackToHome} />;
    }

    if (tutorialFeature) {
      return <FeatureTutorial feature={tutorialFeature} onBack={handleBackToHome} />;
    }

    switch (activeSection) {
      case 'home':
        return <HomePage onNavigate={setActiveSection} onFeatureClick={handleFeatureClick} onHelpCenterClick={handleHelpCenterClick} onAIBotClick={handleAIBotClick} />;
      case 'grocery':
        return <ManualGroceryEntry expiringItems={expiringItems} onNavigateToRecipes={handleNavigateToRecipes} />;
      case 'recipes':
        return <RecipeSuggestions expiringItems={expiringItems} onRecipeGenerated={(recipes) => console.log('Recipes generated:', recipes)} />;
      case 'health':
        return <SugarHealthTracker />;
      case 'analytics':
        return <NewAnalytics onClose={() => setActiveSection('home')} />;
      case 'wasted':
        return <WastedItems />;
      default:
        return <HomePage onNavigate={setActiveSection} onFeatureClick={handleFeatureClick} onHelpCenterClick={handleHelpCenterClick} onAIBotClick={handleAIBotClick} />;
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1 className="font-bold text-3xl leading-tight">
          🌱 NutriSustain
        </h1>
        <p className="text-lg font-medium opacity-90">
          Smart Grocery Management with Health Tracking & Recipe Intelligence
        </p>
      </div>

      <div className="navigation">
        <button 
          className={`nav-btn ${activeSection === 'home' ? 'active' : ''}`}
          onClick={() => setActiveSection('home')}
        >
          🏠 Home
        </button>
        <button 
          className={`nav-btn ${activeSection === 'grocery' ? 'active' : ''}`}
          onClick={() => setActiveSection('grocery')}
        >
          🛒 Grocery Management
        </button>
        <button 
          className={`nav-btn ${activeSection === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveSection('recipes')}
        >
          🍳 AI Recipes
        </button>
        <button 
          className={`nav-btn ${activeSection === 'health' ? 'active' : ''}`}
          onClick={() => setActiveSection('health')}
        >
          💊 Health Intelligence
        </button>
        <button 
          className={`nav-btn ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSection('analytics')}
        >
          📊 Analytics
        </button>
        <button 
          className={`nav-btn ${activeSection === 'wasted' ? 'active' : ''}`}
          onClick={() => setActiveSection('wasted')}
        >
          🗑️ Wasted Items
        </button>
      </div>

      <div className="main-content">
        {renderContent()}
      </div>

      <div className="right-sidebar">
        <ExpiryNotification onExpiringItemsUpdate={handleExpiringItemsUpdate} />
      </div>

      <div className="footer">
        <p className="text-sm font-medium">
          © 2024 NutriSustain - Smart Grocery Management with Health Intelligence
        </p>
      </div>

      {/* Floating AI Bot - Available on all pages */}
      <FloatingAIBot />
    </div>
  );
}

export default App;