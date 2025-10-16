import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import CryptoTable from '../components/crypto/CryptoTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { cryptoService } from '../services/cryptoService';
import { watchlistService } from '../services/watchlistService';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { formatCurrency as formatCurrencyHelper, convertCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const Markets = () => {
  const { user } = useAuth();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [coins, setCoins] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    marketCapChange: 0
  });

  const fetchMarketData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('Fetching market data...');
      
      const [coinsResponse, watchlistResponse] = await Promise.all([
        cryptoService.getCoinMarkets({ vs_currency: 'usd', per_page: 100, page: 1 }),
        user ? watchlistService.getWatchlist() : Promise.resolve({ data: { coins: [] } })
      ]);

      console.log('Coins response:', coinsResponse);
      console.log('Watchlist response:', watchlistResponse);

      // The response interceptor already returns response.data, so we don't need to access .data again
      setCoins(coinsResponse.data || coinsResponse || []);
      setWatchlist(user && watchlistResponse ? watchlistResponse.data.coins : []);

      // Calculate market stats only if we have data
      const coinsData = coinsResponse.data || coinsResponse || [];
      if (coinsData && coinsData.length > 0) {
        const totalMarketCap = coinsData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
        const totalVolume = coinsData.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
        const marketCapChange = coinsData.reduce((sum, coin) => {
          const change = coin.market_cap_change_percentage_24h || 0;
          return sum + (coin.market_cap || 0) * (change / 100);
        }, 0);

        setMarketStats({
          totalMarketCap,
          totalVolume,
          marketCapChange: totalMarketCap > 0 ? (marketCapChange / totalMarketCap) * 100 : 0
        });
      }

    } catch (error) {
      console.error('Failed to fetch market data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddToWatchlist = async (coin) => {
    if (!user) {
      toast.error('Please login to add coins to watchlist');
      return;
    }

    try {
      const isInWatchlist = watchlist.some(item => item.coinId === coin.id);
      
      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(coin.id);
        setWatchlist(prev => prev.filter(item => item.coinId !== coin.id));
        toast.success(`${coin.name} removed from watchlist`);
      } else {
        const newWatchlistResponse = await watchlistService.addToWatchlist({
          coinId: coin.id,
          coinName: coin.name,
          symbol: coin.symbol
        });
        
        // Create a watchlist item with all the coin data including image
        const newWatchlistItem = {
          coinId: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap: coin.market_cap,
          total_volume: coin.total_volume
        };
        
        setWatchlist(prev => [...prev, newWatchlistItem]);
        toast.success(`${coin.name} added to watchlist`);
      }
    } catch (error) {
      console.error('Watchlist operation failed:', error);
      toast.error('Failed to update watchlist');
    }
  };

  const handleRefresh = () => {
    fetchMarketData(true);
  };

  useEffect(() => {
    fetchMarketData();
  }, [user]);

  const formatCurrencyWithConversion = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00';
    }

    const convertedValue = selectedCurrency.code === 'USD' 
      ? value 
      : convertCurrency(value, selectedCurrency.code, exchangeRates);

    if (convertedValue >= 1e12) {
      return `${selectedCurrency.code === 'USD' ? '$' : ''}${(convertedValue / 1e12).toFixed(1)}T`;
    } else if (convertedValue >= 1e9) {
      return `${selectedCurrency.code === 'USD' ? '$' : ''}${(convertedValue / 1e9).toFixed(1)}B`;
    } else if (convertedValue >= 1e6) {
      return `${selectedCurrency.code === 'USD' ? '$' : ''}${(convertedValue / 1e6).toFixed(1)}M`;
    } else {
      return formatCurrencyHelper(convertedValue, selectedCurrency.code, decimals);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Markets
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track cryptocurrency prices and market trends
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Market Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Market Cap</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrencyWithConversion(marketStats.totalMarketCap, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="crypto-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">24h Volume</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrencyWithConversion(marketStats.totalVolume, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="crypto-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Market Cap Change</p>
                <p className={`text-2xl font-bold ${
                  marketStats.marketCapChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {marketStats.marketCapChange >= 0 ? '+' : ''}{marketStats.marketCapChange.toFixed(2)}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                marketStats.marketCapChange >= 0
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {marketStats.marketCapChange >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Table */}
      <div className="crypto-card">
        <CryptoTable
          data={coins}
          loading={loading}
          onAddToWatchlist={handleAddToWatchlist}
          watchlist={watchlist}
          showWatchlistColumn={true}
        />
      </div>
    </div>
  );
};

export default Markets;