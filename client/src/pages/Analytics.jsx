import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { portfolioService } from '../services/portfolioService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, formatPercentage, convertCurrency } from '../utils/helpers';

const Analytics = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPortfolio = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const portfolioData = await portfolioService.getPortfolio();
      setPortfolio(portfolioData.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to view analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your portfolio performance by creating an account
          </p>
        </div>
      </div>
    );
  }

  // Calculate portfolio allocation data
  const allocationData = portfolio?.holdings
    ?.filter(holding => holding.currentValue > 0)
    .map(holding => ({
      coinId: holding.coinId,
      coinName: holding.coinName,
      symbol: holding.symbol,
      value: holding.currentValue,
      percentage: portfolio.totalCurrentValue > 0 
        ? (holding.currentValue / portfolio.totalCurrentValue) * 100 
        : 0
    }))
    .sort((a, b) => b.value - a.value) || [];

  // Get top and worst performers
  const topPerformers = portfolio?.holdings
    ?.filter(holding => holding.profitLossPercentage > 0)
    .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
    .slice(0, 5) || [];

  const worstPerformers = portfolio?.holdings
    ?.filter(holding => holding.profitLossPercentage < 0)
    .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
    .slice(0, 5) || [];

  // Color palette for charts
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6'
  ];

  const handleRefresh = () => {
    fetchPortfolio(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Detailed insights into your portfolio performance
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm hover:shadow"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCurrency.code === 'USD' 
                    ? formatCurrency(portfolio.totalCurrentValue, selectedCurrency.code)
                    : formatCurrency(
                        convertCurrency(portfolio.totalCurrentValue, selectedCurrency.code, exchangeRates), 
                        selectedCurrency.code
                      )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <PieChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="crypto-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCurrency.code === 'USD' 
                    ? formatCurrency(portfolio.totalInvestment, selectedCurrency.code)
                    : formatCurrency(
                        convertCurrency(portfolio.totalInvestment, selectedCurrency.code, exchangeRates), 
                        selectedCurrency.code
                      )}
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
                <p className="text-sm text-gray-600 dark:text-gray-300">Profit/Loss</p>
                <p className={`text-2xl font-bold ${
                  portfolio.totalProfitLoss >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {portfolio.totalProfitLoss >= 0 ? '+' : ''}
                  {selectedCurrency.code === 'USD' 
                    ? formatCurrency(portfolio.totalProfitLoss, selectedCurrency.code)
                    : formatCurrency(
                        convertCurrency(portfolio.totalProfitLoss, selectedCurrency.code, exchangeRates), 
                        selectedCurrency.code
                      )}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                portfolio.totalProfitLoss >= 0
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {portfolio.totalProfitLoss >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>

          <div className="crypto-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">P&L Percentage</p>
                <p className={`text-2xl font-bold ${
                  portfolio.totalProfitLossPercentage >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {portfolio.totalProfitLossPercentage >= 0 ? '+' : ''}{formatPercentage(portfolio.totalProfitLossPercentage)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Allocation Chart */}
      {allocationData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Allocation Pie Chart */}
          <div className="crypto-card p-6">
            <h2 className="section-header mb-6">
              Portfolio Allocation
            </h2>
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {allocationData.reduce((acc, item, index) => {
                    const startAngle = acc.totalAngle;
                    const angle = (item.percentage / 100) * 360;
                    const endAngle = startAngle + angle;
                    
                    // Calculate coordinates for the arc
                    const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                    const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                    
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    
                    const pathData = [
                      `M 50 50`,
                      `L ${startX} ${startY}`,
                      `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                      'Z'
                    ].join(' ');
                    
                    acc.paths.push(
                      <path
                        key={item.coinId}
                        d={pathData}
                        fill={colors[index % colors.length]}
                      />
                    );
                    
                    acc.totalAngle = endAngle;
                    return acc;
                  }, { paths: [], totalAngle: 0 }).paths}
                  
                  {/* Center circle */}
                  <circle cx="50" cy="50" r="15" fill="white" className="dark:fill-gray-800" />
                </svg>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {allocationData.map((item, index) => (
                <div key={item.coinId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {item.symbol.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPercentage(item.percentage)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation Table */}
          <div className="crypto-card p-6">
            <h2 className="section-header mb-6">
              Allocation Breakdown
            </h2>
            <div className="space-y-4">
              {allocationData.map((item, index) => (
                <div key={item.coinId} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.coinName}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({item.symbol.toUpperCase()})
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(item.value, selectedCurrency.code)
                        : formatCurrency(
                            convertCurrency(item.value, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code
                          )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: colors[index % colors.length]
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatPercentage(item.percentage)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(item.value, selectedCurrency.code)
                        : formatCurrency(
                            convertCurrency(item.value, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code
                          )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div className="crypto-card p-6">
            <h2 className="section-header mb-6">
              Top Performers
            </h2>
            <div className="space-y-4">
              {topPerformers.map((holding) => (
                <div key={holding._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {holding.coinName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {holding.symbol.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      +{formatPercentage(holding.profitLossPercentage)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(holding.profitLoss, selectedCurrency.code)
                        : formatCurrency(
                            convertCurrency(holding.profitLoss, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code
                          )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worst Performers */}
        {worstPerformers.length > 0 && (
          <div className="crypto-card p-6">
            <h2 className="section-header mb-6">
              Worst Performers
            </h2>
            <div className="space-y-4">
              {worstPerformers.map((holding) => (
                <div key={holding._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {holding.coinName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {holding.symbol.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600 dark:text-red-400">
                      {formatPercentage(holding.profitLossPercentage)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedCurrency.code === 'USD' 
                        ? formatCurrency(holding.profitLoss, selectedCurrency.code)
                        : formatCurrency(
                            convertCurrency(holding.profitLoss, selectedCurrency.code, exchangeRates), 
                            selectedCurrency.code
                          )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!portfolio || portfolio.holdings.length === 0) && (
        <div className="crypto-card p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No portfolio data available
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Add cryptocurrency holdings to your portfolio to see analytics
          </p>
          <button className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
            Add Holding
          </button>
        </div>
      )}
    </div>
  );
};

export default Analytics;