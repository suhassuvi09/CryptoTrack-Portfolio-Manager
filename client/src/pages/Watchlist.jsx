import React, { useState, useEffect } from 'react';
import { Star, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { watchlistService } from '../services/watchlistService';
import { cryptoService } from '../services/cryptoService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { formatCurrency, formatPercentage, convertCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const Watchlist = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [watchlist, setWatchlist] = useState([]);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCoins, setFilteredCoins] = useState([]);

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const watchlistResponse = await watchlistService.getWatchlist();
      // Fix: Ensure we're accessing the correct data structure
      const watchlistData = watchlistResponse.data?.coins || [];
      
      if (watchlistData.length > 0) {
        // For each coin in the watchlist, we need to fetch the latest data
        // to ensure we have up-to-date information including images
        try {
          const coinIds = watchlistData.map(item => item.coinId || item.id);
          const cryptoServiceResponse = await cryptoService.getCoinsByIds(coinIds);
          const coinData = cryptoServiceResponse.data || cryptoServiceResponse || [];
          
          // Create a map for quick lookup
          const coinDataMap = coinData.reduce((acc, coin) => {
            acc[coin.id] = coin;
            return acc;
          }, {});
          
          // Merge the watchlist data with the latest coin data
          const enrichedData = watchlistData.map(item => {
            const coinId = item.coinId || item.id;
            const latestCoinData = coinDataMap[coinId] || {};
            
            return {
              coinId: coinId,
              id: coinId,
              name: item.name || latestCoinData.name || 'Unknown',
              symbol: item.symbol || latestCoinData.symbol || 'Unknown',
              current_price: item.current_price !== undefined ? item.current_price : (latestCoinData.current_price || 0),
              price_change_percentage_24h: item.price_change_percentage_24h !== undefined ? 
                item.price_change_percentage_24h : (latestCoinData.price_change_percentage_24h || 0),
              market_cap: item.market_cap !== undefined ? item.market_cap : (latestCoinData.market_cap || 0),
              total_volume: item.total_volume !== undefined ? item.total_volume : (latestCoinData.total_volume || 0),
              image: item.image || latestCoinData.image || null,
              lastUpdated: item.lastUpdated || new Date()
            };
          });
          
          setWatchlist(enrichedData);
        } catch (error) {
          console.error('Failed to fetch latest coin data:', error);
          // Fallback to original data if we can't fetch latest data
          const enrichedData = watchlistData.map(item => ({
            coinId: item.coinId || item.id,
            id: item.id || item.coinId,
            name: item.name || item.coinName || 'Unknown',
            symbol: item.symbol || 'Unknown',
            current_price: item.current_price !== undefined ? item.current_price : (item.currentPrice || 0),
            price_change_percentage_24h: item.price_change_percentage_24h !== undefined ? 
              item.price_change_percentage_24h : (item.priceChange24h || 0),
            market_cap: item.market_cap !== undefined ? item.market_cap : (item.marketCap || 0),
            total_volume: item.total_volume !== undefined ? item.total_volume : (item.volume24h || 0),
            image: item.image || null,
            lastUpdated: item.lastUpdated || new Date()
          }));
          setWatchlist(enrichedData);
        }
      } else {
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoins = async () => {
    try {
      const coinsData = await cryptoService.getCoinMarkets({
        vs_currency: 'usd',
        per_page: 250,
        page: 1
      });
      // Ensure we're getting the right data structure and log for debugging
      const processedCoins = (coinsData.data || coinsData || []).map(coin => ({
        ...coin,
        // Ensure image structure is consistent
        image: coin.image ? {
          small: coin.image.small || coin.image,
          large: coin.image.large || coin.image,
          thumb: coin.image.thumb || coin.image.small || coin.image
        } : null
      }));
      setCoins(processedCoins);
    } catch (error) {
      console.error('Failed to fetch coins:', error);
    }
  };

  const handleAddToWatchlist = async (coin) => {
    try {
      const newWatchlistResponse = await watchlistService.addToWatchlist({
        coinId: coin.id,
        coinName: coin.name,
        symbol: coin.symbol
      });
      
      // Get the response data
      const responseData = newWatchlistResponse.data || {};
      
      // Create a complete item with all coin data from the selected coin
      // This ensures all the data including image is preserved
      const watchlistItem = {
        coinId: coin.id,
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        current_price: coin.current_price || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        market_cap: coin.market_cap || 0,
        total_volume: coin.total_volume || 0,
        image: coin.image, // Include complete image data
        lastUpdated: new Date()
      };

      setWatchlist(prev => [...prev, watchlistItem]);
      setShowAddModal(false);
      toast.success(`${coin.name} added to watchlist`);
      
      // Small delay to ensure backend processing is complete
      setTimeout(async () => {
        await fetchWatchlist();
      }, 500);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async (coinId, coinName) => {
    try {
      await watchlistService.removeFromWatchlist(coinId);
      setWatchlist(prev => prev.filter(item => item.coinId !== coinId));
      toast.success(`${coinName} removed from watchlist`);
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const isInWatchlist = (coinId) => {
    return watchlist.some(item => item.coinId === coinId);
  };

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  useEffect(() => {
    if (showAddModal) {
      fetchCoins();
    }
  }, [showAddModal]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = coins.filter(coin =>
        !isInWatchlist(coin.id) &&
        (coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCoins(filtered.slice(0, 20)); // Limit results
    } else {
      setFilteredCoins(coins.filter(coin => !isInWatchlist(coin.id)).slice(0, 20));
    }
  }, [searchTerm, coins, watchlist]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to view your watchlist
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your favorite cryptocurrencies by creating an account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Watchlist
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your favorite cryptocurrencies
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add Coin</span>
          </button>
        </div>
      </div>

      {/* Watchlist Table */}
      {watchlist.length > 0 ? (
        <div className="crypto-card">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">24h Change</th>
                  <th className="text-right">Market Cap</th>
                  <th className="text-right">Volume (24h)</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.coinId || item.id}>
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        {item.image ? (
                          <img
                            src={typeof item.image === 'string' ? item.image : (item.image.small || item.image.large || item.image.thumb)}
                            alt={item.name || item.coinName}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {item.symbol?.substring(0, 3).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.name || item.coinName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 uppercase text-xs">
                            {item.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 font-medium text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(item.current_price || item.currentPrice || 0, selectedCurrency.code)
                        : formatCurrency(
                            convertCurrency(item.current_price || item.currentPrice || 0, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code
                          )}
                    </td>
                    <td className="text-right py-3">
                      <div className={`flex items-center justify-end space-x-1 ${
                        (item.price_change_percentage_24h || item.priceChange24h || 0) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(item.price_change_percentage_24h || item.priceChange24h || 0) >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {formatPercentage(item.price_change_percentage_24h || item.priceChange24h || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(item.market_cap || item.marketCap || 0, selectedCurrency.code, 0)
                        : formatCurrency(
                            convertCurrency(item.market_cap || item.marketCap || 0, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code,
                            0
                          )}
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(item.total_volume || item.volume24h || 0, selectedCurrency.code, 0)
                        : formatCurrency(
                            convertCurrency(item.total_volume || item.volume24h || 0, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code,
                            0
                          )}
                    </td>
                    <td className="text-right py-3">
                      <button
                        onClick={() => handleRemoveFromWatchlist(item.coinId || item.id, item.name || item.coinName)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="crypto-card p-12 text-center">
          <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Your watchlist is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Add cryptocurrencies to track their prices and performance
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Coin</span>
          </button>
        </div>
      )}

      {/* Add Coin Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add to Watchlist"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input"
            />
          </div>

          {/* Coins List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredCoins.map((coin) => (
              <div
                key={coin.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {coin.image ? (
                    <img
                      src={typeof coin.image === 'string' ? coin.image : (coin.image.small || coin.image.large || coin.image.thumb)}
                      alt={coin.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {coin.symbol?.substring(0, 3).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {coin.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                      {coin.symbol}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(coin.current_price, selectedCurrency.code)
                        : formatCurrency(
                            convertCurrency(coin.current_price, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code
                          )}
                    </div>
                    <div className={`text-sm ${
                      coin.price_change_percentage_24h >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatPercentage(coin.price_change_percentage_24h)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToWatchlist(coin)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white text-sm rounded-lg transition-all duration-300"
                  >
                    <Star className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCoins.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No coins found
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Watchlist;