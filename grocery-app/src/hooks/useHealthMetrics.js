import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

export const useHealthMetrics = () => {
  const [healthMetrics, setHealthMetrics] = useState({
    sugarLevel: '',
    cholesterol: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    weight: '',
    height: ''
  });
  
  const [latestMetrics, setLatestMetrics] = useState({
    sugarLevel: null,
    cholesterol: null,
    bloodPressureSystolic: null,
    bloodPressureDiastolic: null,
    weight: null,
    height: null,
    lastUpdated: null
  });
  
  const [healthAnalysis, setHealthAnalysis] = useState({
    riskLevel: null,
    risks: [],
    recommendations: [],
    avoidItems: [],
    preferredItems: []
  });
  
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Fetch latest health metrics
  const fetchLatestMetrics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.HEALTH_METRICS}`);
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
    } catch (err) {
      console.error('Error fetching latest metrics:', err);
    }
  }, []);

  // Fetch health analysis
  const fetchHealthAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.HEALTH_RISK_ANALYSIS}`);
      if (response.data.success) {
        setHealthAnalysis(response.data.analysis);
      }
    } catch (err) {
      console.error('Error fetching health analysis:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // Update health metrics
  const updateHealthMetrics = useCallback(async (metricsData) => {
    setLoading(true);
    setError(null);
    setMessage('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.HEALTH_UPDATE}`, metricsData);
      
      if (response.data.success) {
        setMessage('Health metrics updated successfully');
        await fetchLatestMetrics();
        await fetchHealthAnalysis();
        return { success: true, data: response.data.data };
      } else {
        throw new Error('Failed to update health metrics');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update health metrics';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchLatestMetrics, fetchHealthAnalysis]);

  // Upload PDF and extract health metrics
  const uploadPDF = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setMessage('');
    
    try {
      const formData = new FormData();
      formData.append('pdfFile', file);
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.HEALTH_PDF_EXTRACT}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setMessage('Health metrics extracted successfully from PDF');
        setHealthMetrics(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(response.data.data).map(([key, value]) => [
              key, 
              value !== null && value !== undefined ? value.toString() : ''
            ])
          )
        }));
        return { success: true, data: response.data.data };
      } else {
        setMessage(response.data.message || 'Failed to extract health metrics from PDF');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to upload PDF';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get health facts
  const getHealthFacts = useCallback(async (topic, count = 5) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.HEALTH_FACTS}`, {
        topic,
        count
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.facts };
      } else {
        throw new Error('Failed to get health facts');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get health facts';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Handle metrics change
  const handleMetricsChange = useCallback((e) => {
    const { name, value } = e.target;
    setHealthMetrics(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Validate health metrics
  const validateHealthMetrics = useCallback((metrics) => {
    const errors = [];
    
    if (metrics.sugarLevel && (metrics.sugarLevel < 0 || metrics.sugarLevel > 500)) {
      errors.push('Blood sugar level must be between 0 and 500 mg/dL');
    }
    
    if (metrics.cholesterol && (metrics.cholesterol < 0 || metrics.cholesterol > 1000)) {
      errors.push('Cholesterol must be between 0 and 1000 mg/dL');
    }
    
    if (metrics.bloodPressureSystolic && (metrics.bloodPressureSystolic < 50 || metrics.bloodPressureSystolic > 250)) {
      errors.push('Systolic blood pressure must be between 50 and 250 mmHg');
    }
    
    if (metrics.bloodPressureDiastolic && (metrics.bloodPressureDiastolic < 30 || metrics.bloodPressureDiastolic > 150)) {
      errors.push('Diastolic blood pressure must be between 30 and 150 mmHg');
    }
    
    if (metrics.weight && (metrics.weight < 20 || metrics.weight > 500)) {
      errors.push('Weight must be between 20 and 500 lbs');
    }
    
    if (metrics.height && (metrics.height < 36 || metrics.height > 96)) {
      errors.push('Height must be between 36 and 96 inches');
    }
    
    return errors;
  }, []);

  // Clear message
  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchLatestMetrics();
    fetchHealthAnalysis();
  }, [fetchLatestMetrics, fetchHealthAnalysis]);

  return {
    // State
    healthMetrics,
    latestMetrics,
    healthAnalysis,
    loading,
    analysisLoading,
    error,
    message,
    
    // Actions
    updateHealthMetrics,
    uploadPDF,
    getHealthFacts,
    handleMetricsChange,
    validateHealthMetrics,
    clearMessage,
    clearError,
    
    // Utilities
    fetchLatestMetrics,
    fetchHealthAnalysis
  };
};
