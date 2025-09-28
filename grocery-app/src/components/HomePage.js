import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomePage.css';

const HomePage = ({ onNavigate, onFeatureClick, onHelpCenterClick, onAIBotClick }) => {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [healthFacts, setHealthFacts] = useState([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [factsLoading, setFactsLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    fetchHealthFacts();
    
    const statsInterval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % foodWasteStats.length);
    }, 4000);
    
    const factsInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % healthFacts.length);
    }, 6000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(factsInterval);
    };
  }, [healthFacts.length]);

  const fetchHealthFacts = async () => {
    try {
      setFactsLoading(true);
      const response = await axios.post('http://localhost:3001/health-facts', {
        topic: 'food waste, nutrition, and sustainable eating habits',
        count: 5
      });
      setHealthFacts(response.data.facts);
    } catch (error) {
      console.error('Error fetching health facts:', error);
      // Fallback facts if API fails
      setHealthFacts([
        {
          fact: "1.3 billion tons of food is wasted globally each year, while 820 million people go hungry",
          source: "United Nations Food and Agriculture Organization",
          impact: "Global food security crisis"
        },
        {
          fact: "Food waste accounts for 8% of global greenhouse gas emissions, contributing to climate change",
          source: "United Nations Environment Programme",
          impact: "Environmental degradation"
        },
        {
          fact: "The average household wastes 30-40% of purchased food, costing families $1,500 annually",
          source: "USDA Economic Research Service",
          impact: "Economic burden on families"
        },
        {
          fact: "Proper meal planning and grocery management can reduce food waste by up to 50%",
          source: "Harvard School of Public Health",
          impact: "Sustainable living potential"
        },
        {
          fact: "Consuming expired or spoiled food leads to 48 million foodborne illnesses annually in the US alone",
          source: "Centers for Disease Control and Prevention",
          impact: "Public health risk"
        }
      ]);
    } finally {
      setFactsLoading(false);
    }
  };

  const foodWasteStats = [
    { number: "1.3", unit: "billion", text: "tons of food wasted globally each year" },
    { number: "33%", unit: "", text: "of all food produced is lost or wasted" },
    { number: "$1", unit: "trillion", text: "worth of food wasted annually" },
    { number: "8%", unit: "", text: "of global greenhouse gas emissions from food waste" },
    { number: "25%", unit: "", text: "of all water used in agriculture is wasted" },
    { number: "1.4", unit: "billion", text: "hectares of land used to grow wasted food" }
  ];

  const features = [
    {
      icon: "🛒",
      title: "Smart Grocery Management",
      description: "Track your groceries, monitor expiry dates, and reduce waste with intelligent notifications."
    },
    {
      icon: "🍳",
      title: "AI Recipe Suggestions",
      description: "Get personalized recipes based on your available ingredients and expiring items."
    },
    {
      icon: "❤️",
      title: "Health Intelligence",
      description: "Track your health metrics and get recommendations for better nutrition choices."
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Monitor your consumption patterns and waste reduction progress with detailed insights."
    },
    {
      icon: "🗑️",
      title: "Wasted Items",
      description: "Track your food waste and its financial impact with detailed analysis."
    }
  ];


  return (
    <div className={`homepage ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              🌱 Welcome to <span className="brand-name">NutriSustain</span>
            </h1>
            <p className="hero-subtitle">
              Your smart companion for sustainable grocery management, waste reduction, and healthy living.
            </p>
            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-number">{foodWasteStats[currentStatIndex].number}</div>
                <div className="stat-unit">{foodWasteStats[currentStatIndex].unit}</div>
                <div className="stat-text">{foodWasteStats[currentStatIndex].text}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-header">
            <h2 className="section-title">About NutriSustain</h2>
            <div className="section-subtitle">Transforming the way you think about food</div>
          </div>
          <div className="about-content">
            <div className="about-text">
              <div className="mission-statement">
                <h3>Our Mission</h3>
                <p>
                  To create a more sustainable future by empowering individuals to make informed, 
                  intelligent decisions about their food consumption while reducing waste and 
                  maximizing nutrition.
                </p>
              </div>
              
              <div className="platform-description">
                <h3>What We Do</h3>
                <p>
                  NutriSustain is your intelligent companion for sustainable living. We combine 
                  cutting-edge AI technology with practical insights to help you manage groceries 
                  smartly, reduce food waste, and make healthier choices that benefit both you 
                  and the planet.
                </p>
              </div>
              
              <div className="key-benefits">
                <h3>Why Choose NutriSustain?</h3>
                <ul>
                  <li>
                    <span className="benefit-icon">🎯</span>
                    <span className="benefit-text">Smart expiry tracking with intelligent notifications</span>
                  </li>
                  <li>
                    <span className="benefit-icon">🤖</span>
                    <span className="benefit-text">AI-powered recipe suggestions based on your inventory</span>
                  </li>
                  <li>
                    <span className="benefit-icon">📊</span>
                    <span className="benefit-text">Comprehensive analytics to track your progress</span>
                  </li>
                  <li>
                    <span className="benefit-icon">💚</span>
                    <span className="benefit-text">Health intelligence for better nutrition choices</span>
                  </li>
                  <li>
                    <span className="benefit-icon">💰</span>
                    <span className="benefit-text">Save money while reducing environmental impact</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Health Facts Section */}
      <section className="health-facts-section">
        <div className="container">
          <h2 className="section-title">🌍 Global Impact</h2>
          <div className="health-facts-container">
            <div className="health-facts-header">
            </div>
            <div className="health-facts-content">
              {factsLoading ? (
                <div className="facts-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading health insights...</p>
                </div>
              ) : (
                <div className="fact-card">
                  <div className="fact-content">
                    <div className="fact-text">
                      {healthFacts[currentFactIndex]?.fact}
                    </div>
                    <div className="fact-source">
                      <span className="source-label">Source:</span>
                      <span className="source-name">{healthFacts[currentFactIndex]?.source}</span>
                    </div>
                    <div className="fact-impact">
                      <span className="impact-label">Impact:</span>
                      <span className="impact-value">{healthFacts[currentFactIndex]?.impact}</span>
                    </div>
                  </div>
                  <div className="fact-navigation">
                    <div className="fact-dots">
                      {healthFacts.map((_, index) => (
                        <div
                          key={index}
                          className={`fact-dot ${index === currentFactIndex ? 'active' : ''}`}
                          onClick={() => setCurrentFactIndex(index)}
                        />
                      ))}
                    </div>
                    <button 
                      className="refresh-facts-btn"
                      onClick={fetchHealthFacts}
                      title="Refresh facts"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Navigation Section */}
      <section className="navigation-section">
        <div className="container">
          <h2 className="section-title">Quick Navigation</h2>
          <div className="nav-grid">
            <button className="nav-card" onClick={() => onNavigate('grocery')}>
              <div className="nav-icon">🛒</div>
              <h3>Grocery Management</h3>
              <p>Add, track, and manage your groceries</p>
            </button>
            <button className="nav-card" onClick={() => onNavigate('recipes')}>
              <div className="nav-icon">🍳</div>
              <h3>Recipe Suggestions</h3>
              <p>Discover recipes with your ingredients</p>
            </button>
            <button className="nav-card" onClick={() => onNavigate('health')}>
              <div className="nav-icon">❤️</div>
              <h3>Health Intelligence</h3>
              <p>Track your health and nutrition</p>
            </button>
            <button className="nav-card" onClick={() => onNavigate('analytics')}>
              <div className="nav-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>View your progress and insights</p>
            </button>
            <button className="nav-card" onClick={() => onNavigate('wasted')}>
              <div className="nav-icon">🗑️</div>
              <h3>Wasted Items</h3>
              <p>Track your food waste</p>
            </button>
          </div>
        </div>
      </section>


      {/* Customer Support Section */}
      <section className="support-section">
        <div className="container">
          <h2 className="section-title">Customer Support</h2>
          <div className="support-content">
            <div className="support-info">
              <div className="support-card">
                <div className="support-icon">📧</div>
                <h3>Email Support</h3>
                <p>support@nutrisustain.com</p>
                <p>We respond within 24 hours</p>
              </div>
              <div className="support-card" onClick={onAIBotClick}>
                <div className="support-icon">🤖</div>
                <h3>AI Support Bot</h3>
                <p>24/7 intelligent assistance</p>
                <p>Get instant help with any feature</p>
              </div>
              <div className="support-card" onClick={onHelpCenterClick}>
                <div className="support-icon">📚</div>
                <h3>Help Center</h3>
                <p>Comprehensive guides and FAQs</p>
                <p>Self-service resources</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🌱 NutriSustain</h3>
              <p>Making sustainable living simple and smart.</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <ul>
                  <li><button onClick={() => onNavigate('grocery')}>Grocery Management</button></li>
                  <li><button onClick={() => onNavigate('recipes')}>Recipe Suggestions</button></li>
                  <li><button onClick={() => onNavigate('analytics')}>Analytics</button></li>
                  <li><button onClick={() => onNavigate('wasted')}>Wasted Items</button></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <ul>
                  <li><a href="mailto:support@nutrisustain.com">Contact Us</a></li>
                  <li><button onClick={onHelpCenterClick}>Help Center</button></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#terms">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 NutriSustain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
