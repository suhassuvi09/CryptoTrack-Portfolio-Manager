import api from './authService';

export const portfolioService = {
  // Get complete portfolio with current prices
  getPortfolio: async () => {
    return await api.get('/portfolio');
  },

  // Get portfolio summary (lightweight)
  getPortfolioSummary: async () => {
    return await api.get('/portfolio/summary');
  },

  // Get portfolio analytics
  getPortfolioAnalytics: async () => {
    return await api.get('/portfolio/analytics');
  },

  // Add new holding
  addHolding: async (holdingData) => {
    return await api.post('/portfolio/holdings', holdingData);
  },

  // Get specific holding by ID
  getHolding: async (holdingId) => {
    return await api.get(`/portfolio/holdings/${holdingId}`);
  },

  // Update holding
  updateHolding: async (holdingId, holdingData) => {
    return await api.put(`/portfolio/holdings/${holdingId}`, holdingData);
  },

  // Delete holding
  deleteHolding: async (holdingId) => {
    return await api.delete(`/portfolio/holdings/${holdingId}`);
  },

  // Export portfolio as CSV
  exportCSV: async () => {
    return await api.get('/portfolio/export/csv', { responseType: 'blob' });
  },

  // Export portfolio data for PDF
  exportPDFData: async () => {
    return await api.get('/portfolio/export/pdf');
  },
};

export default portfolioService;