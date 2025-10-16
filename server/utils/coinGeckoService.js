const axios = require('axios');

class CoinGeckoService {
  constructor() {
    this.baseURL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoTrack/1.0'
      }
    });
    
    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('CoinGecko API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }
  
  // Helper method to check cache
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }
  
  // Helper method to set cache
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  // Get list of all coins
  async getCoins() {
    const cacheKey = 'coins_list';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/coins/list');
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch coins list');
    }
  }
  
  // Get coin market data with pagination
  async getCoinMarkets(options = {}) {
    const {
      vs_currency = 'usd',
      order = 'market_cap_desc',
      per_page = 100,
      page = 1,
      sparkline = false,
      price_change_percentage = '24h'
    } = options;
    
    const cacheKey = `markets_${vs_currency}_${page}_${per_page}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/coins/markets', {
        params: {
          vs_currency,
          order,
          per_page,
          page,
          sparkline,
          price_change_percentage
        }
      });
      
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch coin market data');
    }
  }
  
  // Get specific coin data
  async getCoin(coinId) {
    const cacheKey = `coin_${coinId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });
      
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data for coin: ${coinId}`);
    }
  }
  
  // Get multiple coins data by IDs
  async getCoinsByIds(coinIds, vs_currency = 'usd') {
    if (!coinIds || coinIds.length === 0) return [];
    
    const cacheKey = `coins_${coinIds.join(',')}_${vs_currency}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/coins/markets', {
        params: {
          ids: coinIds.join(','),
          vs_currency,
          order: 'market_cap_desc',
          per_page: coinIds.length,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h,7d,30d'
        }
      });
      
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch coins data');
    }
  }
  
  // Get simple price for multiple coins
  async getSimplePrices(coinIds, vs_currencies = ['usd']) {
    if (!coinIds || coinIds.length === 0) return {};
    
    const cacheKey = `prices_${coinIds.join(',')}_${vs_currencies.join(',')}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: vs_currencies.join(','),
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true,
          include_last_updated_at: true
        }
      });
      
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch simple prices');
    }
  }
  
  // Get coin price history
  async getCoinHistory(coinId, vs_currency = 'usd', days = 7) {
    const cacheKey = `history_${coinId}_${vs_currency}_${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency,
          days,
          interval: days <= 1 ? 'hourly' : 'daily'
        }
      });
      
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch price history for ${coinId}`);
    }
  }
  
  // Search coins
  async searchCoins(query) {
    if (!query || query.trim().length < 2) return [];
    
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/search', {
        params: { query }
      });
      
      const results = response.data.coins || [];
      this.setCachedData(cacheKey, results);
      return results;
    } catch (error) {
      throw new Error('Failed to search coins');
    }
  }
  
  // Get trending coins
  async getTrendingCoins() {
    const cacheKey = 'trending_coins';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/search/trending');
      const trending = response.data.coins || [];
      this.setCachedData(cacheKey, trending);
      return trending;
    } catch (error) {
      throw new Error('Failed to fetch trending coins');
    }
  }
  
  // Get global market data
  async getGlobalData() {
    const cacheKey = 'global_data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await this.api.get('/global');
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch global market data');
    }
  }
  
  // Clear cache (useful for testing or force refresh)
  clearCache() {
    this.cache.clear();
  }
  
  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create and export a singleton instance
const coinGeckoService = new CoinGeckoService();

module.exports = coinGeckoService;