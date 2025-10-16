import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Plus, BarChart3, Star, DollarSign, Download, RefreshCw, FileText } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useAuth } from '../context/AuthContext';
import { portfolioService } from '../services/portfolioService';
import { watchlistService } from '../services/watchlistService';
import { cryptoService } from '../services/cryptoService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CurrencyToggle from '../components/ui/CurrencyToggle';
import { formatCurrency, formatPercentage, convertCurrency } from '../utils/helpers';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [topCoins, setTopCoins] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      // Fetch global market data
      const globalDataPromise = cryptoService.getGlobalData().catch(() => null);

      const [portfolioData, watchlistData, coinsData, globalData] = await Promise.all([
        portfolioService.getPortfolio().catch((error) => {
          console.error('Portfolio fetch error:', error);
          return { data: null };
        }),
        watchlistService.getWatchlist().catch((error) => {
          console.error('Watchlist fetch error:', error);
          return [];
        }),
        cryptoService.getCoinMarkets({ vs_currency: 'usd', per_page: 10, page: 1, order: 'market_cap_desc' }).catch((error) => {
          console.error('Coin markets fetch error:', error);
          return [];
        }),
        globalDataPromise
      ]);

      console.log('Dashboard data fetched:', { portfolioData, watchlistData, coinsData, globalData });

      setPortfolio(portfolioData?.data || null);

      // Get prices for watchlist if it exists
      if (watchlistData?.data?.coins && watchlistData.data.coins.length > 0) {
        // Process watchlist data to ensure proper structure
        const processedWatchlist = watchlistData.data.coins.map(item => ({
          coinId: item.coinId || item.id,
          id: item.id || item.coinId,
          name: item.name || item.coinName || 'Unknown',
          symbol: item.symbol || 'Unknown',
          currentPrice: item.current_price !== undefined ? item.current_price : (item.currentPrice || 0),
          priceChange24h: item.price_change_percentage_24h !== undefined ?
            item.price_change_percentage_24h : (item.priceChange24h || 0),
          marketCap: item.market_cap !== undefined ? item.market_cap : (item.marketCap || 0),
          volume24h: item.total_volume !== undefined ? item.total_volume : (item.volume24h || 0),
          image: item.image || null,
          lastUpdated: item.lastUpdated || new Date()
        }));
        setWatchlist(processedWatchlist);
      } else {
        setWatchlist([]);
      }

      setTopCoins(coinsData?.data || coinsData || []);
      setGlobalData(globalData?.data || null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleExportCSV = async () => {
    try {
      // Get portfolio data for export
      const portfolioData = await portfolioService.getPortfolio();
      const portfolio = portfolioData?.data || portfolioData;

      if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        toast.error('No portfolio data to export');
        return;
      }

      // Use the new utility function
      exportToCSV(portfolio.holdings, portfolio, 'portfolio.csv');
      toast.success('Portfolio exported as CSV successfully');
    } catch (error) {
      console.error('Failed to export portfolio as CSV:', error);
      toast.error('Failed to export portfolio as CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Get portfolio data for export
      const portfolioData = await portfolioService.getPortfolio();
      const portfolio = portfolioData?.data || portfolioData;

      if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        toast.error('No portfolio data to export');
        return;
      }

      // Use the new utility function
      exportToPDF(portfolio.holdings, portfolio, 'portfolio.pdf');
      toast.success('Portfolio exported as PDF successfully');
    } catch (error) {
      console.error('Failed to export portfolio as PDF:', error);
      toast.error('Failed to export portfolio as PDF');
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Add a check to ensure we show content when not loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If user is not authenticated, redirect to login (this should be handled by ProtectedRoute)
  if (!user && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view your dashboard</p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, <span className="gradient-text">{user?.email?.split('@')[0] || 'User'}</span>!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Here's your cryptocurrency portfolio overview
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm hover:shadow"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {/* Export Buttons Dropdown */}
              <div className="relative">
                <button
                  onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm hover:shadow"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>

                <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => {
                      handleExportCSV();
                      document.getElementById('export-dropdown').classList.add('hidden');
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportPDF();
                      document.getElementById('export-dropdown').classList.add('hidden');
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export as PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Portfolio Summary Card */}
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Portfolio Value
              </h3>
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCurrency.code === 'USD'
                  ? formatCurrency(portfolio?.totalCurrentValue || 0, selectedCurrency.code)
                  : formatCurrency(
                    convertCurrency(portfolio?.totalCurrentValue || 0, selectedCurrency.code, exchangeRates),
                    selectedCurrency.code
                  )}
              </div>
              <div className={`flex items-center space-x-1 ${(portfolio?.totalProfitLoss || 0) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {(portfolio?.totalProfitLoss || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {(portfolio?.totalProfitLoss || 0) >= 0 ? '+' : ''}
                  {selectedCurrency.code === 'USD'
                    ? formatCurrency(portfolio?.totalProfitLoss || 0, selectedCurrency.code)
                    : formatCurrency(
                      convertCurrency(portfolio?.totalProfitLoss || 0, selectedCurrency.code, exchangeRates),
                      selectedCurrency.code
                    )} (24h)
                </span>
              </div>
            </div>
          </div>

          {/* Holdings Card */}
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Holdings
              </h3>
              <div className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolio?.totalHoldings || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Active investments
              </div>
            </div>
          </div>

          {/* Watchlist Card */}
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Watchlist
              </h3>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {watchlist.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Tracked assets
              </div>
            </div>
          </div>

          {/* Market Overview Card */}
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Market Cap
              </h3>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {globalData?.total_market_cap?.usd
                  ? `$${(globalData.total_market_cap.usd / 1000000000000).toFixed(1)}T`
                  : '$2.1T'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Global crypto market
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Watchlist Preview */}
          <div className="crypto-card lg:col-span-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header text-lg">
                Watchlist
              </h3>
              <Link
                to="/watchlist"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {watchlist.slice(0, 4).map((item) => (
                <div key={item.coinId || item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    {item.image ? (
                      <img
                        src={typeof item.image === 'string' ? item.image : (item.image.small || item.image.large || item.image.thumb || '')}
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
                        {item.symbol?.toUpperCase() || item.name?.toUpperCase() || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.name || item.coinName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD'
                        ? formatCurrency(item.current_price !== undefined ? item.current_price : item.currentPrice || 0, selectedCurrency.code)
                        : formatCurrency(
                          convertCurrency(item.current_price !== undefined ? item.current_price : item.currentPrice || 0, selectedCurrency.code, exchangeRates),
                          selectedCurrency.code
                        )}
                    </div>
                    <div className={`text-xs ${(item.price_change_percentage_24h !== undefined ? item.price_change_percentage_24h : item.priceChange24h || 0) >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                      }`}>
                      {formatPercentage(item.price_change_percentage_24h !== undefined ? item.price_change_percentage_24h : item.priceChange24h || 0)}
                    </div>
                  </div>
                </div>
              ))}
              {watchlist.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Star className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No coins in watchlist</p>
                  <Link
                    to="/markets"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
                  >
                    Add coins
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="crypto-card lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header text-lg">
                Top Performers
              </h3>
              <Link
                to="/markets"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Markets
              </Link>
            </div>
            <div className="space-y-4">
              {topCoins
                .filter(coin => coin.price_change_percentage_24h > 0)
                .slice(0, 4)
                .map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      {coin.image ? (
                        <img
                          src={typeof coin.image === 'string' ? coin.image : (coin.image.small || coin.image.large || coin.image.thumb || '')}
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
                          {coin.symbol?.toUpperCase() || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {coin.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedCurrency.code === 'USD'
                          ? formatCurrency(coin.current_price || 0, selectedCurrency.code)
                          : formatCurrency(
                            convertCurrency(coin.current_price || 0, selectedCurrency.code, exchangeRates),
                            selectedCurrency.code
                          )}
                      </div>
                      <div className="text-green-600 dark:text-green-400 text-xs">
                        +{formatPercentage(coin.price_change_percentage_24h || 0)}
                      </div>
                    </div>
                  </div>
                ))
              }
              {topCoins.filter(coin => coin.price_change_percentage_24h > 0).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No top performers available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Holdings */}
        {portfolio?.holdings && portfolio.holdings.length > 0 && (
          <div className="crypto-card mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="section-header">
                  Recent Holdings
                </h2>
                <Link
                  to="/portfolio"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Portfolio
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th className="text-left">Asset</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Value</th>
                      <th className="text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.slice(0, 5).map((holding) => (
                      <tr key={holding._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {holding.coinName}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 uppercase text-xs">
                              {holding.symbol}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 text-gray-900 dark:text-white">
                          {holding.amount?.toLocaleString() || '0'}
                        </td>
                        <td className="text-right py-3 font-medium text-gray-900 dark:text-white">
                          {selectedCurrency.code === 'USD'
                            ? formatCurrency(holding.currentValue || 0, selectedCurrency.code)
                            : formatCurrency(
                              convertCurrency(holding.currentValue || 0, selectedCurrency.code, exchangeRates),
                              selectedCurrency.code
                            )}
                        </td>
                        <td className="text-right py-3">
                          <div className={`flex items-center justify-end space-x-1 ${(holding.profitLossPercentage || 0) >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                            }`}>
                            {(holding.profitLossPercentage || 0) >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span className="font-medium">
                              {formatPercentage(holding.profitLossPercentage || 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="crypto-card p-6">
          <h2 className="section-header mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/portfolio"
              className="flex flex-col items-center justify-center space-y-2 p-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl text-white transition-all duration-300 hover:from-primary-600 hover:to-primary-800 hover:shadow-lg"
            >
              <Plus className="h-6 w-6" />
              <span className="font-medium">Add Holding</span>
            </Link>
            <Link
              to="/markets"
              className="flex flex-col items-center justify-center space-y-2 p-6 bg-white dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="font-medium">View Markets</span>
            </Link>
            <Link
              to="/watchlist"
              className="flex flex-col items-center justify-center space-y-2 p-6 bg-white dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700"
            >
              <Star className="h-6 w-6" />
              <span className="font-medium">Manage Watchlist</span>
            </Link>
            <button
              onClick={() => document.getElementById('currency-modal').classList.remove('hidden')}
              className="flex flex-col items-center justify-center space-y-2 p-6 bg-white dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700"
            >
              <DollarSign className="h-6 w-6" />
              <span className="font-medium">Select Currency</span>
            </button>
          </div>
        </div>
      </div>

      {/* Currency Selection Modal */}
      <div
        id="currency-modal"
        className="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            document.getElementById('currency-modal').classList.add('hidden');
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Currency</h3>
            <button
              onClick={() => document.getElementById('currency-modal').classList.add('hidden')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="text-center">
            <CurrencyToggle />
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;