const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Holding } = require('../models');
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

// @route   GET /api/portfolio
// @desc    Get user's complete portfolio with current prices
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's holdings
    const holdings = await Holding.find({ userId }).sort({ purchaseDate: -1 });
    
    if (holdings.length === 0) {
      return res.json({
        message: 'Portfolio retrieved successfully',
        data: {
          totalHoldings: 0,
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercentage: 0,
          holdings: []
        }
      });
    }
    
    // Get unique coin IDs for price fetching
    const coinIds = [...new Set(holdings.map(h => h.coinId))];
    
    // Fetch current prices
    let currentPrices = {};
    try {
      currentPrices = await coinGeckoService.getSimplePrices(coinIds, [req.user.preferences.currency || 'usd']);
    } catch (error) {
      console.error('Failed to fetch current prices:', error);
      // Continue without current prices
    }
    
    // Update holdings with current prices and calculate profit/loss
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;
    
    const updatedHoldings = holdings.map(holding => {
      const currentPrice = currentPrices[holding.coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      
      // Calculate values
      const investment = holding.amount * holding.buyPrice;
      const currentValue = holding.amount * currentPrice;
      const profitLoss = currentValue - investment;
      const profitLossPercentage = investment > 0 ? (profitLoss / investment) * 100 : 0;
      
      totalInvestment += investment;
      totalCurrentValue += currentValue;
      totalProfitLoss += profitLoss;
      
      // Update holding with calculated values
      holding.currentPrice = currentPrice;
      holding.currentValue = currentValue;
      holding.profitLoss = profitLoss;
      holding.profitLossPercentage = profitLossPercentage;
      holding.lastUpdated = new Date();
      
      return holding;
    });
    
    const totalProfitLossPercentage = totalInvestment > 0 
      ? (totalProfitLoss / totalInvestment) * 100 
      : 0;
    
    // Save updated holdings (batch update)
    await Promise.all(updatedHoldings.map(h => h.save()));
    
    res.json({
      message: 'Portfolio retrieved successfully',
      data: {
        totalHoldings: holdings.length,
        totalInvestment,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercentage,
        holdings: updatedHoldings,
        currency: req.user.preferences.currency || 'usd'
      }
    });
    
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ message: 'Failed to retrieve portfolio' });
  }
});

// @route   POST /api/portfolio/holdings
// @desc    Add new holding to portfolio
// @access  Private
router.post('/holdings', [
  body('coinId').notEmpty().trim().withMessage('Coin ID is required'),
  body('coinName').notEmpty().trim().withMessage('Coin name is required'),
  body('symbol').notEmpty().trim().withMessage('Coin symbol is required'),
  body('amount').isFloat({ min: 0.00000001 }).withMessage('Amount must be greater than 0'),
  body('buyPrice').isFloat({ min: 0 }).withMessage('Buy price must be greater than or equal to 0'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid purchase date format'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { coinId, coinName, symbol, amount, buyPrice, purchaseDate, notes } = req.body;
    
    // Verify coin exists in CoinGecko
    try {
      await coinGeckoService.getCoin(coinId);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid coin ID or coin not found' });
    }
    
    // Create new holding
    const holding = new Holding({
      userId,
      coinId: coinId.toLowerCase(),
      coinName,
      symbol: symbol.toUpperCase(),
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      notes: notes || ''
    });
    
    // Get current price for immediate calculation
    try {
      const prices = await coinGeckoService.getSimplePrices([coinId], [req.user.preferences.currency || 'usd']);
      const currentPrice = prices[coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      holding.calculateProfitLoss(currentPrice);
    } catch (error) {
      console.error('Failed to get current price for new holding:', error);
    }
    
    await holding.save();
    
    res.status(201).json({
      message: 'Holding added successfully',
      data: holding
    });
    
  } catch (error) {
    console.error('Add holding error:', error);
    res.status(500).json({ message: 'Failed to add holding' });
  }
});

// @route   GET /api/portfolio/holdings/:id
// @desc    Get specific holding by ID
// @access  Private
router.get('/holdings/:id', [
  param('id').isMongoId().withMessage('Invalid holding ID')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const holdingId = req.params.id;
    
    const holding = await Holding.findOne({ _id: holdingId, userId });
    
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    // Get current price
    try {
      const prices = await coinGeckoService.getSimplePrices([holding.coinId], [req.user.preferences.currency || 'usd']);
      const currentPrice = prices[holding.coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      holding.calculateProfitLoss(currentPrice);
      await holding.save();
    } catch (error) {
      console.error('Failed to get current price:', error);
    }
    
    res.json({
      message: 'Holding retrieved successfully',
      data: holding
    });
    
  } catch (error) {
    console.error('Get holding error:', error);
    res.status(500).json({ message: 'Failed to retrieve holding' });
  }
});

// @route   PUT /api/portfolio/holdings/:id
// @desc    Update holding
// @access  Private
router.put('/holdings/:id', [
  param('id').isMongoId().withMessage('Invalid holding ID'),
  body('amount').optional().isFloat({ min: 0.00000001 }).withMessage('Amount must be greater than 0'),
  body('buyPrice').optional().isFloat({ min: 0 }).withMessage('Buy price must be greater than or equal to 0'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid purchase date format'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const holdingId = req.params.id;
    const { amount, buyPrice, purchaseDate, notes } = req.body;
    
    const holding = await Holding.findOne({ _id: holdingId, userId });
    
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    // Update fields
    if (amount !== undefined) holding.amount = parseFloat(amount);
    if (buyPrice !== undefined) holding.buyPrice = parseFloat(buyPrice);
    if (purchaseDate !== undefined) holding.purchaseDate = new Date(purchaseDate);
    if (notes !== undefined) holding.notes = notes;
    
    // Recalculate profit/loss with current price
    try {
      const prices = await coinGeckoService.getSimplePrices([holding.coinId], [req.user.preferences.currency || 'usd']);
      const currentPrice = prices[holding.coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      holding.calculateProfitLoss(currentPrice);
    } catch (error) {
      console.error('Failed to get current price for update:', error);
    }
    
    await holding.save();
    
    res.json({
      message: 'Holding updated successfully',
      data: holding
    });
    
  } catch (error) {
    console.error('Update holding error:', error);
    res.status(500).json({ message: 'Failed to update holding' });
  }
});

// @route   DELETE /api/portfolio/holdings/:id
// @desc    Delete holding
// @access  Private
router.delete('/holdings/:id', [
  param('id').isMongoId().withMessage('Invalid holding ID')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const holdingId = req.params.id;
    
    const holding = await Holding.findOneAndDelete({ _id: holdingId, userId });
    
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json({
      message: 'Holding deleted successfully',
      data: { id: holdingId }
    });
    
  } catch (error) {
    console.error('Delete holding error:', error);
    res.status(500).json({ message: 'Failed to delete holding' });
  }
});

// @route   GET /api/portfolio/analytics
// @desc    Get portfolio analytics and performance data
// @access  Private
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const holdings = await Holding.find({ userId }).sort({ purchaseDate: -1 });
    
    if (holdings.length === 0) {
      return res.json({
        message: 'Portfolio analytics retrieved successfully',
        data: {
          totalHoldings: 0,
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercentage: 0,
          topPerformers: [],
          worstPerformers: [],
          allocationByValue: [],
          allocationByInvestment: [],
          performanceHistory: []
        }
      });
    }
    
    // Get current prices
    const coinIds = [...new Set(holdings.map(h => h.coinId))];
    let currentPrices = {};
    
    try {
      currentPrices = await coinGeckoService.getSimplePrices(coinIds, [req.user.preferences.currency || 'usd']);
    } catch (error) {
      console.error('Failed to fetch prices for analytics:', error);
    }
    
    // Calculate analytics
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    
    const holdingsWithCalc = holdings.map(holding => {
      const currentPrice = currentPrices[holding.coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      const investment = holding.amount * holding.buyPrice;
      const currentValue = holding.amount * currentPrice;
      const profitLoss = currentValue - investment;
      const profitLossPercentage = investment > 0 ? (profitLoss / investment) * 100 : 0;
      
      totalInvestment += investment;
      totalCurrentValue += currentValue;
      
      return {
        ...holding.toJSON(),
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercentage,
        investment
      };
    });
    
    // Sort by performance
    const sortedByPerformance = [...holdingsWithCalc].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage);
    
    // Get top and worst performers
    const topPerformers = sortedByPerformance.slice(0, 5);
    const worstPerformers = sortedByPerformance.slice(-5).reverse();
    
    // Calculate allocation by current value
    const allocationByValue = holdingsWithCalc
      .filter(h => h.currentValue > 0)
      .map(h => ({
        coinId: h.coinId,
        coinName: h.coinName,
        symbol: h.symbol,
        value: h.currentValue,
        percentage: totalCurrentValue > 0 ? (h.currentValue / totalCurrentValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
    
    // Calculate allocation by investment
    const allocationByInvestment = holdingsWithCalc
      .map(h => ({
        coinId: h.coinId,
        coinName: h.coinName,
        symbol: h.symbol,
        investment: h.investment,
        percentage: totalInvestment > 0 ? (h.investment / totalInvestment) * 100 : 0
      }))
      .sort((a, b) => b.investment - a.investment);
    
    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
    
    res.json({
      message: 'Portfolio analytics retrieved successfully',
      data: {
        totalHoldings: holdings.length,
        totalInvestment,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercentage,
        topPerformers,
        worstPerformers,
        allocationByValue,
        allocationByInvestment,
        currency: req.user.preferences.currency || 'usd'
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to retrieve portfolio analytics' });
  }
});

// @route   GET /api/portfolio/summary
// @desc    Get portfolio summary (lightweight version)
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await Holding.getPortfolioSummary(userId);
    
    res.json({
      message: 'Portfolio summary retrieved successfully',
      data: {
        ...summary,
        currency: req.user.preferences.currency || 'usd'
      }
    });
    
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Failed to retrieve portfolio summary' });
  }
});

// @route   GET /api/portfolio/export/csv
// @desc    Export portfolio as CSV
// @access  Private
router.get('/export/csv', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's holdings
    const holdings = await Holding.find({ userId }).sort({ purchaseDate: -1 });
    
    if (holdings.length === 0) {
      return res.status(404).json({ message: 'No holdings found to export' });
    }
    
    // Get current prices
    const coinIds = [...new Set(holdings.map(h => h.coinId))];
    let currentPrices = {};
    
    try {
      currentPrices = await coinGeckoService.getSimplePrices(coinIds, [req.user.preferences.currency || 'usd']);
    } catch (error) {
      console.error('Failed to fetch prices for export:', error);
    }
    
    // Prepare CSV data
    const headers = [
      'Coin Name',
      'Symbol',
      'Amount',
      'Buy Price',
      'Current Price',
      'Investment',
      'Current Value',
      'Profit/Loss',
      'P&L %',
      'Purchase Date'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    
    holdings.forEach(holding => {
      const currentPrice = currentPrices[holding.coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      const investment = holding.amount * holding.buyPrice;
      const currentValue = holding.amount * currentPrice;
      const profitLoss = currentValue - investment;
      const profitLossPercentage = investment > 0 ? (profitLoss / investment) * 100 : 0;
      
      totalInvestment += investment;
      totalCurrentValue += currentValue;
      
      const row = [
        holding.coinName,
        holding.symbol,
        holding.amount,
        holding.buyPrice,
        currentPrice,
        investment,
        currentValue,
        profitLoss,
        profitLossPercentage,
        holding.purchaseDate.toISOString().split('T')[0]
      ];
      
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Add totals row
    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
    
    const totalsRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercentage,
      ''
    ];
    
    csvContent += totalsRow.map(field => `"${field}"`).join(',') + '\n';
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="portfolio.csv"');
    
    res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export portfolio as CSV' });
  }
});

// @route   GET /api/portfolio/export/pdf
// @desc    Export portfolio as PDF
// @access  Private
router.get('/export/pdf', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's holdings
    const holdings = await Holding.find({ userId }).sort({ purchaseDate: -1 });
    
    if (holdings.length === 0) {
      return res.status(404).json({ message: 'No holdings found to export' });
    }
    
    // Get current prices
    const coinIds = [...new Set(holdings.map(h => h.coinId))];
    let currentPrices = {};
    
    try {
      currentPrices = await coinGeckoService.getSimplePrices(coinIds, [req.user.preferences.currency || 'usd']);
    } catch (error) {
      console.error('Failed to fetch prices for export:', error);
    }
    
    // Prepare data for PDF
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    
    const holdingsWithCalc = holdings.map(holding => {
      const currentPrice = currentPrices[holding.coinId]?.[req.user.preferences.currency || 'usd'] || 0;
      const investment = holding.amount * holding.buyPrice;
      const currentValue = holding.amount * currentPrice;
      const profitLoss = currentValue - investment;
      const profitLossPercentage = investment > 0 ? (profitLoss / investment) * 100 : 0;
      
      totalInvestment += investment;
      totalCurrentValue += currentValue;
      
      return {
        ...holding.toJSON(),
        currentPrice,
        investment,
        currentValue,
        profitLoss,
        profitLossPercentage
      };
    });
    
    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
    
    // Return data for frontend to generate PDF
    res.json({
      message: 'Portfolio data for PDF export retrieved successfully',
      data: {
        holdings: holdingsWithCalc,
        summary: {
          totalHoldings: holdings.length,
          totalInvestment,
          totalCurrentValue,
          totalProfitLoss,
          totalProfitLossPercentage,
          currency: req.user.preferences.currency || 'usd'
        },
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Failed to prepare portfolio for PDF export' });
  }
});

module.exports = router;