const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Watchlist } = require('../models');
const { auth } = require('../middleware/auth');
const coinGeckoService = require('../utils/coinGeckoService');

const router = express.Router();

// All routes require authentication
router.use(auth);

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

// @route   GET /api/watchlist
// @desc    Get user's watchlist with coin details
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's watchlist
    const watchlist = await Watchlist.getOrCreateWatchlist(userId);
    
    if (!watchlist.coinIds || watchlist.coinIds.length === 0) {
      return res.json({
        message: 'Watchlist retrieved successfully',
        data: {
          _id: watchlist._id,
          userId: watchlist.userId,
          coinIds: [],
          coins: [],
          lastModified: watchlist.lastModified,
          createdAt: watchlist.createdAt,
          updatedAt: watchlist.updatedAt
        }
      });
    }
    
    // Get coin details from CoinGecko
    let coinsWithDetails = [];
    try {
      const coinData = await coinGeckoService.getCoinsByIds(
        watchlist.coinIds, 
        req.user.preferences.currency || 'usd'
      );
      
      // Create a map for quick lookup
      const coinDataMap = coinData.reduce((acc, coin) => {
        acc[coin.id] = coin;
        return acc;
      }, {});
      
      // Maintain the order from watchlist and include all coins (even if data fetch failed)
      coinsWithDetails = watchlist.coinIds.map(coinId => ({
        coinId,
        ...coinDataMap[coinId] || {
          id: coinId,
          name: 'Unknown',
          symbol: 'Unknown',
          current_price: 0,
          price_change_percentage_24h: 0
        }
      }));
      
    } catch (error) {
      console.error('Failed to fetch coin details for watchlist:', error);
      // Return basic structure if CoinGecko fails
      coinsWithDetails = watchlist.coinIds.map(coinId => ({
        coinId,
        id: coinId,
        name: 'Unknown',
        symbol: 'Unknown',
        current_price: 0,
        price_change_percentage_24h: 0
      }));
    }
    
    res.json({
      message: 'Watchlist retrieved successfully',
      data: {
        _id: watchlist._id,
        userId: watchlist.userId,
        coinIds: watchlist.coinIds,
        coins: coinsWithDetails,
        lastModified: watchlist.lastModified,
        createdAt: watchlist.createdAt,
        updatedAt: watchlist.updatedAt,
        count: watchlist.coinIds.length
      }
    });
    
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ message: 'Failed to retrieve watchlist' });
  }
});

// @route   POST /api/watchlist
// @desc    Add coin to watchlist
// @access  Private
router.post('/', [
  body('coinId').notEmpty().trim().withMessage('Coin ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { coinId } = req.body;
    
    const trimmedCoinId = coinId.toLowerCase().trim();
    
    // Verify coin exists in CoinGecko
    try {
      await coinGeckoService.getCoin(trimmedCoinId);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid coin ID or coin not found' });
    }
    
    // Get or create watchlist
    let watchlist = await Watchlist.getOrCreateWatchlist(userId);
    
    // Check if coin is already in watchlist
    if (watchlist.hasCoin(trimmedCoinId)) {
      return res.status(400).json({ message: 'Coin is already in your watchlist' });
    }
    
    // Add coin to watchlist
    watchlist.addCoin(trimmedCoinId);
    await watchlist.save();
    
    // Get coin details for response
    let coinDetails = {};
    try {
      const coinData = await coinGeckoService.getCoinsByIds([trimmedCoinId], req.user.preferences.currency || 'usd');
      coinDetails = coinData[0] || {};
    } catch (error) {
      console.error('Failed to fetch coin details after adding to watchlist:', error);
    }
    
    res.status(201).json({
      message: 'Coin added to watchlist successfully',
      data: {
        watchlistId: watchlist._id,
        coinId: trimmedCoinId,
        coinDetails,
        totalCoins: watchlist.coinIds.length
      }
    });
    
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ message: 'Failed to add coin to watchlist' });
  }
});

// @route   DELETE /api/watchlist/:coinId
// @desc    Remove coin from watchlist
// @access  Private
router.delete('/:coinId', [
  param('coinId').notEmpty().withMessage('Coin ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { coinId } = req.params;
    
    const trimmedCoinId = coinId.toLowerCase().trim();
    
    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }
    
    // Check if coin is in watchlist
    if (!watchlist.hasCoin(trimmedCoinId)) {
      return res.status(404).json({ message: 'Coin not found in watchlist' });
    }
    
    // Remove coin from watchlist
    watchlist.removeCoin(trimmedCoinId);
    await watchlist.save();
    
    res.json({
      message: 'Coin removed from watchlist successfully',
      data: {
        watchlistId: watchlist._id,
        coinId: trimmedCoinId,
        totalCoins: watchlist.coinIds.length
      }
    });
    
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ message: 'Failed to remove coin from watchlist' });
  }
});

// @route   POST /api/watchlist/batch
// @desc    Add multiple coins to watchlist
// @access  Private
router.post('/batch', [
  body('coinIds').isArray({ min: 1 }).withMessage('coinIds must be a non-empty array'),
  body('coinIds.*').notEmpty().withMessage('Each coin ID must be provided')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { coinIds } = req.body;
    
    if (coinIds.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 coins can be added at once' });
    }
    
    const trimmedCoinIds = coinIds.map(id => id.toLowerCase().trim());
    
    // Get or create watchlist
    let watchlist = await Watchlist.getOrCreateWatchlist(userId);
    
    const results = {
      added: [],
      skipped: [],
      failed: []
    };
    
    // Process each coin
    for (const coinId of trimmedCoinIds) {
      try {
        // Check if coin already exists in watchlist
        if (watchlist.hasCoin(coinId)) {
          results.skipped.push({ coinId, reason: 'Already in watchlist' });
          continue;
        }
        
        // Verify coin exists in CoinGecko
        await coinGeckoService.getCoin(coinId);
        
        // Add to watchlist
        watchlist.addCoin(coinId);
        results.added.push({ coinId });
        
      } catch (error) {
        results.failed.push({ coinId, reason: 'Coin not found or invalid' });
      }
    }
    
    // Save watchlist if any coins were added
    if (results.added.length > 0) {
      await watchlist.save();
    }
    
    res.json({
      message: `Batch operation completed. Added: ${results.added.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      data: {
        watchlistId: watchlist._id,
        results,
        totalCoins: watchlist.coinIds.length
      }
    });
    
  } catch (error) {
    console.error('Batch add to watchlist error:', error);
    res.status(500).json({ message: 'Failed to process batch watchlist operation' });
  }
});

// @route   PUT /api/watchlist/reorder
// @desc    Reorder coins in watchlist
// @access  Private
router.put('/reorder', [
  body('coinIds').isArray().withMessage('coinIds must be an array'),
  body('coinIds.*').notEmpty().withMessage('Each coin ID must be provided')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { coinIds } = req.body;
    
    const trimmedCoinIds = coinIds.map(id => id.toLowerCase().trim());
    
    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }
    
    // Verify all provided coins are in the current watchlist
    const missingCoins = trimmedCoinIds.filter(coinId => !watchlist.hasCoin(coinId));
    if (missingCoins.length > 0) {
      return res.status(400).json({ 
        message: 'Some coins are not in your watchlist',
        missingCoins 
      });
    }
    
    // Verify no coins are missing from the provided list
    const extraCoins = watchlist.coinIds.filter(coinId => !trimmedCoinIds.includes(coinId));
    if (extraCoins.length > 0) {
      return res.status(400).json({ 
        message: 'Reorder list is missing some coins from your watchlist',
        extraCoins 
      });
    }
    
    // Update the order
    watchlist.coinIds = trimmedCoinIds;
    watchlist.lastModified = new Date();
    await watchlist.save();
    
    res.json({
      message: 'Watchlist reordered successfully',
      data: {
        watchlistId: watchlist._id,
        coinIds: watchlist.coinIds,
        totalCoins: watchlist.coinIds.length
      }
    });
    
  } catch (error) {
    console.error('Reorder watchlist error:', error);
    res.status(500).json({ message: 'Failed to reorder watchlist' });
  }
});

// @route   GET /api/watchlist/check/:coinId
// @desc    Check if coin is in user's watchlist
// @access  Private
router.get('/check/:coinId', [
  param('coinId').notEmpty().withMessage('Coin ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { coinId } = req.params;
    
    const trimmedCoinId = coinId.toLowerCase().trim();
    
    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId });
    
    const isInWatchlist = watchlist ? watchlist.hasCoin(trimmedCoinId) : false;
    
    res.json({
      message: 'Watchlist check completed',
      data: {
        coinId: trimmedCoinId,
        isInWatchlist,
        watchlistId: watchlist?._id || null
      }
    });
    
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(500).json({ message: 'Failed to check watchlist' });
  }
});

// @route   DELETE /api/watchlist
// @desc    Clear entire watchlist
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }
    
    const previousCount = watchlist.coinIds.length;
    
    // Clear the watchlist
    watchlist.coinIds = [];
    watchlist.lastModified = new Date();
    await watchlist.save();
    
    res.json({
      message: 'Watchlist cleared successfully',
      data: {
        watchlistId: watchlist._id,
        previousCount,
        currentCount: 0
      }
    });
    
  } catch (error) {
    console.error('Clear watchlist error:', error);
    res.status(500).json({ message: 'Failed to clear watchlist' });
  }
});

module.exports = router;