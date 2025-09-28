import React, { useEffect } from 'react';
import './FeatureTutorial.css';

const FeatureTutorial = ({ feature, onBack }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const tutorials = {
    'Smart Grocery Management': {
      title: 'Smart Grocery Management',
      icon: '🛒',
      description: 'Learn how to effectively manage your groceries and reduce waste.',
      steps: [
        {
          step: 1,
          title: 'Add Grocery Items',
          description: 'Click the "Add Grocery" button to manually enter items or use the camera to scan products.',
          details: [
            'Fill in the product name, expiry date (MM/DD/YYYY format), quantity, and category',
            'Use the camera button to take a photo of your grocery item',
            'The system will automatically set the purchase date to today'
          ]
        },
        {
          step: 2,
          title: 'Track Expiry Dates',
          description: 'Monitor your items and get smart notifications about expiring products.',
          details: [
            'Active items show days remaining until expiry',
            'Items are color-coded: Red (urgent), Orange (warning), Green (normal)',
            'Get notifications for items expiring within 3 days'
          ]
        },
        {
          step: 3,
          title: 'Manage Item Status',
          description: 'Move items between Active, Consumed, and Expired categories.',
          details: [
            'Click the green checkmark to mark items as consumed',
            'Use the yellow reverse button to move consumed items back to active',
            'Click the red delete button to permanently remove items'
          ]
        },
        {
          step: 4,
          title: 'Drag and Drop',
          description: 'Reorganize items by dragging them between categories.',
          details: [
            'Drag items within the same category to reorder them',
            'Drag items between categories to change their status',
            'The database updates automatically when you move items'
          ]
        }
      ]
    },
    'AI Recipe Suggestions': {
      title: 'AI Recipe Suggestions',
      icon: '🍳',
      description: 'Discover personalized recipes using your available ingredients.',
      steps: [
        {
          step: 1,
          title: 'Search for Recipes',
          description: 'Type a dish name in the search box to find recipes.',
          details: [
            'Enter dish names like "tomato curry", "pasta", or "stir fry"',
            'The AI will analyze your inventory and suggest compatible recipes',
            'Only recipes using your available ingredients will be shown'
          ]
        },
        {
          step: 2,
          title: 'View Recipe Details',
          description: 'Explore recipe ingredients, instructions, and nutritional information.',
          details: [
            'See a list of required ingredients from your inventory',
            'Follow step-by-step cooking instructions',
            'View cooking time and difficulty level'
          ]
        },
        {
          step: 3,
          title: 'Automatic Suggestions',
          description: 'Get recipe suggestions for items approaching expiry.',
          details: [
            'The system automatically suggests recipes for expiring items',
            'Suggestions include compatible ingredients from your inventory',
            'Click on suggestions to view full recipe details'
          ]
        },
        {
          step: 4,
          title: 'Save Favorite Recipes',
          description: 'Bookmark recipes you want to try later.',
          details: [
            'Click the heart icon to save recipes to your favorites',
            'Access saved recipes from the favorites section',
            'Share recipes with family and friends'
          ]
        }
      ]
    },
    'Health Intelligence': {
      title: 'Health Intelligence',
      icon: '❤️',
      description: 'Track your health metrics and get personalized nutrition recommendations.',
      steps: [
        {
          step: 1,
          title: 'Upload Health Data',
          description: 'Upload PDF reports or manually enter your health metrics.',
          details: [
            'Upload PDF files of your sugar level reports',
            'Manually enter your latest HbA1c value',
            'Update your data every 3 months for best results'
          ]
        },
        {
          step: 2,
          title: 'View Health Insights',
          description: 'Monitor your health trends and get personalized recommendations.',
          details: [
            'See your health data in easy-to-read charts',
            'Track your progress over time',
            'Get insights about your health patterns'
          ]
        },
        {
          step: 3,
          title: 'Get Food Recommendations',
          description: 'Receive personalized food suggestions based on your health data.',
          details: [
            'Get recommendations for foods to avoid based on your health',
            'See which items in your inventory are best for your health',
            'Receive alerts about high-sugar items in your groceries'
          ]
        },
        {
          step: 4,
          title: 'Set Health Goals',
          description: 'Create and track your health and nutrition goals.',
          details: [
            'Set target HbA1c levels and track progress',
            'Create meal plans based on your health requirements',
            'Get reminders to update your health data'
          ]
        }
      ]
    },
    'Analytics Dashboard': {
      title: 'Analytics Dashboard',
      icon: '📊',
      description: 'Monitor your consumption patterns and waste reduction progress.',
      steps: [
        {
          step: 1,
          title: 'View Summary Statistics',
          description: 'Get an overview of your grocery management performance.',
          details: [
            'See total items purchased, consumed, and expired',
            'View your waste reduction percentage',
            'Track your savings from reduced food waste'
          ]
        },
        {
          step: 2,
          title: 'Analyze Category Trends',
          description: 'Understand your consumption patterns by food category.',
          details: [
            'View bar charts showing consumption by category',
            'Identify which categories you use most frequently',
            'See which categories have the highest waste rates'
          ]
        },
        {
          step: 3,
          title: 'Monitor Monthly Trends',
          description: 'Track your progress over time with detailed analytics.',
          details: [
            'View line charts showing monthly consumption trends',
            'Compare your performance across different months',
            'Identify seasonal patterns in your grocery usage'
          ]
        },
        {
          step: 4,
          title: 'Export Reports',
          description: 'Generate and download detailed reports of your data.',
          details: [
            'Export your analytics data as PDF or CSV files',
            'Share reports with family members or healthcare providers',
            'Schedule automatic report generation'
          ]
        }
      ]
    }
  };

  const currentTutorial = tutorials[feature];

  if (!currentTutorial) {
    return (
      <div className="feature-tutorial">
        <div className="tutorial-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Home
          </button>
          <h1>Feature Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-tutorial">
      <div className="tutorial-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
        <div className="tutorial-title">
          <div className="tutorial-icon">{currentTutorial.icon}</div>
          <h1>{currentTutorial.title}</h1>
          <p className="tutorial-description">{currentTutorial.description}</p>
        </div>
      </div>

      <div className="tutorial-content">
        <div className="tutorial-steps">
          {currentTutorial.steps.map((step, index) => (
            <div key={index} className="tutorial-step">
              <div className="step-header">
                <div className="step-number">{step.step}</div>
                <div className="step-info">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
              <div className="step-details">
                <h4>Key Points:</h4>
                <ul>
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="tutorial-tips">
          <h3>💡 Pro Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>Regular Updates</h4>
              <p>Update your grocery list regularly to get the most accurate recommendations.</p>
            </div>
            <div className="tip-card">
              <h4>Use Notifications</h4>
              <p>Enable notifications to stay informed about expiring items and health reminders.</p>
            </div>
            <div className="tip-card">
              <h4>Track Progress</h4>
              <p>Check your analytics regularly to monitor your waste reduction progress.</p>
            </div>
            <div className="tip-card">
              <h4>Health Integration</h4>
              <p>Connect your health data for personalized food recommendations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureTutorial;
