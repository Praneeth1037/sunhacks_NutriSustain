import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './ManualGroceryEntry.css';
import ExpiryAlert from './ExpiryAlert';

// Sortable Item Component
const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const ManualGroceryEntry = ({ expiringItems = [], onNavigateToRecipes }) => {
  const [formData, setFormData] = useState({
    productName: '',
    expiryDate: '',
    quantity: '',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [cameraFormData, setCameraFormData] = useState({
    productName: '',
    expiryDate: '',
    quantity: '',
    category: ''
  });
  const [groceryItems, setGroceryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const webcamRef = useRef(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categories = [
    'Fruits',
    'Vegetables',
    'Dairy',
    'Meat',
    'Grains',
    'Beverages',
    'Snacks',
    'Frozen',
    'Pantry',
    'Other'
  ];

  useEffect(() => {
    fetchGroceryItems();
  }, []);

  const fetchGroceryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/groceryItems');
      setGroceryItems(response.data);
      setError('');
      console.log('Grocery items fetched:', response.data.length, 'items');
    } catch (error) {
      console.error('Error fetching grocery items:', error);
      setError('Failed to load grocery items');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format date input with slashes
    if (name === 'expiryDate') {
      let formattedValue = value.replace(/\D/g, ''); // Remove non-digits
      
      // Add slashes automatically
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }
      if (formattedValue.length >= 5) {
        formattedValue = formattedValue.substring(0, 5) + '/' + formattedValue.substring(5, 9);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const today = new Date();
      const purchaseDate = formatDate(today);

      const groceryItem = {
        productName: formData.productName,
        expiryDate: formData.expiryDate,
        quantity: parseInt(formData.quantity),
        category: formData.category,
        purchaseDate: purchaseDate
      };

      const response = await axios.post('http://localhost:3001/groceryItems', groceryItem);
      
      if (response.status === 200 || response.status === 201) {
        setMessage('Grocery item added successfully!');
        // Clear form fields
        setFormData({
          productName: '',
          expiryDate: '',
          quantity: '',
          category: ''
        });
        // Refresh the grocery list
        fetchGroceryItems();
      }
    } catch (error) {
      console.error('Error adding grocery item:', error);
      setMessage('Error adding grocery item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.productName.trim() && 
           formData.expiryDate && 
           formData.quantity && 
           formData.category;
  };

  const parseGroceryText = (text) => {
    const result = {
      productName: '',
      expiryDate: '',
      quantity: '',
      category: ''
    };

    console.log('Raw OCR text:', text);
    
    // Clean the text but preserve line breaks for better parsing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const cleanText = text.toLowerCase().replace(/\s+/g, ' ').trim();
    
    console.log('Cleaned lines:', lines);
    
    // Extract product name - look for the most prominent text (usually first or largest text)
    if (lines.length > 0) {
      // Try to find the product name by looking for the longest meaningful line
      let productName = '';
      let maxLength = 0;
      
      for (const line of lines) {
        const cleanLine = line.toLowerCase();
        // Skip lines that are clearly not product names
        const skipPatterns = [
          /expiry|exp|best before|use by|sell by/i,
          /net weight|weight|qty|quantity/i,
          /ingredients|nutrition/i,
          /manufactured|packed|distributed/i,
          /^\d+[\/\-\.]\d+[\/\-\.]\d+$/, // Just dates
          /^\d+\s*(g|kg|lb|lbs|oz|ml|l)$/i, // Just quantities
          /^[0-9\s\/\-\.]+$/ // Just numbers and separators
        ];
        
        const shouldSkip = skipPatterns.some(pattern => pattern.test(cleanLine));
        
        if (!shouldSkip && line.length > maxLength && line.length > 3) {
          productName = line;
          maxLength = line.length;
        }
      }
      
      if (productName) {
        result.productName = productName;
      } else if (lines[0]) {
        // Fallback to first line if no good candidate found
        result.productName = lines[0];
      }
    }

    // Extract expiry date with improved patterns
    const datePatterns = [
      // Look for explicit date labels first
      /(expiry|exp|best before|use by|sell by)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      // Look for date patterns in various formats
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2})/g,
      // Look for dates with month names
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s\-]*\d{1,2}[\s\-]*\d{2,4}/gi
    ];
    
    for (const pattern of datePatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        let dateStr = matches[0][0];
        
        // Clean up the date string
        dateStr = dateStr.replace(/[^\d\/\-\.]/g, '');
        
        // Convert to MM/DD/YYYY format
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3) {
          let month = parts[0].padStart(2, '0');
          let day = parts[1].padStart(2, '0');
          let year = parts[2];
          
          // Handle 2-digit years
          if (year.length === 2) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            year = currentCentury + parseInt(year);
          }
          
          // Validate date
          const date = new Date(year, month - 1, day);
          if (date.getFullYear() == year && date.getMonth() == month - 1 && date.getDate() == day) {
            result.expiryDate = `${month}/${day}/${year}`;
            break;
          }
        }
      }
    }

    // Extract quantity with improved patterns
    const quantityPatterns = [
      // Look for explicit quantity labels
      /(net weight|weight|qty|quantity|size)[\s:]*(\d+(?:\.\d+)?)\s*(g|kg|lb|lbs|oz|ml|l|gram|grams|kilogram|kilograms|pound|pounds|ounce|ounces|liter|liters|milliliter|milliliters)/gi,
      // Look for quantity patterns
      /(\d+(?:\.\d+)?)\s*(g|kg|lb|lbs|oz|ml|l|gram|grams|kilogram|kilograms|pound|pounds|ounce|ounces|liter|liters|milliliter|milliliters)/gi,
      // Look for package sizes
      /(\d+)\s*(pack|count|pieces|items)/gi
    ];
    
    for (const pattern of quantityPatterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        result.quantity = matches[0][0].trim();
        break;
      }
    }

    // Determine category with improved keyword matching
    const categoryKeywords = {
      'Fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'mango', 'pineapple', 'kiwi', 'lemon', 'lime', 'peach', 'pear', 'cherry', 'watermelon', 'melon', 'avocado', 'berry', 'citrus'],
      'Vegetables': ['carrot', 'potato', 'tomato', 'onion', 'lettuce', 'spinach', 'broccoli', 'cauliflower', 'cabbage', 'pepper', 'cucumber', 'celery', 'mushroom', 'corn', 'bean', 'pea', 'asparagus', 'zucchini', 'eggplant'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy', 'mozzarella', 'cheddar', 'parmesan', 'gouda', 'swiss', 'brie', 'feta'],
      'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'meat', 'steak', 'bacon', 'sausage', 'ham', 'deli'],
      'Grains': ['bread', 'rice', 'pasta', 'cereal', 'oats', 'quinoa', 'barley', 'wheat', 'flour', 'grain', 'bagel', 'muffin', 'croissant'],
      'Beverages': ['juice', 'soda', 'water', 'coffee', 'tea', 'beer', 'wine', 'drink', 'beverage', 'smoothie', 'energy drink'],
      'Snacks': ['chips', 'crackers', 'nuts', 'cookies', 'candy', 'chocolate', 'popcorn', 'snack', 'pretzel', 'trail mix'],
      'Frozen': ['frozen', 'ice cream', 'frozen food', 'frozen meal'],
      'Pantry': ['oil', 'vinegar', 'salt', 'sugar', 'spice', 'herb', 'sauce', 'condiment', 'honey', 'syrup', 'jam', 'jelly']
    };

    // Try to match category from product name first
    const productNameLower = result.productName.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => productNameLower.includes(keyword))) {
        result.category = category;
        break;
      }
    }

    // If no category found, try to determine from the full text
    if (!result.category) {
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => cleanText.includes(keyword))) {
          result.category = category;
          break;
        }
      }
    }

    // Default category if still not found
    if (!result.category) {
      result.category = 'Other';
    }

    console.log('Parsed result:', result);
    return result;
  };


  const isCameraFormValid = () => {
    return cameraFormData.productName.trim() && 
           cameraFormData.expiryDate && 
           cameraFormData.quantity && 
           cameraFormData.category;
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowCamera(false);
    
    setMessage('Extracting text from image...');
    
    try {
      // Use Tesseract.js for OCR
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng', {
        logger: m => console.log(m)
      });
      
      console.log('Extracted text:', text);
      
      if (text.trim()) {
        // Parse the extracted text to find grocery information
        const extractedData = parseGroceryText(text);
        
        setCameraFormData({
          productName: extractedData.productName || '',
          expiryDate: extractedData.expiryDate || '',
          quantity: extractedData.quantity || '',
          category: extractedData.category || ''
        });
        
        setMessage('Text extracted from image and populated in form. Please review and submit.');
      } else {
        setMessage('No text found in the image. Please enter the values manually.');
      }
    } catch (error) {
      console.error('Error extracting text from image:', error);
      setMessage('Failed to extract text from image. Please enter the values manually.');
    }
    
    setShowExpiryModal(true);
  }, [webcamRef]);

  const handleCameraInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format date input with slashes
    if (name === 'expiryDate') {
      let formattedValue = value.replace(/\D/g, ''); // Remove non-digits
      
      // Add slashes automatically
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }
      if (formattedValue.length >= 5) {
        formattedValue = formattedValue.substring(0, 5) + '/' + formattedValue.substring(5, 9);
      }
      
      setCameraFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setCameraFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCameraSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const today = new Date();
      const purchaseDate = formatDate(today);

      const groceryItem = {
        productName: cameraFormData.productName,
        expiryDate: cameraFormData.expiryDate,
        quantity: parseInt(cameraFormData.quantity),
        category: cameraFormData.category,
        purchaseDate: purchaseDate,
        imageUrl: capturedImage
      };

      const response = await axios.post('http://localhost:3001/groceryItems', groceryItem);
      
      if (response.status === 200 || response.status === 201) {
        setMessage('Grocery item added successfully!');
        // Clear form fields
        setCameraFormData({
          productName: '',
          expiryDate: '',
          quantity: '',
          category: ''
        });
        setCapturedImage(null);
        setShowExpiryModal(false);
        // Refresh the grocery list
        fetchGroceryItems();
      }
    } catch (error) {
      console.error('Error adding grocery item:', error);
      setMessage('Error adding grocery item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCameraModal = () => {
    setShowCamera(false);
    setCapturedImage(null);
  };

  const closeExpiryModal = () => {
    setShowExpiryModal(false);
    setCapturedImage(null);
    setCameraFormData({
      productName: '',
      expiryDate: '',
      quantity: '',
      category: ''
    });
  };

  // Grocery list functions
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const isExpired = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const isExpiringSoon = (itemId) => {
    return expiringItems.some(item => item.id === itemId);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkCompleted = async (itemId) => {
    try {
      const item = groceryItems.find(item => item._id === itemId);
      if (!item) return;

      console.log('Marking item as completed:', item.productName);

      await axios.put(`http://localhost:3001/groceryItems/${itemId}`, { 
        status: 'completed',
        completedDate: new Date().toISOString()
      });
      
      // Refresh the grocery list immediately
      await fetchGroceryItems();
      console.log('Item marked as completed successfully');
    } catch (error) {
      console.error('Error marking item as completed:', error);
      setError('Failed to mark item as completed');
    }
  };

  const handleMarkActive = async (itemId) => {
    try {
      const item = groceryItems.find(item => item._id === itemId);
      if (!item) return;

      console.log('Marking item as active:', item.productName);

      await axios.put(`http://localhost:3001/groceryItems/${itemId}`, { 
        status: 'active',
        completedDate: null
      });
      
      // Refresh the grocery list immediately
      await fetchGroceryItems();
      console.log('Item marked as active successfully');
    } catch (error) {
      console.error('Error marking item as active:', error);
      setError('Failed to mark item as active');
    }
  };

  const handleDeleteItem = async (itemId) => {
    const item = groceryItems.find(item => item._id === itemId);
    if (!item) return;

    if (window.confirm(`Are you sure you want to delete "${item.productName}"?`)) {
      try {
        console.log('Deleting item:', item.productName);
        
        await axios.delete(`http://localhost:3001/groceryItems/${itemId}`);
        
        // Refresh the grocery list immediately
        await fetchGroceryItems();
        console.log('Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Failed to delete item');
      }
    }
  };

  const sortByExpiryDate = (items) => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.expiryDate);
      const dateB = new Date(b.expiryDate);
      return dateA - dateB;
    });
  };

  // Simple reverse function - just move back to active
  const handleReverse = async (itemId) => {
    try {
      const item = groceryItems.find(item => item._id === itemId);
      if (!item) return;

      console.log('Reversing item to active:', item.productName);
      await handleMarkActive(itemId);
    } catch (error) {
      console.error('Error in reverse:', error);
      setError('Failed to reverse item status');
    }
  };

  // Drag and drop handlers
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const draggedItem = groceryItems.find(item => item._id === active.id);
    const targetItem = groceryItems.find(item => item._id === over.id);

    if (!draggedItem || !targetItem) return;

    // Determine the target category based on the target item's status
    let newStatus = draggedItem.status;
    
    if (targetItem.status === 'completed') {
      newStatus = 'completed';
    } else if (targetItem.status === 'active') {
      // Check if the dragged item is expired
      if (isExpired(draggedItem.expiryDate)) {
        newStatus = 'active'; // Will be filtered to expired
      } else {
        newStatus = 'active';
      }
    }

    // Update the database if status changed
    if (newStatus !== draggedItem.status) {
      try {
        const updateData = {
          status: newStatus,
          completedDate: newStatus === 'completed' ? new Date().toISOString() : null
        };

        await axios.put(`http://localhost:3001/groceryItems/${draggedItem._id}`, updateData);
        
        // Refresh the grocery list
        fetchGroceryItems();
      } catch (error) {
        console.error('Error updating item status:', error);
        setError('Failed to update item status');
      }
    } else {
      // Just reorder within the same category
      const oldIndex = groceryItems.findIndex(item => item._id === active.id);
      const newIndex = groceryItems.findIndex(item => item._id === over.id);

      const newItems = arrayMove(groceryItems, oldIndex, newIndex);
      setGroceryItems(newItems);
    }
  };

  // Filter items by status
  const consumedItems = groceryItems.filter(item => item.status === 'completed');
  const activeItems = groceryItems.filter(item => !isExpired(item.expiryDate) && item.status === 'active');
  const expiredItems = groceryItems.filter(item => item.status === 'expired' || (isExpired(item.expiryDate) && item.status !== 'completed'));

  const sortedActiveItems = sortByExpiryDate(activeItems);
  const sortedExpiredItems = sortByExpiryDate(expiredItems);
  const sortedConsumedItems = sortByExpiryDate(consumedItems);

  return (
    <div className="manual-grocery-entry">
      <h2>Grocery Management</h2>
      
      {/* Top Row: Add Grocery Form and Alert Section */}
      <div className="top-row-container">
        {/* Add Grocery Form */}
        <div className="add-grocery-section">
        <h3>Add New Grocery Item</h3>
        <form onSubmit={handleSubmit} className="grocery-form">
        <div className="form-group">
          <label htmlFor="productName">Product Name:</label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            placeholder="Enter product name"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">Expiry Date (MM/DD/YYYY):</label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
            placeholder="MM/DD/YYYY"
            pattern="\d{2}/\d{2}/\d{4}"
            maxLength="10"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="Enter quantity"
            min="1"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            autoComplete="off"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button 
            type="submit" 
            className="upload-btn"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Upload'}
          </button>
          
          <button 
            type="button" 
            className="camera-btn"
            onClick={() => setShowCamera(true)}
          >
            📷 Scan via Camera
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        </form>
        </div>

        {/* Alert Section */}
        <div className="alert-section">
          <ExpiryAlert onNavigateToRecipes={onNavigateToRecipes} />
        </div>
      </div>

      {/* Bottom Row: Grocery List */}
      <div className="grocery-list-section">
        <h3>Your Groceries</h3>
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        {loading ? (
          <div className="loading">Loading groceries...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grocery-lists-container">
              <SortableContext items={groceryItems.map(item => item._id)} strategy={verticalListSortingStrategy}>
                {/* Active Items */}
                <div className="grocery-category">
                  <h4 className="category-title active">🟢 Active Items ({sortedActiveItems.length})</h4>
                  <SortableContext items={sortedActiveItems.map(item => item._id)} strategy={verticalListSortingStrategy}>
                    <div className="items-list">
                      {sortedActiveItems.map(item => {
                        const daysLeft = getDaysUntilExpiry(item.expiryDate);
                        return (
                          <SortableItem key={item._id} id={item._id}>
                            <div
                              className={`grocery-item active ${daysLeft <= 3 ? 'expiring-soon' : ''}`}
                            >
                          <div className="item-info">
                            <span className="product-name">
                              {daysLeft <= 5 ? '⚠️ ' : ''}{item.productName}
                            </span>
                            <span className="expiry-date">
                              Expires: {formatDateForDisplay(item.expiryDate)}
                              <span className={`days-left ${daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal'}`}>
                                ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                              </span>
                            </span>
                          </div>
                          </div>
                        </SortableItem>
                      );
                    })}
                    {sortedActiveItems.length === 0 && (
                      <div className="empty-state">
                        <p>No active items</p>
                      </div>
                    )}
                    </div>
                  </SortableContext>
                </div>

                {/* Expired Items */}
                <div className="grocery-category">
                  <h4 className="category-title expired">🔴 Expired Items ({sortedExpiredItems.length})</h4>
                  <SortableContext items={sortedExpiredItems.map(item => item._id)} strategy={verticalListSortingStrategy}>
                    <div className="items-list">
                      {sortedExpiredItems.map(item => (
                        <SortableItem key={item._id} id={item._id}>
                          <div className="grocery-item expired">
                            <div className="item-info">
                              <span className="product-name">{item.productName}</span>
                              <span className="expiry-date">Expired: {formatDateForDisplay(item.expiryDate)}</span>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                      {sortedExpiredItems.length === 0 && (
                        <div className="empty-state">
                          <p>No expired items</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>

                {/* Consumed Items */}
                <div className="grocery-category">
                  <h4 className="category-title consumed">✅ Consumed Items ({sortedConsumedItems.length})</h4>
                  <SortableContext items={sortedConsumedItems.map(item => item._id)} strategy={verticalListSortingStrategy}>
                    <div className="items-list">
                      {sortedConsumedItems.map(item => (
                        <SortableItem key={item._id} id={item._id}>
                          <div className="grocery-item consumed">
                            <div className="item-info">
                              <span className="product-name">{item.productName}</span>
                              <span className="expiry-date">Consumed: {formatDateForDisplay(item.completedDate)}</span>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                      {sortedConsumedItems.length === 0 && (
                        <div className="empty-state">
                          <p>No consumed items</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </SortableContext>
            </div>
          </DndContext>
        )}
      </div>


      {/* Camera Modal */}
      {showCamera && (
        <div className="modal-overlay">
          <div className="camera-modal">
            <div className="modal-header">
              <h3>Take Product Photo</h3>
              <button className="close-btn" onClick={closeCameraModal}>×</button>
            </div>
            <div className="camera-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={400}
                height={300}
              />
            </div>
            <div className="camera-instructions">
              <h4>📸 How to get the best results:</h4>
              <ul>
                <li><strong>Product Name:</strong> Make sure the product name is clearly visible</li>
                <li><strong>Expiry Date:</strong> Look for "Expiry", "Best Before", or "Use By" dates</li>
                <li><strong>Quantity:</strong> Include weight/volume info like "500g", "1kg", "2 lbs"</li>
                <li><strong>Good lighting:</strong> Ensure the text is well-lit and readable</li>
                <li><strong>Steady hands:</strong> Hold the camera steady for clear text</li>
              </ul>
              <div className="example-text">
                <strong>Example of good text to capture:</strong><br/>
                "Organic Bananas<br/>
                Expiry: 12/25/2024<br/>
                Net Weight: 2 lbs<br/>
                Fresh Produce"
              </div>
            </div>
            <div className="camera-controls">
              <button className="capture-btn" onClick={capture}>
                📸 Capture Photo
              </button>
              <button className="cancel-btn" onClick={closeCameraModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Date Confirmation Modal */}
      {showExpiryModal && (
        <div className="modal-overlay">
          <div className="expiry-modal">
            <div className="modal-header">
              <h3>Confirm Product Details</h3>
              <button className="close-btn" onClick={closeExpiryModal}>×</button>
            </div>
            
            {capturedImage && (
              <div className="captured-image">
                <img src={capturedImage} alt="Captured product" />
              </div>
            )}
            
            {message && (
              <div className={`message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleCameraSubmit} className="camera-form">
              <div className="form-group">
                <label htmlFor="cameraProductName">Product Name:</label>
                <input
                  type="text"
                  id="cameraProductName"
                  name="productName"
                  value={cameraFormData.productName}
                  onChange={handleCameraInputChange}
                  placeholder="Enter product name"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cameraExpiryDate">Expiry Date (MM/DD/YYYY):</label>
                <input
                  type="text"
                  id="cameraExpiryDate"
                  name="expiryDate"
                  value={cameraFormData.expiryDate}
                  onChange={handleCameraInputChange}
                  placeholder="MM/DD/YYYY"
                  pattern="\d{2}/\d{2}/\d{4}"
                  maxLength="10"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cameraQuantity">Quantity:</label>
                <input
                  type="number"
                  id="cameraQuantity"
                  name="quantity"
                  value={cameraFormData.quantity}
                  onChange={handleCameraInputChange}
                  placeholder="Enter quantity"
                  min="1"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cameraCategory">Category:</label>
                <select
                  id="cameraCategory"
                  name="category"
                  value={cameraFormData.category}
                  onChange={handleCameraInputChange}
                  autoComplete="off"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button 
                  type="submit" 
                  className="upload-btn"
                  disabled={!isCameraFormValid() || isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Upload with Photo'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={closeExpiryModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualGroceryEntry;
