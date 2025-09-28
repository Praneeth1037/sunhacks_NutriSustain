const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const { generateHealthAnalysis, extractHealthMetricsFromPDF } = require('../services/healthService');
const router = express.Router();

// Health Metrics Schema
const healthMetricsSchema = new mongoose.Schema({
  sugarLevel: Number,
  cholesterol: Number,
  bloodPressureSystolic: Number,
  bloodPressureDiastolic: Number,
  weight: Number,
  height: Number,
  lastUpdated: Date
});

const HealthMetrics = mongoose.model('HealthMetrics', healthMetricsSchema, 'sugarhealths');

// Multer configuration for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/sugar-reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `sugar-report-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Update health metrics
router.post('/update', async (req, res) => {
  try {
    const { sugarLevel, cholesterol, bloodPressureSystolic, bloodPressureDiastolic, weight, height, lastUpdated } = req.body;
    
    const healthData = {
      sugarLevel: sugarLevel ? parseFloat(sugarLevel) : null,
      cholesterol: cholesterol ? parseFloat(cholesterol) : null,
      bloodPressureSystolic: bloodPressureSystolic ? parseFloat(bloodPressureSystolic) : null,
      bloodPressureDiastolic: bloodPressureDiastolic ? parseFloat(bloodPressureDiastolic) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date()
    };
    
    const newMetrics = new HealthMetrics(healthData);
    const savedMetrics = await newMetrics.save();
    
    console.log('New health metrics created in database:', savedMetrics);
    
    res.json({
      success: true,
      message: 'Health metrics created successfully',
      data: savedMetrics
    });
  } catch (error) {
    console.error('Error creating health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health metrics'
    });
  }
});

// Get latest health metrics
router.get('/', async (req, res) => {
  try {
    const healthMetrics = await HealthMetrics.findOne().sort({ lastUpdated: -1 });
    
    res.json({
      success: true,
      data: healthMetrics || {
        sugarLevel: null,
        cholesterol: null,
        bloodPressureSystolic: null,
        bloodPressureDiastolic: null,
        weight: null,
        height: null,
        lastUpdated: null
      }
    });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health metrics'
    });
  }
});

// Health risk analysis
router.get('/risk-analysis', async (req, res) => {
  try {
    console.log('Starting health risk analysis...');
    
    // Get latest health metrics
    const healthMetrics = await HealthMetrics.findOne().sort({ lastUpdated: -1 });
    console.log('Health metrics found:', healthMetrics ? 'Yes' : 'No');
    
    // Get all grocery items
    const GroceryItem = require('../models/GroceryItem');
    const groceryItems = await GroceryItem.find();
    console.log('Grocery items found:', groceryItems.length);
    
    if (!healthMetrics) {
      return res.json({
        success: true,
        analysis: {
          riskLevel: 'Unknown',
          risks: ['No health data available'],
          recommendations: ['Please enter your health metrics to get personalized recommendations'],
          avoidItems: [],
          preferredItems: []
        }
      });
    }
    
    const analysis = await generateHealthAnalysis(healthMetrics, groceryItems);
    console.log('Health risk analysis completed:', analysis);
    
    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error in health risk analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform health risk analysis'
    });
  }
});

// PDF health metrics extraction
router.post('/extract-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }
    
    console.log('PDF uploaded:', req.file.filename);
    
    const pdfPath = req.file.path;
    const extractedMetrics = await extractHealthMetricsFromPDF(pdfPath);
    
    // Clean up uploaded file
    fs.unlinkSync(pdfPath);
    
    // Check if any valid metrics were extracted
    const hasValidMetrics = Object.values(extractedMetrics).some(value => 
      value !== null && value !== undefined && value !== ''
    );
    
    if (!hasValidMetrics) {
      return res.json({
        success: false,
        message: 'PDF uploaded but no health metrics could be extracted. The PDF may be corrupted, password-protected, or contain no readable text. Please enter the values manually.',
        data: extractedMetrics
      });
    }
    
    res.json({
      success: true,
      message: 'Health metrics extracted successfully from PDF',
      data: extractedMetrics
    });
  } catch (error) {
    console.error('Error extracting PDF:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to extract health metrics from PDF',
      error: error.message
    });
  }
});

// Health facts generation
router.post('/facts', async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    
    console.log('Generating health facts for topic:', topic);
    
    const { generateHealthFacts } = require('../services/healthService');
    const facts = await generateHealthFacts(topic, count);
    
    res.json({ success: true, facts });
  } catch (error) {
    console.error('Error generating health facts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate health facts',
      error: error.message 
    });
  }
});

module.exports = router;
