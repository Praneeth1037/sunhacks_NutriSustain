const mongoose = require('mongoose');

const pdfReportSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const sugarHealthSchema = new mongoose.Schema({
  hbA1c: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: null
  },
  pdfReports: [pdfReportSchema]
}, {
  timestamps: true
});

// Ensure only one document exists
sugarHealthSchema.index({}, { unique: true });

module.exports = mongoose.model('SugarHealth', sugarHealthSchema);
