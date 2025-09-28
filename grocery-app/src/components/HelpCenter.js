import React, { useState, useEffect } from 'react';
import './HelpCenter.css';

const HelpCenter = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const faqCategories = {
    all: 'All FAQs',
    gettingStarted: 'Getting Started',
    groceryManagement: 'Grocery Management',
    recipes: 'Recipe Suggestions',
    health: 'Health Intelligence',
    analytics: 'Analytics',
    technical: 'Technical Support',
    account: 'Account & Settings'
  };

  const faqs = [
    {
      id: 1,
      category: 'gettingStarted',
      question: 'How do I get started with NutriSustain?',
      answer: 'Getting started is easy! First, add your grocery items manually or use the camera to scan them. The app will automatically track expiry dates and send you notifications. You can then explore recipe suggestions and track your health metrics.'
    },
    {
      id: 2,
      category: 'gettingStarted',
      question: 'Is NutriSustain free to use?',
      answer: 'Yes, NutriSustain is completely free to use. All features including grocery management, AI recipe suggestions, health tracking, and analytics are available at no cost.'
    },
    {
      id: 3,
      category: 'groceryManagement',
      question: 'How do I add grocery items?',
      answer: 'You can add items in two ways: 1) Manually enter the product name, expiry date (MM/DD/YYYY), quantity, and category, then click "Upload". 2) Use the camera button to take a photo of your grocery item and enter the expiry date when prompted.'
    },
    {
      id: 4,
      category: 'groceryManagement',
      question: 'How does the expiry date tracking work?',
      answer: 'The app automatically calculates days until expiry and color-codes items: Red (urgent - expiring soon), Orange (warning - expiring within a week), Green (normal - plenty of time left). You\'ll get notifications for items expiring within 3 days.'
    },
    {
      id: 5,
      category: 'groceryManagement',
      question: 'Can I move items between Active, Consumed, and Expired categories?',
      answer: 'Yes! Click the green checkmark to mark items as consumed, use the yellow reverse button to move consumed items back to active, and click the red delete button to permanently remove items. You can also drag and drop items between categories.'
    },
    {
      id: 6,
      category: 'groceryManagement',
      question: 'What happens when I mark an item as consumed?',
      answer: 'When you mark an item as consumed, it moves from the Active list to the Consumed list. The item is tracked in your analytics as successfully used, helping you understand your consumption patterns.'
    },
    {
      id: 7,
      category: 'recipes',
      question: 'How do AI recipe suggestions work?',
      answer: 'The AI analyzes your available ingredients and suggests recipes you can make. You can search for specific dishes, or the system will automatically suggest recipes for items approaching expiry to help reduce waste.'
    },
    {
      id: 8,
      category: 'recipes',
      question: 'Can I save favorite recipes?',
      answer: 'Yes! Click the heart icon on any recipe to save it to your favorites. You can access all saved recipes from the favorites section and share them with family and friends.'
    },
    {
      id: 9,
      category: 'recipes',
      question: 'What if I don\'t have all the ingredients for a recipe?',
      answer: 'The AI only suggests recipes that use ingredients you have in your inventory. If a recipe requires ingredients you don\'t have, it won\'t be suggested. You can always add missing ingredients to your grocery list.'
    },
    {
      id: 10,
      category: 'health',
      question: 'How do I upload my health data?',
      answer: 'You can upload PDF reports of your sugar levels or manually enter your latest HbA1c value. The system recommends updating your health data every 3 months for the most accurate recommendations.'
    },
    {
      id: 11,
      category: 'health',
      question: 'What kind of health recommendations do I get?',
      answer: 'Based on your health data, you\'ll receive personalized food recommendations, alerts about high-sugar items in your groceries, and suggestions for foods to avoid based on your health conditions.'
    },
    {
      id: 12,
      category: 'health',
      question: 'Is my health data secure?',
      answer: 'Yes, your health data is encrypted and stored securely. We follow strict privacy guidelines and never share your personal health information with third parties.'
    },
    {
      id: 13,
      category: 'analytics',
      question: 'What analytics are available?',
      answer: 'The analytics dashboard shows your consumption patterns, waste reduction progress, category trends, monthly consumption data, and top items. You can see how much you\'ve saved by reducing food waste.'
    },
    {
      id: 14,
      category: 'analytics',
      question: 'Can I export my data?',
      answer: 'Yes, you can export your analytics data as PDF or CSV files. This is useful for sharing with family members, healthcare providers, or for your own records.'
    },
    {
      id: 15,
      category: 'analytics',
      question: 'How often is the analytics data updated?',
      answer: 'Analytics data is updated in real-time as you add, consume, or expire items. The dashboard reflects your current status and historical trends.'
    },
    {
      id: 16,
      category: 'technical',
      question: 'The app is running slowly. What should I do?',
      answer: 'Try refreshing the page or clearing your browser cache. If the issue persists, check your internet connection. For persistent issues, contact our support team.'
    },
    {
      id: 17,
      category: 'technical',
      question: 'I\'m having trouble with the camera feature. What can I do?',
      answer: 'Make sure your browser has camera permissions enabled. Try refreshing the page and allowing camera access when prompted. The camera feature works best in well-lit conditions.'
    },
    {
      id: 18,
      category: 'technical',
      question: 'Can I use NutriSustain on my mobile device?',
      answer: 'Yes! NutriSustain is fully responsive and works on all devices including smartphones, tablets, and desktop computers. The interface adapts to your screen size.'
    },
    {
      id: 19,
      category: 'account',
      question: 'Do I need to create an account?',
      answer: 'No account is required to use NutriSustain. Your data is stored locally in your browser. However, creating an account allows you to sync data across devices.'
    },
    {
      id: 20,
      category: 'account',
      question: 'How do I reset my data?',
      answer: 'You can clear all your data by going to Settings and selecting "Clear All Data". This action cannot be undone, so make sure to export any important data first.'
    },
    {
      id: 21,
      category: 'account',
      question: 'Can I use NutriSustain offline?',
      answer: 'Basic features work offline, but you\'ll need an internet connection for AI recipe suggestions, health data analysis, and data synchronization across devices.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="help-center">
      <div className="help-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
        <div className="help-title">
          <div className="help-icon">❓</div>
          <h1>Help Center</h1>
          <p className="help-description">Find answers to common questions and learn how to use NutriSustain effectively.</p>
        </div>
      </div>

      <div className="help-content">
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>
        </div>

        <div className="category-filters">
          {Object.entries(faqCategories).map(([key, label]) => (
            <button
              key={key}
              className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <div key={faq.id} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(faq.id)}
                  >
                    <span className="question-text">{faq.question}</span>
                    <span className="expand-icon">
                      {expandedFAQ === faq.id ? '−' : '+'}
                    </span>
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No FAQs found matching your search criteria.</p>
                <p>Try adjusting your search terms or category filter.</p>
              </div>
            )}
          </div>
        </div>

        <div className="contact-section">
          <h2>Still Need Help?</h2>
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email Support</h3>
              <p>support@nutrisustain.com</p>
              <p>We respond within 24 hours</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Available 9 AM - 6 PM EST</p>
              <p>Get instant help from our team</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h3>Phone Support</h3>
              <p>1-800-NUTRI-SUPPORT</p>
              <p>Monday - Friday, 9 AM - 5 PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
