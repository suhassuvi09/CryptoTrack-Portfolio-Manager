import api from './authService';

export const cryptoService = {
  // Get list of all coins
  getCoins: async (params = {}) => {
    return await api.get('/crypto/coins', { params });
  },

  // Get coin market data with pagination
  getCoinMarkets: async (params = {}) => {
    const {
      vs_currency = 'usd',
      page = 1,
      per_page = 100,
      order = 'market_cap_desc'
    } = params;

    return await api.get('/crypto/markets', {
      params: {
        vs_currency,
        page,
        per_page,
        order,
      },
    });
  },

  // Get detailed data for a specific coin
  getCoin: async (coinId) => {
    return await api.get(`/crypto/coin/${coinId}`);
  },

  // Get prices for multiple coins
  getPrices: async (coinIds, vs_currency = 'usd') => {
    return await api.post('/crypto/prices', 
      { coinIds }, 
      { params: { vs_currency } }
    );
  },

  // Get market data for specific coins by IDs
  getCoinsByIds: async (coinIds, vs_currency = 'usd') => {
    const idsString = Array.isArray(coinIds) ? coinIds.join(',') : coinIds;
    return await api.get('/crypto/coins/by-ids', {
      params: {
        ids: idsString,
        vs_currency,
      },
    });
  },

  // Get price history for a coin
  getCoinHistory: async (coinId, vs_currency = 'usd', days = 7) => {
    return await api.get(`/crypto/history/${coinId}`, {
      params: {
        vs_currency,
        days,
      },
    });
  },

  // Search for coins
  searchCoins: async (query) => {
    return await api.get('/crypto/search', {
      params: { q: query },
    });
  },

  // Get trending coins
  getTrendingCoins: async () => {
    return await api.get('/crypto/trending');
  },

  // Get global market data
  getGlobalData: async () => {
    return await api.get('/crypto/global');
  },

  // Get cache statistics (development only)
  getCacheStats: async () => {
    return await api.get('/crypto/cache/stats');
  },

  // Clear cache (development only)
  clearCache: async () => {
    return await api.post('/crypto/cache/clear');
  },
};

export default cryptoService;