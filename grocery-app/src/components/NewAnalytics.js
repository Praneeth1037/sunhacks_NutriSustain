import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  ComposedChart, Legend
} from 'recharts';
import './NewAnalytics.css';

const NewAnalytics = ({ onClose = () => {} }) => {
  const [groceryData, setGroceryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchGroceryData();
  }, [selectedMonth]);

  const fetchGroceryData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/groceryItems');
      setGroceryData(response.data);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching grocery data:', err);
      setError('Failed to load grocery data');
    } finally {
      setLoading(false);
    }
  };


  // Calculate analytics from actual grocery data
  const calculateAnalytics = () => {
    if (!groceryData || groceryData.length === 0) {
      return {
        totalItems: 0,
        activeItems: 0,
        consumedItems: 0,
        expiredItems: 0,
        allExpiredItems: [],
        categories: [],
        monthlyData: [],
        topItems: [],
        wasteRate: 0,
        efficiencyScore: 0
      };
    }

    const today = new Date();
    const currentMonth = selectedMonth;

    // Filter data for selected month
    const monthData = groceryData.filter(item => {
      const purchaseDate = new Date(item.purchaseDate);
      return purchaseDate.toISOString().slice(0, 7) === currentMonth;
    });

    // Calculate basic stats
    const monthTotalItems = monthData.length;
    const activeItems = groceryData.filter(item => item.status === 'active').length;
    
    
    const consumedItems = groceryData.filter(item => item.status === 'completed').length;
    const expiredItems = groceryData.filter(item => item.status === 'expired').length;

    // Calculate waste rate and efficiency
    const totalItems = activeItems + consumedItems + expiredItems;
    const wasteRate = totalItems > 0 ? ((expiredItems / totalItems) * 100).toFixed(1) : 0;
    const efficiencyScore = (100 - parseFloat(wasteRate)).toFixed(1);

    // Category analysis
    const categoryStats = {};
    monthData.forEach(item => {
      const category = item.category || 'Other';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          total: 0,
          active: 0,
          consumed: 0,
          expired: 0,
          wasteRate: 0
        };
      }
      
      categoryStats[category].total++;
      
      if (item.status === 'completed') {
        categoryStats[category].consumed++;
      } else if (item.status === 'expired') {
        categoryStats[category].expired++;
      } else if (item.status === 'active') {
        categoryStats[category].active++;
      }
    });

    // Calculate waste rate for each category
    Object.values(categoryStats).forEach(cat => {
      const totalItems = cat.active + cat.consumed + cat.expired;
      cat.wasteRate = totalItems > 0 ? ((cat.expired / totalItems) * 100).toFixed(1) : 0;
    });

    const categories = Object.values(categoryStats);

    // Top items analysis
    const itemStats = {};
    monthData.forEach(item => {
      const name = item.productName;
      if (!itemStats[name]) {
        itemStats[name] = {
          name,
          category: item.category,
          total: 0,
          consumed: 0,
          expired: 0,
          wasteRate: 0
        };
      }
      
      itemStats[name].total++;
      
      if (item.status === 'completed') {
        itemStats[name].consumed++;
      } else if (item.status === 'expired') {
        itemStats[name].expired++;
      }
    });

    // Calculate waste rate for each item
    Object.values(itemStats).forEach(item => {
      const totalItems = item.total;
      item.wasteRate = totalItems > 0 ? ((item.expired / totalItems) * 100).toFixed(1) : 0;
    });

    // Get all expired items from the database
    const allExpiredItems = groceryData.filter(item => item.status === 'expired');

    const topItems = Object.values(itemStats)
      .filter(item => item.expired > 0)
      .sort((a, b) => b.expired - a.expired)
      .slice(0, 10);

    // Monthly trend data (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      
      const monthItems = groceryData.filter(item => {
        const purchaseDate = new Date(item.purchaseDate);
        return purchaseDate.toISOString().slice(0, 7) === monthKey;
      });

      const monthConsumed = monthItems.filter(item => item.status === 'completed').length;
      const monthExpired = monthItems.filter(item => item.status === 'expired').length;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        consumed: monthConsumed,
        expired: monthExpired,
        total: monthItems.length
      });
    }

    return {
      totalItems: monthTotalItems,
      activeItems,
      consumedItems,
      expiredItems,
      allExpiredItems,
      categories,
      monthlyData: monthlyTrends,
      topItems,
      wasteRate,
      efficiencyScore
    };
  };

  const analytics = calculateAnalytics();

  const getCategoryColor = (category) => {
    const colors = {
      'Fruits': '#22c55e',
      'Vegetables': '#16a34a',
      'Dairy': '#84cc16',
      'Meat': '#ef4444',
      'Grains': '#f97316',
      'Snacks': '#65a30d',
      'Beverages': '#4d7c0f',
      'Other': '#78716c'
    };
    return colors[category] || '#78716c';
  };

  if (loading) {
    return (
      <div className="new-analytics">
        <div className="analytics-header">
          <h2>📊 Real-Time Grocery Analytics</h2>
        </div>
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="new-analytics">
        <div className="analytics-header">
          <h2>📊 Real-Time Grocery Analytics</h2>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Active', value: analytics.activeItems, color: '#22c55e' },
    { name: 'Consumed', value: analytics.consumedItems, color: '#84cc16' },
    { name: 'Expired', value: analytics.expiredItems, color: '#ef4444' }
  ];

  const categoryData = analytics.categories.map(cat => ({
    name: cat.name,
    total: cat.total,
    active: cat.active,
    consumed: cat.consumed,
    expired: cat.expired,
    wasteRate: parseFloat(cat.wasteRate),
    color: getCategoryColor(cat.name)
  }));

  const wasteAnalysisData = analytics.categories
    .filter(cat => cat.expired > 0)
    .map(cat => ({
      category: cat.name,
      wasteRate: parseFloat(cat.wasteRate),
      expired: cat.expired,
      color: getCategoryColor(cat.name)
    }));

  return (
    <div className="new-analytics">
      <div className="analytics-header">
        <h2>📊 Real-Time Grocery Analytics</h2>
        <div className="header-controls">
          <div className="month-selector">
            <label htmlFor="month-select">Month:</label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-input"
            />
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Active Items</h3>
          <div className="summary-value">{analytics.activeItems}</div>
          <div className="summary-label">Currently available</div>
        </div>
        <div className="summary-card">
          <h3>Efficiency Score</h3>
          <div className="summary-value">{analytics.efficiencyScore}%</div>
          <div className="summary-label">Consumption efficiency</div>
        </div>
        <div className="summary-card">
          <h3>Waste Rate</h3>
          <div className="summary-value">{analytics.wasteRate}%</div>
          <div className="summary-label">Items expired</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Status Distribution */}
        <div className="chart-container chart-3d">
          <h3>Item Status Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={3}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  color: '#333',
                  fontSize: '12px',
                  padding: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Analysis */}
        <div className="chart-container chart-3d">
          <h3>Category Analysis</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={2} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#374151"
                strokeWidth={2}
              />
              <YAxis stroke="#374151" strokeWidth={2} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  color: '#333',
                  fontSize: '12px',
                  padding: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="active" 
                fill="url(#activeGradient)" 
                name="Active"
                radius={[8, 8, 0, 0]}
                stroke="#fff"
                strokeWidth={2}
              />
              <Bar 
                dataKey="consumed" 
                fill="url(#consumedGradient)" 
                name="Consumed"
                radius={[8, 8, 0, 0]}
                stroke="#fff"
                strokeWidth={2}
              />
              <Bar 
                dataKey="expired" 
                fill="url(#expiredGradient)" 
                name="Expired"
                radius={[8, 8, 0, 0]}
                stroke="#fff"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <linearGradient id="consumedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#65a30d" />
                </linearGradient>
                <linearGradient id="expiredGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="chart-container chart-3d">
          <h3>Monthly Trends</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={2} />
              <XAxis dataKey="month" stroke="#374151" strokeWidth={2} />
              <YAxis stroke="#374151" strokeWidth={2} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  color: '#333',
                  fontSize: '12px',
                  padding: '8px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="consumed" 
                stackId="1" 
                stroke="#22c55e" 
                strokeWidth={4}
                fill="url(#consumedAreaGradient)" 
                name="Consumed" 
              />
              <Area 
                type="monotone" 
                dataKey="expired" 
                stackId="1" 
                stroke="#ef4444" 
                strokeWidth={4}
                fill="url(#expiredAreaGradient)" 
                name="Expired" 
              />
              <defs>
                <linearGradient id="consumedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="expiredAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Waste Analysis */}
        <div className="chart-container chart-3d">
          <h3>Waste Analysis by Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wasteAnalysisData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={2} />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#374151"
                strokeWidth={2}
              />
              <YAxis stroke="#374151" strokeWidth={2} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  color: '#333',
                  fontSize: '12px',
                  padding: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="wasteRate" 
                fill="url(#wasteGradient)" 
                name="Waste Rate %"
                radius={[8, 8, 0, 0]}
                stroke="#fff"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Insights */}
      <div className="insights-section">
        <h3>Smart Insights</h3>
        <div className="insights">
          <div className="insight-item">
            <h4>🎯 Efficiency Score</h4>
            <p>
              Your overall consumption efficiency is <strong>{analytics.efficiencyScore}%</strong>. 
              {parseFloat(analytics.efficiencyScore) > 80 ? ' Excellent! You\'re minimizing waste effectively.' : 
                parseFloat(analytics.efficiencyScore) > 60 ? ' Good! Consider reducing quantities for high-waste items.' : 
                ' Needs improvement. Focus on better planning and smaller quantities.'}
            </p>
          </div>
          <div className="insight-item">
            <h4>📊 Category Analysis</h4>
            <p>
              {analytics.categories.length > 0 ? (
                <>
                  Highest waste category: <strong>{analytics.categories.sort((a, b) => parseFloat(b.wasteRate) - parseFloat(a.wasteRate))[0].name}</strong> ({analytics.categories.sort((a, b) => parseFloat(b.wasteRate) - parseFloat(a.wasteRate))[0].wasteRate}% waste rate).
                  Consider buying smaller quantities or using these items more frequently.
                </>
              ) : (
                'No category data available for analysis.'
              )}
            </p>
          </div>
          <div className="insight-item">
            <h4>💡 Recommendations</h4>
            <p>
              {analytics.topItems.length > 0 ? (
                <>
                  Focus on <strong>{analytics.topItems[0].name}</strong> - it has the highest waste rate. 
                  Consider meal planning or finding alternative uses for this item.
                </>
              ) : (
                'Great job! No significant waste items detected. Keep up the good work!'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAnalytics;
