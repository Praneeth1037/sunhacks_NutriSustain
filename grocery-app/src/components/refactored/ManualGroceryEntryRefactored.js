import React, { useState, useRef } from 'react';
import { useGroceryItems } from '../../hooks/useGroceryItems';
import { useWebSocket } from '../../hooks/useWebSocket';
import { validateGroceryItem, sanitizeInput } from '../../utils/validationUtils';
import { formatDate, getExpiryStatus } from '../../utils/dateUtils';
import { GROCERY_CATEGORIES, EXPIRY_ALERTS } from '../../constants/app';
import ExpiryAlert from '../ExpiryAlert';
import './ManualGroceryEntryRefactored.css';

const ManualGroceryEntryRefactored = ({ expiringItems, onNavigateToRecipes }) => {
  const {
    groceryItems,
    loading,
    error,
    addGroceryItem,
    activeItems,
    expiredItems,
    completedItems,
    getExpiryStatus
  } = useGroceryItems();

  const { lastMessage } = useWebSocket();
  
  const [formData, setFormData] = useState({
    productName: '',
    expiryDate: '',
    quantity: '',
    category: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef(null);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateGroceryItem(formData);
    if (!validation.isValid) {
      const errors = {};
      validation.errors.forEach(error => {
        const field = error.toLowerCase().includes('product name') ? 'productName' :
                     error.toLowerCase().includes('expiry date') ? 'expiryDate' :
                     error.toLowerCase().includes('quantity') ? 'quantity' :
                     error.toLowerCase().includes('category') ? 'category' : 'general';
        errors[field] = error;
      });
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const result = await addGroceryItem({
        ...formData,
        quantity: parseInt(formData.quantity),
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      
      if (result.success) {
        setMessage('Grocery item added successfully!');
        setFormData({
          productName: '',
          expiryDate: '',
          quantity: '',
          category: ''
        });
        setFormErrors({});
      } else {
        setMessage(result.error || 'Failed to add grocery item');
      }
    } catch (err) {
      setMessage('An error occurred while adding the item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapturedImage(file);
      setShowCamera(false);
    }
  };

  // Get expiry alert color
  const getExpiryAlertColor = (daysLeft) => {
    if (daysLeft <= 1) return EXPIRY_ALERTS.URGENT.color;
    if (daysLeft <= 3) return EXPIRY_ALERTS.WARNING.color;
    return EXPIRY_ALERTS.NOTICE.color;
  };

  // Render grocery item
  const renderGroceryItem = (item) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);
    const alertColor = getExpiryAlertColor(expiryStatus.daysLeft);
    
    return (
      <div key={item._id} className="grocery-item">
        <div className="item-info">
          <div className="item-name">
            {expiryStatus.daysLeft <= 5 && (
              <span className="expiry-warning">⚠️</span>
            )}
            {item.productName}
          </div>
          <div className="item-details">
            <span className="item-category">{item.category}</span>
            <span className="item-quantity">Qty: {item.quantity}</span>
            <span className="item-expiry">Expires: {formatDate(item.expiryDate)}</span>
            {expiryStatus.daysLeft > 0 && (
              <span 
                className="days-left" 
                style={{ color: alertColor }}
              >
                {expiryStatus.daysLeft} days left
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="manual-grocery-entry">
      <div className="top-row-container">
        {/* Add New Grocery Item Form */}
        <div className="add-grocery-section">
          <h3>Add New Grocery Item</h3>
          
          <form onSubmit={handleSubmit} className="grocery-form">
            <div className="form-group">
              <label htmlFor="productName">Product Name</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="Enter product name"
                autoComplete="off"
                className={formErrors.productName ? 'error' : ''}
              />
              {formErrors.productName && (
                <span className="error-message">{formErrors.productName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                placeholder="MM/DD/YYYY"
                autoComplete="off"
                className={formErrors.expiryDate ? 'error' : ''}
              />
              {formErrors.expiryDate && (
                <span className="error-message">{formErrors.expiryDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                min="1"
                autoComplete="off"
                className={formErrors.quantity ? 'error' : ''}
              />
              {formErrors.quantity && (
                <span className="error-message">{formErrors.quantity}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={formErrors.category ? 'error' : ''}
              >
                <option value="">Select category</option>
                {GROCERY_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <span className="error-message">{formErrors.category}</span>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </button>
              
              <button 
                type="button" 
                onClick={handleCameraCapture}
                className="camera-btn"
              >
                📷 Camera
              </button>
            </div>
          </form>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Expiry Alert Section */}
        <div className="alert-section">
          <ExpiryAlert 
            expiringItems={expiringItems}
            onNavigateToRecipes={onNavigateToRecipes}
          />
        </div>
      </div>

      {/* Grocery List Section */}
      <div className="grocery-list-section">
        <div className="grocery-list-container">
          {/* Active Items */}
          <div className="grocery-list active-items">
            <h3>Active Items ({activeItems.length})</h3>
            <div className="items-list">
              {activeItems.map(renderGroceryItem)}
            </div>
          </div>

          {/* Expired Items */}
          <div className="grocery-list expired-items">
            <h3>Expired Items ({expiredItems.length})</h3>
            <div className="items-list">
              {expiredItems.map(renderGroceryItem)}
            </div>
          </div>

          {/* Consumed Items */}
          <div className="grocery-list consumed-items">
            <h3>Consumed Items ({completedItems.length})</h3>
            <div className="items-list">
              {completedItems.map(renderGroceryItem)}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal">
          <div className="camera-modal-content">
            <h4>Camera Capture</h4>
            <p>Camera functionality would be implemented here</p>
            <div className="camera-actions">
              <button onClick={() => setShowCamera(false)}>Close</button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button onClick={() => fileInputRef.current?.click()}>
                Upload Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualGroceryEntryRefactored;
