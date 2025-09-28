require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const WebSocket = require('ws');
const http = require('http');
const connectDB = require('./config/database');

// Import routes
const groceryRoutes = require('./routes/grocery');
const recipeRoutes = require('./routes/recipes');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');

// Import utilities
const { checkExpiringItems } = require('./utils/expiryChecker');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make WebSocket server globally available
global.wss = wss;

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/groceryItems', groceryRoutes);
app.use('/recipes', recipeRoutes);
app.use('/health-metrics', healthRoutes);
app.use('/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NutriSustain Backend API',
    version: '1.0.0',
    endpoints: {
      grocery: '/groceryItems',
      recipes: '/recipes',
      health: '/health-metrics',
      analytics: '/analytics'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Schedule daily expiry check at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running scheduled expiry check...');
  checkExpiringItems();
});

// Run initial expiry check on startup
checkExpiringItems();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${PORT}`);
  console.log('Daily expiry check scheduled for 9 AM');
  
  // Check API configurations
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
    console.log('✅ Azure OpenAI configured - AI recipe generation enabled');
  } else {
    console.log('⚠️  Azure OpenAI not configured - set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY');
    console.log('   Using predefined recipes only');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
