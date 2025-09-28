import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './SugarHealthTracker.css';

const SugarHealthTracker = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // New health metrics state
  const [healthMetrics, setHealthMetrics] = useState({
    sugarLevel: '',
    cholesterol: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    weight: '',
    height: ''
  });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsMessage, setMetricsMessage] = useState('');
  
  // Latest health metrics for display
  const [latestMetrics, setLatestMetrics] = useState({
    sugarLevel: null,
    cholesterol: null,
    bloodPressureSystolic: null,
    bloodPressureDiastolic: null,
    weight: null,
    height: null,
    lastUpdated: null
  });

  // Health risk analysis state
  const [healthAnalysis, setHealthAnalysis] = useState({
    riskLevel: null,
    risks: [],
    recommendations: [],
    avoidItems: [],
    preferredItems: []
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Load existing health metrics on component mount
  useEffect(() => {
    fetchLatestMetrics();
    fetchHealthAnalysis();
  }, []);

  const fetchLatestMetrics = async () => {
    try {
      const response = await axios.get('http://localhost:3001/health-metrics');
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setLatestMetrics({
          sugarLevel: data.sugarLevel,
          cholesterol: data.cholesterol,
          bloodPressureSystolic: data.bloodPressureSystolic,
          bloodPressureDiastolic: data.bloodPressureDiastolic,
          weight: data.weight,
          height: data.height,
          lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null
        });
      }
    } catch (error) {
      console.error('Error fetching latest metrics:', error);
    }
  };

  const fetchHealthAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      const response = await axios.get('http://localhost:3001/health-risk-analysis');
      if (response.data.success && response.data.data) {
        setHealthAnalysis(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching health analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };


  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMetricsMessage('Please upload a PDF file only.');
      return;
    }

    setPdfFile(file);
    setMetricsLoading(true);
    setMetricsMessage('');

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);

      const response = await axios.post('http://localhost:3001/health-metrics/extract-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        console.log('PDF uploaded and health metrics extracted successfully!');
        
        // Auto-populate form fields with extracted data
        const extractedData = response.data.data;
        
        // Check if any metrics were actually extracted
        const hasValidMetrics = Object.values(extractedData).some(value => value !== null && value !== '');
        
        if (hasValidMetrics) {
          setHealthMetrics({
            sugarLevel: extractedData.sugarLevel ? extractedData.sugarLevel.toString() : '',
            cholesterol: extractedData.cholesterol ? extractedData.cholesterol.toString() : '',
            bloodPressureSystolic: extractedData.bloodPressureSystolic ? extractedData.bloodPressureSystolic.toString() : '',
            bloodPressureDiastolic: extractedData.bloodPressureDiastolic ? extractedData.bloodPressureDiastolic.toString() : '',
            weight: extractedData.weight ? extractedData.weight.toString() : '',
            height: extractedData.height ? extractedData.height.toString() : ''
          });
          
          setMetricsMessage('Health metrics extracted from PDF and populated in form. Please review and submit.');
        } else {
          setMetricsMessage('PDF uploaded but no health metrics could be extracted. The PDF may be corrupted, password-protected, or contain no readable text. Please enter the values manually.');
        }
        
        // Update latest metrics display
        setLatestMetrics(prev => ({
          ...prev,
          sugarLevel: extractedData.sugarLevel || prev.sugarLevel,
          cholesterol: extractedData.cholesterol || prev.cholesterol,
          bloodPressureSystolic: extractedData.bloodPressureSystolic || prev.bloodPressureSystolic,
          bloodPressureDiastolic: extractedData.bloodPressureDiastolic || prev.bloodPressureDiastolic,
          weight: extractedData.weight || prev.weight,
          height: extractedData.height || prev.height,
          lastUpdated: new Date()
        }));
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setMetricsMessage('Failed to extract health metrics from PDF. Please try again or enter manually.');
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setMetricsMessage('');
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear form fields
    setHealthMetrics({
      sugarLevel: '',
      cholesterol: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      weight: '',
      height: ''
    });
  };


  // Health metrics handlers
  const handleMetricsChange = (e) => {
    const { name, value } = e.target;
    setHealthMetrics(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateHealthMetrics = () => {
    const errors = [];
    
    if (healthMetrics.sugarLevel && (isNaN(healthMetrics.sugarLevel) || healthMetrics.sugarLevel < 0 || healthMetrics.sugarLevel > 500)) {
      errors.push('Sugar level must be between 0-500 mg/dL');
    }
    
    if (healthMetrics.cholesterol && (isNaN(healthMetrics.cholesterol) || healthMetrics.cholesterol < 0 || healthMetrics.cholesterol > 1000)) {
      errors.push('Cholesterol must be between 0-1000 mg/dL');
    }
    
    if (healthMetrics.bloodPressureSystolic && (isNaN(healthMetrics.bloodPressureSystolic) || healthMetrics.bloodPressureSystolic < 50 || healthMetrics.bloodPressureSystolic > 250)) {
      errors.push('Systolic blood pressure must be between 50-250 mmHg');
    }
    
    if (healthMetrics.bloodPressureDiastolic && (isNaN(healthMetrics.bloodPressureDiastolic) || healthMetrics.bloodPressureDiastolic < 30 || healthMetrics.bloodPressureDiastolic > 150)) {
      errors.push('Diastolic blood pressure must be between 30-150 mmHg');
    }
    
    if (healthMetrics.weight && (isNaN(healthMetrics.weight) || healthMetrics.weight < 20 || healthMetrics.weight > 500)) {
      errors.push('Weight must be between 20-500 lbs');
    }
    
    if (healthMetrics.height && (isNaN(healthMetrics.height) || healthMetrics.height < 36 || healthMetrics.height > 96)) {
      errors.push('Height must be between 36-96 inches');
    }
    
    return errors;
  };

  const handleMetricsSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateHealthMetrics();
    if (errors.length > 0) {
      setMetricsMessage(errors.join(', '));
      return;
    }

    setMetricsLoading(true);
    setMetricsMessage('');

    try {
      const response = await axios.post('http://localhost:3001/health-metrics/update', {
        ...healthMetrics,
        lastUpdated: new Date().toISOString()
      });

      if (response.data.success) {
        setMetricsMessage('Health metrics updated successfully!');
        
        // Update latest metrics for display with new data
        setLatestMetrics(prev => ({
          ...prev,
          sugarLevel: healthMetrics.sugarLevel || prev.sugarLevel,
          cholesterol: healthMetrics.cholesterol || prev.cholesterol,
          bloodPressureSystolic: healthMetrics.bloodPressureSystolic || prev.bloodPressureSystolic,
          bloodPressureDiastolic: healthMetrics.bloodPressureDiastolic || prev.bloodPressureDiastolic,
          weight: healthMetrics.weight || prev.weight,
          height: healthMetrics.height || prev.height,
          lastUpdated: new Date()
        }));

        // Refresh health analysis with new data
        fetchHealthAnalysis();
        
        // Clear form
        setHealthMetrics({
          sugarLevel: '',
          cholesterol: '',
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          weight: '',
          height: ''
        });
      }
    } catch (error) {
      console.error('Error updating health metrics:', error);
      setMetricsMessage('Failed to update health metrics. Please try again.');
    } finally {
      setMetricsLoading(false);
    }
  };

  return (
    <div className="sugar-health-tracker">
      <div className="sugar-header">
        <h3>💊 Health Intelligence</h3>
      </div>

      <div className="sugar-content">
        {/* Health Metrics Section */}
        <div className="health-metrics-section">
          <div className="metrics-header">
            <h4 className="metrics-title">Health Metrics</h4>
            <div className="metrics-subtitle">Enter your current health measurements</div>
          </div>
          
          <form onSubmit={handleMetricsSubmit} className="health-metrics-form">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-content">
                  <label htmlFor="sugarLevel" className="metric-label">Blood Sugar Level</label>
                  <div className="metric-input-container">
                    <input
                      type="number"
                      id="sugarLevel"
                      name="sugarLevel"
                      value={healthMetrics.sugarLevel}
                      onChange={handleMetricsChange}
                      placeholder="e.g., 120"
                      min="0"
                      max="500"
                      className="metric-input"
                    />
                    <span className="metric-unit">mg/dL</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-content">
                  <label htmlFor="cholesterol" className="metric-label">Cholesterol</label>
                  <div className="metric-input-container">
                    <input
                      type="number"
                      id="cholesterol"
                      name="cholesterol"
                      value={healthMetrics.cholesterol}
                      onChange={handleMetricsChange}
                      placeholder="e.g., 200"
                      min="0"
                      max="1000"
                      className="metric-input"
                    />
                    <span className="metric-unit">mg/dL</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-content">
                  <label htmlFor="bloodPressureSystolic" className="metric-label">Blood Pressure - Systolic</label>
                  <div className="metric-input-container">
                    <input
                      type="number"
                      id="bloodPressureSystolic"
                      name="bloodPressureSystolic"
                      value={healthMetrics.bloodPressureSystolic}
                      onChange={handleMetricsChange}
                      placeholder="e.g., 120"
                      min="50"
                      max="250"
                      className="metric-input"
                    />
                    <span className="metric-unit">mmHg</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-content">
                  <label htmlFor="bloodPressureDiastolic" className="metric-label">Blood Pressure - Diastolic</label>
                  <div className="metric-input-container">
                    <input
                      type="number"
                      id="bloodPressureDiastolic"
                      name="bloodPressureDiastolic"
                      value={healthMetrics.bloodPressureDiastolic}
                      onChange={handleMetricsChange}
                      placeholder="e.g., 80"
                      min="30"
                      max="150"
                      className="metric-input"
                    />
                    <span className="metric-unit">mmHg</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-content">
                  <label htmlFor="weight" className="metric-label">Weight</label>
                  <div className="metric-input-container">
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={healthMetrics.weight}
                      onChange={handleMetricsChange}
                      placeholder="e.g., 150"
                      min="20"
                      max="500"
                      step="0.1"
                      className="metric-input"
                    />
                    <span className="metric-unit">lbs</span>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-content">
                  <label htmlFor="height" className="metric-label">Height</label>
                  <div className="metric-input-container">
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={healthMetrics.height}
                      onChange={handleMetricsChange}
                      placeholder="e.g., 65"
                      min="36"
                      max="96"
                      step="0.1"
                      className="metric-input"
                    />
                    <span className="metric-unit">inches</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={metricsLoading} className="submit-btn">
                <span className="btn-icon">💾</span>
                <span className="btn-text">{metricsLoading ? 'Submitting...' : 'Submit'}</span>
                {metricsLoading && <div className="btn-spinner"></div>}
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePdfUpload}
                accept=".pdf"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
              >
                <span className="btn-icon">📄</span>
                <span className="btn-text">Upload PDF</span>
              </button>
            </div>
            
            {pdfFile && (
              <div className="file-info">
                <div className="file-details">
                  <span className="file-icon">📄</span>
                  <span className="file-name">Selected: {pdfFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePdf}
                  className="remove-pdf-btn"
                  title="Remove PDF"
                >
                  ✕
                </button>
              </div>
            )}
          </form>
          
          {metricsMessage && (
            <div className={`message ${metricsMessage.includes('Error') || metricsMessage.includes('must be') ? 'error' : 'success'}`}>
              <span className="message-icon">{metricsMessage.includes('Error') || metricsMessage.includes('must be') ? '❌' : '✅'}</span>
              <span className="message-text">{metricsMessage}</span>
            </div>
          )}
        </div>

        {/* Health Summary Section */}
        <div className="health-summary-section">
          <div className="summary-header">
            <h4 className="summary-title">Latest Health Metrics</h4>
            <div className="summary-subtitle">Your most recent health data</div>
          </div>
          
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">🩸</div>
              <div className="summary-content">
                <span className="summary-label">Blood Sugar Level</span>
                <span className="summary-value">
                  {latestMetrics.sugarLevel ? `${latestMetrics.sugarLevel} mg/dL` : 'Not recorded'}
                </span>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">❤️</div>
              <div className="summary-content">
                <span className="summary-label">Cholesterol</span>
                <span className="summary-value">
                  {latestMetrics.cholesterol ? `${latestMetrics.cholesterol} mg/dL` : 'Not recorded'}
                </span>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">🫀</div>
              <div className="summary-content">
                <span className="summary-label">Blood Pressure</span>
                <span className="summary-value">
                  {latestMetrics.bloodPressureSystolic && latestMetrics.bloodPressureDiastolic 
                    ? `${latestMetrics.bloodPressureSystolic}/${latestMetrics.bloodPressureDiastolic} mmHg` 
                    : 'Not recorded'}
                </span>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">⚖️</div>
              <div className="summary-content">
                <span className="summary-label">Weight</span>
                <span className="summary-value">
                  {latestMetrics.weight ? `${latestMetrics.weight} lbs` : 'Not recorded'}
                </span>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">📏</div>
              <div className="summary-content">
                <span className="summary-label">Height</span>
                <span className="summary-value">
                  {latestMetrics.height ? `${latestMetrics.height} inches` : 'Not recorded'}
                </span>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">📅</div>
              <div className="summary-content">
                <span className="summary-label">Last Date Updated</span>
                <span className="summary-value">
                  {latestMetrics.lastUpdated ? new Date(latestMetrics.lastUpdated).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  }) : 'Never'}
                </span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Health Risk Analysis Section */}
        <div className="health-analysis-section">
          <div className="analysis-header">
            <h4 className="analysis-title">Health Risk Analysis & Recommendations</h4>
            <div className="analysis-subtitle">AI-Powered Health Insights</div>
          </div>
          
          {analysisLoading ? (
            <div className="loading-analysis">
              <div className="loading-spinner"></div>
              <div className="loading-text">Analyzing your health data...</div>
            </div>
          ) : (
            <div className="analysis-content">
              {healthAnalysis.riskLevel && (
                <div className="risk-level-container">
                  <div className="risk-level-header">
                    <span className="risk-icon">🎯</span>
                    <span className="risk-title">Your Risk Level</span>
                  </div>
                  <div className={`risk-badge ${healthAnalysis.riskLevel.toLowerCase()}`}>
                    <span className="risk-level-text">{healthAnalysis.riskLevel} Risk</span>
                    <div className="risk-indicator"></div>
                  </div>
                </div>
              )}
              
              <div className="analysis-grid">
                {healthAnalysis.risks && healthAnalysis.risks.length > 0 && (
                  <div className="analysis-card risks-card">
                    <div className="card-header">
                      <span className="card-icon">⚠️</span>
                      <h5 className="card-title">Identified Health Risks</h5>
                    </div>
                    <div className="card-content">
                      {healthAnalysis.risks.map((risk, index) => (
                        <div key={index} className="risk-item">
                          <div className="risk-bullet"></div>
                          <span className="risk-text">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {healthAnalysis.avoidItems && healthAnalysis.avoidItems.length > 0 && (
                  <div className="analysis-card avoid-card">
                    <div className="card-header">
                      <span className="card-icon">🚫</span>
                      <h5 className="card-title">Items to Avoid</h5>
                    </div>
                    <div className="card-content">
                      {healthAnalysis.avoidItems.map((item, index) => (
                        <div key={index} className="avoid-item">
                          <div className="item-header">
                            <span className="item-name">
                              {typeof item === 'object' ? item.name : item.split(':')[0]}
                            </span>
                            <span className="avoid-badge">AVOID</span>
                          </div>
                          <div className="item-reason">
                            {typeof item === 'object' ? item.reason : item.split(':')[1]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {healthAnalysis.preferredItems && healthAnalysis.preferredItems.length > 0 && (
                  <div className="analysis-card preferred-card">
                    <div className="card-header">
                      <span className="card-icon">✅</span>
                      <h5 className="card-title">Recommended Items</h5>
                    </div>
                    <div className="card-content">
                      {healthAnalysis.preferredItems.map((item, index) => (
                        <div key={index} className="preferred-item">
                          <div className="item-header">
                            <span className="item-name">
                              {typeof item === 'object' ? item.name : item.split(':')[0]}
                            </span>
                            <span className="preferred-badge">RECOMMENDED</span>
                          </div>
                          <div className="item-reason">
                            {typeof item === 'object' ? item.reason : item.split(':')[1]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {healthAnalysis.recommendations && healthAnalysis.recommendations.length > 0 && (
                  <div className="analysis-card recommendations-card">
                    <div className="card-header">
                      <span className="card-icon">💡</span>
                      <h5 className="card-title">General Recommendations</h5>
                    </div>
                    <div className="card-content">
                      {healthAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="recommendation-item">
                          <div className="rec-bullet"></div>
                          <span className="rec-text">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SugarHealthTracker;
