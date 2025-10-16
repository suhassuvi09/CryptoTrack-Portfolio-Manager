const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coinIds: [{
    type: String,
    required: true,
    trim: true
  }],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Ensure one watchlist per user
watchlistSchema.index({ userId: 1 }, { unique: true });

// Pre-save middleware to update lastModified
watchlistSchema.pre('save', function (next) {
  this.lastModified = new Date();
  next();
});

// Instance method to add coin to watchlist
watchlistSchema.methods.addCoin = function (coinId) {
  if (!this.coinIds.includes(coinId)) {
    this.coinIds.push(coinId);
    this.lastModified = new Date();
  }
  return this;
};

// Instance method to remove coin from watchlist
watchlistSchema.methods.removeCoin = function (coinId) {
  this.coinIds = this.coinIds.filter(id => id !== coinId);
  this.lastModified = new Date();
  return this;
};

// Instance method to check if coin is in watchlist
watchlistSchema.methods.hasCoin = function (coinId) {
  return this.coinIds.includes(coinId);
};

// Static method to get or create watchlist for user
watchlistSchema.statics.getOrCreateWatchlist = async function (userId) {
  let watchlist = await this.findOne({ userId });

  if (!watchlist) {
    watchlist = await this.create({
      userId,
      coinIds: []
    });
  }

  return watchlist;
};

// Static method to add coin to user's watchlist
watchlistSchema.statics.addCoinToWatchlist = async function (userId, coinId) {
  const watchlist = await this.getOrCreateWatchlist(userId);
  watchlist.addCoin(coinId);
  return await watchlist.save();
};

// Static method to remove coin from user's watchlist
watchlistSchema.statics.removeCoinFromWatchlist = async function (userId, coinId) {
  const watchlist = await this.findOne({ userId });

  if (!watchlist) {
    throw new Error('Watchlist not found');
  }

  watchlist.removeCoin(coinId);
  return await watchlist.save();
};

// Static method to get user's watchlist with coin details
watchlistSchema.statics.getWatchlistWithDetails = async function (userId, coinDetails = {}) {
  const watchlist = await this.getOrCreateWatchlist(userId);

  // If coin details are provided, merge them with the watchlist
  const coinsWithDetails = watchlist.coinIds.map(coinId => ({
    coinId,
    ...(coinDetails[coinId] || {})
  }));

  return {
    ...watchlist.toJSON(),
    coins: coinsWithDetails
  };
};

module.exports = mongoose.model('Watchlist', watchlistSchema);