import api from './authService';

export const watchlistService = {
  // Get user's watchlist with coin details
  getWatchlist: async () => {
    return await api.get('/watchlist');
  },

  // Add coin to watchlist
  addToWatchlist: async (coinData) => {
    return await api.post('/watchlist', coinData);
  },

  // Remove coin from watchlist
  removeFromWatchlist: async (coinId) => {
    return await api.delete(`/watchlist/${coinId}`);
  },

  // Add multiple coins to watchlist
  addBatchToWatchlist: async (coinIds) => {
    return await api.post('/watchlist/batch', { coinIds });
  },

  // Reorder coins in watchlist
  reorderWatchlist: async (coinIds) => {
    return await api.put('/watchlist/reorder', { coinIds });
  },

  // Check if coin is in watchlist
  checkInWatchlist: async (coinId) => {
    return await api.get(`/watchlist/check/${coinId}`);
  },

  // Clear entire watchlist
  clearWatchlist: async () => {
    return await api.delete('/watchlist');
  },
};

export default watchlistService;