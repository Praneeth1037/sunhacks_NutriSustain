import React, { useState, useEffect, useRef } from 'react';
import './AISupportBot.css';

const AISupportBot = ({ onBack }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m your NutriSustain AI assistant. I can help you with grocery management, recipe suggestions, health tracking, analytics, and any questions about the app. What can I help you with today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Grocery Management responses
    if (message.includes('grocery') || message.includes('add item') || message.includes('expiry')) {
      return {
        content: '🛒 **Grocery Management Help:**\n\n• **Add items:** Click "Add Grocery" and fill in product name, expiry date (MM/DD/YYYY), quantity, and category\n• **Camera scan:** Use the camera button to take a photo of your grocery item\n• **Track expiry:** Items are color-coded - Red (urgent), Orange (warning), Green (normal)\n• **Manage status:** Click green checkmark to mark as consumed, yellow reverse to reactivate, red delete to remove\n• **Drag & drop:** Reorganize items by dragging between Active, Consumed, and Expired categories\n\nNeed help with a specific grocery task?',
        suggestions: ['How to add items manually?', 'How does expiry tracking work?', 'How to mark items as consumed?']
      };
    }

    // Recipe suggestions responses
    if (message.includes('recipe') || message.includes('cooking') || message.includes('ai recipe')) {
      return {
        content: '🍳 **AI Recipe Suggestions Help:**\n\n• **Search recipes:** Type dish names like "tomato curry" or "pasta" in the search box\n• **View details:** See ingredients, instructions, cooking time, and difficulty\n• **Auto suggestions:** Get recipes for items approaching expiry automatically\n• **Save favorites:** Click the heart icon to bookmark recipes\n• **Ingredient matching:** Only shows recipes using your available ingredients\n\nWant to know more about recipe features?',
        suggestions: ['How to search for recipes?', 'How to save favorite recipes?', 'How do auto suggestions work?']
      };
    }

    // Health Intelligence responses
    if (message.includes('health') || message.includes('sugar') || message.includes('hba1c') || message.includes('medical')) {
      return {
        content: '❤️ **Health Intelligence Help:**\n\n• **Upload data:** Upload PDF reports or manually enter HbA1c values\n• **Update regularly:** Refresh health data every 3 months for best results\n• **Get recommendations:** Receive personalized food suggestions based on your health\n• **Avoid alerts:** Get warnings about high-sugar items in your groceries\n• **Track progress:** Monitor health trends and set goals\n• **Privacy:** Your health data is encrypted and secure\n\nNeed help with health tracking?',
        suggestions: ['How to upload health data?', 'What recommendations do I get?', 'Is my health data secure?']
      };
    }

    // Analytics responses
    if (message.includes('analytics') || message.includes('dashboard') || message.includes('report') || message.includes('data')) {
      return {
        content: '📊 **Analytics Dashboard Help:**\n\n• **Summary stats:** View total items purchased, consumed, and expired\n• **Category trends:** See consumption patterns by food category\n• **Monthly trends:** Track progress over time with charts\n• **Waste reduction:** Monitor your savings from reduced food waste\n• **Export data:** Download reports as PDF or CSV files\n• **Real-time updates:** Data updates as you use the app\n\nWant to explore analytics features?',
        suggestions: ['What analytics are available?', 'How to export reports?', 'How often is data updated?']
      };
    }

    // Technical support responses
    if (message.includes('problem') || message.includes('error') || message.includes('bug') || message.includes('not working') || message.includes('slow')) {
      return {
        content: '🔧 **Technical Support:**\n\n• **Slow performance:** Try refreshing the page or clearing browser cache\n• **Camera issues:** Ensure browser has camera permissions enabled\n• **Mobile access:** App works on all devices - smartphones, tablets, desktops\n• **Offline mode:** Basic features work offline, internet needed for AI features\n• **Data sync:** Create account to sync data across devices\n\nHaving a specific technical issue?',
        suggestions: ['App is running slowly', 'Camera not working', 'Mobile access problems']
      };
    }

    // Getting started responses
    if (message.includes('start') || message.includes('begin') || message.includes('first time') || message.includes('new user')) {
      return {
        content: '🚀 **Getting Started with NutriSustain:**\n\n1. **Add your groceries** - Start by adding items manually or scanning with camera\n2. **Track expiry dates** - Monitor items and get smart notifications\n3. **Explore recipes** - Get AI suggestions based on your ingredients\n4. **Monitor health** - Upload health data for personalized recommendations\n5. **View analytics** - Track your waste reduction progress\n\nReady to start your sustainable journey?',
        suggestions: ['How to add my first grocery item?', 'How to get recipe suggestions?', 'How to track my health?']
      };
    }

    // General app information
    if (message.includes('what is') || message.includes('about') || message.includes('nutrisustain') || message.includes('app')) {
      return {
        content: '🌱 **About NutriSustain:**\n\nNutriSustain is a comprehensive platform for smart grocery management, waste reduction, and healthy living. Our features include:\n\n• **Smart Grocery Management** - Track items, monitor expiry, reduce waste\n• **AI Recipe Suggestions** - Get personalized recipes using your ingredients\n• **Health Intelligence** - Track health metrics and get nutrition recommendations\n• **Analytics Dashboard** - Monitor consumption patterns and progress\n\nAll features are completely free to use!',
        suggestions: ['How does grocery management work?', 'What are AI recipe suggestions?', 'How does health tracking work?']
      };
    }

    // Default response for unrecognized queries
    return {
      content: 'I understand you\'re asking about: "' + userMessage + '"\n\nI can help you with:\n• Grocery management and item tracking\n• AI recipe suggestions and cooking\n• Health intelligence and recommendations\n• Analytics and progress tracking\n• Technical support and troubleshooting\n\nCould you be more specific about what you need help with?',
      suggestions: ['Grocery management help', 'Recipe suggestions', 'Health tracking', 'Analytics dashboard']
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        suggestions: botResponse.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-support-bot">
      <div className="bot-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
        <div className="bot-title">
          <div className="bot-icon">🤖</div>
          <h1>AI Support Assistant</h1>
          <p className="bot-description">Your intelligent helper for all NutriSustain questions and features.</p>
        </div>
      </div>

      <div className="bot-container">
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span className="bot-status">🟢 Online</span>
              <span>NutriSustain AI Assistant</span>
            </div>
            <button 
              className="minimize-btn"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? '↑' : '↓'}
            </button>
          </div>

          <div className={`chat-messages ${isMinimized ? 'minimized' : ''}`}>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.type === 'bot' && (
                    <div className="bot-avatar">🤖</div>
                  )}
                  <div className="message-bubble">
                    <div className="message-text">
                      {message.content.split('\n').map((line, index) => (
                        <div key={index}>
                          {line.startsWith('**') && line.endsWith('**') ? (
                            <strong>{line.slice(2, -2)}</strong>
                          ) : line.startsWith('•') ? (
                            <div className="bullet-point">{line}</div>
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
                {message.suggestions && (
                  <div className="suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot">
                <div className="message-content">
                  <div className="bot-avatar">🤖</div>
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about NutriSustain..."
                className="message-input"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="send-btn"
              >
                ➤
              </button>
            </div>
          </div>
        </div>

        <div className="bot-sidebar">
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button onClick={() => handleSuggestionClick('How to add grocery items?')}>
              🛒 Add Groceries
            </button>
            <button onClick={() => handleSuggestionClick('How to get recipe suggestions?')}>
              🍳 Find Recipes
            </button>
            <button onClick={() => handleSuggestionClick('How to track my health?')}>
              ❤️ Health Tracking
            </button>
            <button onClick={() => handleSuggestionClick('What analytics are available?')}>
              📊 View Analytics
            </button>
          </div>

          <div className="bot-info">
            <h3>About This Bot</h3>
            <p>I'm trained on NutriSustain's features and can help with:</p>
            <ul>
              <li>Grocery management</li>
              <li>Recipe suggestions</li>
              <li>Health tracking</li>
              <li>Analytics and reports</li>
              <li>Technical support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISupportBot;
