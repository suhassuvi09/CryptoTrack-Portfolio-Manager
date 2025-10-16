const express = require('express');
const { query, validationResult } = require('express-validator');
const coinGeckoService = require('../utils/coinGeckoService');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// @route   GET /api/crypto/coins
// @desc    Get list of all coins
// @access  Public
router.get('/coins', async (req, res) => {
  try {
    const coins = await coinGeckoService.getCoins();
    
    res.json({
      message: 'Coins list retrieved successfully',
      data: coins,
      count: coins.length
    });
  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch coins list',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/markets
// @desc    Get coin market data with pagination
// @access  Public
router.get('/markets', [
  query('vs_currency').optional().isIn(['usd', 'eur', 'btc', 'eth']).withMessage('Invalid currency'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('per_page').optional().isInt({ min: 1, max: 250 }).withMessage('Per page must be between 1 and 250'),
  query('order').optional().isIn([
    'market_cap_desc', 'market_cap_asc', 'volume_desc', 'volume_asc',
    'id_asc', 'id_desc', 'gecko_desc', 'gecko_asc'
  ]).withMessage('Invalid order parameter')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      vs_currency = 'usd',
      page = 1,
      per_page = 100,
      order = 'market_cap_desc'
    } = req.query;
    
    const markets = await coinGeckoService.getCoinMarkets({
      vs_currency,
      page: parseInt(page),
      per_page: parseInt(per_page),
      order,
      sparkline: false,
      price_change_percentage: '24h,7d,30d'
    });
    
    res.json({
      message: 'Market data retrieved successfully',
      data: markets,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total: markets.length
      }
    });
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch market data',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/coin/:id
// @desc    Get detailed data for a specific coin
// @access  Public
router.get('/coin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ message: 'Coin ID is required' });
    }
    
    const coin = await coinGeckoService.getCoin(id);
    
    res.json({
      message: 'Coin data retrieved successfully',
      data: coin
    });
  } catch (error) {
    console.error('Get coin error:', error);
    res.status(404).json({ 
      message: 'Coin not found or failed to fetch coin data',
      error: error.message 
    });
  }
});

// @route   POST /api/crypto/prices
// @desc    Get prices for multiple coins
// @access  Public
router.post('/prices', [
  query('vs_currency').optional().isIn(['usd', 'eur', 'btc', 'eth']).withMessage('Invalid currency')
], handleValidationErrors, async (req, res) => {
  try {
    const { coinIds } = req.body;
    const { vs_currency = 'usd' } = req.query;
    
    if (!coinIds || !Array.isArray(coinIds) || coinIds.length === 0) {
      return res.status(400).json({ message: 'coinIds array is required' });
    }
    
    if (coinIds.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 coins allowed per request' });
    }
    
    const prices = await coinGeckoService.getSimplePrices(coinIds, [vs_currency]);
    
    res.json({
      message: 'Prices retrieved successfully',
      data: prices,
      currency: vs_currency
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch prices',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/coins/by-ids
// @desc    Get market data for specific coins by IDs
// @access  Public
router.get('/coins/by-ids', [
  query('ids').notEmpty().withMessage('Coin IDs are required'),
  query('vs_currency').optional().isIn(['usd', 'eur', 'btc', 'eth']).withMessage('Invalid currency')
], handleValidationErrors, async (req, res) => {
  try {
    const { ids, vs_currency = 'usd' } = req.query;
    
    const coinIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
    
    if (coinIds.length === 0) {
      return res.status(400).json({ message: 'At least one valid coin ID is required' });
    }
    
    if (coinIds.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 coins allowed per request' });
    }
    
    const coins = await coinGeckoService.getCoinsByIds(coinIds, vs_currency);
    
    res.json({
      message: 'Coins data retrieved successfully',
      data: coins,
      count: coins.length
    });
  } catch (error) {
    console.error('Get coins by IDs error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch coins data',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/history/:id
// @desc    Get price history for a coin
// @access  Public
router.get('/history/:id', [
  query('vs_currency').optional().isIn(['usd', 'eur', 'btc', 'eth']).withMessage('Invalid currency'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { vs_currency = 'usd', days = 7 } = req.query;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ message: 'Coin ID is required' });
    }
    
    const history = await coinGeckoService.getCoinHistory(id, vs_currency, parseInt(days));
    
    res.json({
      message: 'Price history retrieved successfully',
      data: history,
      coin: id,
      currency: vs_currency,
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch price history',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/search
// @desc    Search for coins
// @access  Public
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { q } = req.query;
    
    const results = await coinGeckoService.searchCoins(q);
    
    res.json({
      message: 'Search completed successfully',
      data: results,
      query: q,
      count: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Failed to search coins',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/trending
// @desc    Get trending coins
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const trending = await coinGeckoService.getTrendingCoins();
    
    res.json({
      message: 'Trending coins retrieved successfully',
      data: trending
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trending coins',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/global
// @desc    Get global market data
// @access  Public
router.get('/global', async (req, res) => {
  try {
    const global = await coinGeckoService.getGlobalData();
    
    res.json({
      message: 'Global market data retrieved successfully',
      data: global
    });
  } catch (error) {
    console.error('Get global data error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch global market data',
      error: error.message 
    });
  }
});

// @route   GET /api/crypto/cache/stats
// @desc    Get cache statistics (for debugging)
// @access  Public (in development only)
router.get('/cache/stats', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    
    const stats = coinGeckoService.getCacheStats();
    res.json({
      message: 'Cache stats retrieved',
      data: stats
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get cache stats',
      error: error.message 
    });
  }
});

// @route   POST /api/crypto/cache/clear
// @desc    Clear cache (for debugging)
// @access  Public (in development only)
router.post('/cache/clear', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    
    coinGeckoService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ 
      message: 'Failed to clear cache',
      error: error.message 
    });
  }
});

module.exports = router;