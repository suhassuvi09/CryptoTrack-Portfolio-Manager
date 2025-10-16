const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coinId: {
    type: String,
    required: [true, 'Coin ID is required'],
    trim: true
  },
  coinName: {
    type: String,
    required: [true, 'Coin name is required'],
    trim: true
  },
  symbol: {
    type: String,
    required: [true, 'Coin symbol is required'],
    uppercase: true,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be greater than 0'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Amount must be greater than 0'
    }
  },
  buyPrice: {
    type: Number,
    required: [true, 'Buy price is required'],
    min: [0, 'Buy price must be greater than 0']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Purchase date cannot be in the future'
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  // Calculated fields for portfolio analytics
  currentPrice: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index for better query performance (removed duplicate userId index)
holdingSchema.index({ userId: 1, coinId: 1 });
holdingSchema.index({ userId: 1, purchaseDate: -1 });

// Virtual for total investment
holdingSchema.virtual('totalInvestment').get(function() {
  return this.amount * this.buyPrice;
});

// Instance method to calculate profit/loss
holdingSchema.methods.calculateProfitLoss = function(currentPrice) {
  if (!currentPrice || currentPrice <= 0) return this;
  
  this.currentPrice = currentPrice;
  this.currentValue = this.amount * currentPrice;
  this.profitLoss = this.currentValue - this.totalInvestment;
  this.profitLossPercentage = ((this.currentValue - this.totalInvestment) / this.totalInvestment) * 100;
  this.lastUpdated = new Date();
  
  return this;
};

// Static method to get portfolio summary for a user
holdingSchema.statics.getPortfolioSummary = async function(userId) {
  const holdings = await this.find({ userId }).populate('userId', 'preferences');
  
  let totalInvestment = 0;
  let totalCurrentValue = 0;
  let totalProfitLoss = 0;
  
  holdings.forEach(holding => {
    totalInvestment += holding.totalInvestment;
    totalCurrentValue += holding.currentValue;
    totalProfitLoss += holding.profitLoss;
  });
  
  const totalProfitLossPercentage = totalInvestment > 0 
    ? ((totalCurrentValue - totalInvestment) / totalInvestment) * 100 
    : 0;
  
  return {
    totalHoldings: holdings.length,
    totalInvestment,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercentage,
    holdings
  };
};

// Static method to get holdings by coin
holdingSchema.statics.getHoldingsByCoin = async function(userId, coinId) {
  return this.find({ userId, coinId }).sort({ purchaseDate: -1 });
};

module.exports = mongoose.model('Holding', holdingSchema);