import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WastedItems.css';

const WastedItems = () => {
  const [groceryData, setGroceryData] = useState([]);
  const [wastedAmounts, setWastedAmounts] = useState({});
  const [wastedAmountsLoading, setWastedAmountsLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroceryData();
  }, []);

  const fetchGroceryData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/groceryItems');
      const allItems = response.data;
      setGroceryData(allItems);
      setError(null);
      
      // Filter expired items immediately
      const expiredItems = allItems.filter(item => item.status === 'expired');
      
      // Set optimistic values immediately for better UX
      if (expiredItems.length > 0) {
        const optimisticAmounts = {};
        const loadingStates = {};
        
        expiredItems.forEach(item => {
          // Set optimistic default based on category and quantity
          let defaultAmount = 2.50; // Base default
          
          if (item.category === 'Meat' || item.category === 'Protein') {
            defaultAmount = 6.00;
          } else if (item.category === 'Dairy') {
            defaultAmount = 3.50;
          } else if (item.category === 'Fruits' || item.category === 'Vegetables') {
            defaultAmount = 2.00;
          } else if (item.category === 'Grains' || item.category === 'Pantry') {
            defaultAmount = 2.75;
          } else if (item.category === 'Beverages') {
            defaultAmount = 2.25;
          }
          
          optimisticAmounts[item.productName] = defaultAmount * item.quantity;
          loadingStates[item.productName] = true;
        });
        
        // Set optimistic values immediately
        setWastedAmounts(optimisticAmounts);
        setWastedAmountsLoading(loadingStates);
        
        // Calculate real amounts in background (non-blocking)
        calculateWastedAmounts(expiredItems);
      }
    } catch (err) {
      console.error('Error fetching grocery data:', err);
      setError('Failed to load grocery data');
    } finally {
      setLoading(false);
    }
  };

  const calculateWastedAmounts = async (expiredItems) => {
    try {
      // Fetch real data from backend
      const response = await axios.post('http://localhost:3001/analytics/calculate-wasted-amount', {
        expiredItems: expiredItems
      });
      
      if (response.data.success) {
        const amountsMap = {};
        const loadingMap = {};
        response.data.items.forEach(item => {
          amountsMap[item.productName] = item.totalWastedAmount;
          loadingMap[item.productName] = false;
        });
        setWastedAmounts(amountsMap);
        setWastedAmountsLoading(loadingMap);
      }
    } catch (error) {
      console.error('Error calculating wasted amounts:', error);
      // Keep optimistic values on error, just remove loading state
      const loadingMap = {};
      expiredItems.forEach(item => {
        loadingMap[item.productName] = false;
      });
      setWastedAmountsLoading(loadingMap);
    }
  };

  // Memoize expired items calculation to avoid re-filtering on every render
  const expiredItems = React.useMemo(() => 
    groceryData.filter(item => item.status === 'expired'), 
    [groceryData]
  );

  // Memoize total calculation to avoid re-calculating on every render
  const totalWastedAmount = React.useMemo(() => 
    Object.values(wastedAmounts).reduce((sum, amount) => sum + (amount || 0), 0).toFixed(2),
    [wastedAmounts]
  );

  if (loading) {
    return (
      <div className="wasted-items-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading wasted items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wasted-items-container">
        <div className="error-container">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wasted-items-container">
      <div className="wasted-items-header">
        <h1>🗑️ Wasted Items</h1>
        <p>Track your food waste and its financial impact</p>
      </div>

      <div className="waste-items-header">
        <h3>Wasted Items ({expiredItems.length})</h3>
        <div className="waste-summary">
          <span className="waste-total">
            Total: ${totalWastedAmount}
          </span>
        </div>
      </div>
      
      <table className="waste-items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Expiry Date</th>
            <th>Days Expired</th>
            <th>Quantity</th>
            <th>Amount Wasted</th>
          </tr>
        </thead>
        <tbody>
          {expiredItems.length > 0 ? (
            expiredItems.map((item, index) => {
              const expiryDate = new Date(item.expiryDate);
              const today = new Date();
              const daysExpired = Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24));
              return (
                <tr key={item._id}>
                  <td>{item.productName}</td>
                  <td>{item.category}</td>
                  <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td>
                    <span className="days-expired">
                      {daysExpired} day{daysExpired !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className="amount-wasted">
                      {wastedAmounts[item.productName] ? (
                        <span className={wastedAmountsLoading[item.productName] ? 'amount-loading' : 'amount-final'}>
                          ${wastedAmounts[item.productName].toFixed(2)}
                          {wastedAmountsLoading[item.productName] && <span className="loading-indicator">⏳</span>}
                        </span>
                      ) : (
                        <span className="amount-placeholder">$0.00</span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No expired items found. Great job managing your groceries!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WastedItems;
