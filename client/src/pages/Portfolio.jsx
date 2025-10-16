import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit, Trash2, RefreshCw, Download, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { portfolioService } from '../services/portfolioService';
import { cryptoService } from '../services/cryptoService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AddHoldingModal from '../components/portfolio/AddHoldingModal';
import { formatCurrency, formatPercentage, convertCurrency } from '../utils/helpers';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Portfolio = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchPortfolio = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const portfolioData = await portfolioService.getPortfolio();
      // The response interceptor already returns response.data, so we don't need to access .data again
      const portfolioInfo = portfolioData.data || portfolioData || {};
      setPortfolio(portfolioInfo);
      setHoldings(portfolioInfo.holdings || []);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCoins = async () => {
    try {
      const coinsData = await cryptoService.getCoinMarkets({
        vs_currency: 'usd',
        per_page: 250,
        page: 1
      });
      // The response interceptor already returns response.data, so we don't need to access .data again
      setCoins(coinsData.data || coinsData || []);
    } catch (error) {
      console.error('Failed to fetch coins:', error);
    }
  };

  const handleAddHolding = async (holdingData) => {
    try {
      await portfolioService.addHolding(holdingData);
      await fetchPortfolio();
      toast.success('Holding added successfully');
    } catch (error) {
      console.error('Failed to add holding:', error);
      toast.error('Failed to add holding');
    }
  };

  const handleDeleteHolding = async (holdingId, coinName) => {
    if (!window.confirm(`Are you sure you want to delete ${coinName} from your portfolio?`)) {
      return;
    }

    try {
      await portfolioService.deleteHolding(holdingId);
      await fetchPortfolio();
      toast.success('Holding deleted successfully');
    } catch (error) {
      console.error('Failed to delete holding:', error);
      toast.error('Failed to delete holding');
    }
  };

  const handleRefresh = () => {
    fetchPortfolio(true);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      // Convert holdings data to selected currency
      const convertedHoldings = holdings.map(holding => ({
        ...holding,
        buyPrice: selectedCurrency.code === 'USD'
          ? holding.buyPrice
          : convertCurrency(holding.buyPrice, selectedCurrency.code, exchangeRates),
        currentPrice: selectedCurrency.code === 'USD'
          ? holding.currentPrice
          : convertCurrency(holding.currentPrice, selectedCurrency.code, exchangeRates),
        investment: selectedCurrency.code === 'USD'
          ? holding.investment
          : convertCurrency(holding.investment, selectedCurrency.code, exchangeRates),
        currentValue: selectedCurrency.code === 'USD'
          ? holding.currentValue
          : convertCurrency(holding.currentValue, selectedCurrency.code, exchangeRates),
        profitLoss: selectedCurrency.code === 'USD'
          ? holding.profitLoss
          : convertCurrency(holding.profitLoss, selectedCurrency.code, exchangeRates)
      }));

      // Convert portfolio summary to selected currency
      const convertedPortfolio = {
        ...portfolio,
        totalInvestment: selectedCurrency.code === 'USD'
          ? portfolio.totalInvestment
          : convertCurrency(portfolio.totalInvestment, selectedCurrency.code, exchangeRates),
        totalCurrentValue: selectedCurrency.code === 'USD'
          ? portfolio.totalCurrentValue
          : convertCurrency(portfolio.totalCurrentValue, selectedCurrency.code, exchangeRates),
        totalProfitLoss: selectedCurrency.code === 'USD'
          ? portfolio.totalProfitLoss
          : convertCurrency(portfolio.totalProfitLoss, selectedCurrency.code, exchangeRates)
      };

      exportToCSV(convertedHoldings, convertedPortfolio, 'portfolio.csv', selectedCurrency.code);
      toast.success('Portfolio exported as CSV successfully');
    } catch (error) {
      console.error('Failed to export portfolio as CSV:', error);
      toast.error('Failed to export portfolio as CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Convert holdings data to selected currency
      const convertedHoldings = holdings.map(holding => ({
        ...holding,
        buyPrice: selectedCurrency.code === 'USD'
          ? holding.buyPrice
          : convertCurrency(holding.buyPrice, selectedCurrency.code, exchangeRates),
        currentPrice: selectedCurrency.code === 'USD'
          ? holding.currentPrice
          : convertCurrency(holding.currentPrice, selectedCurrency.code, exchangeRates),
        investment: selectedCurrency.code === 'USD'
          ? holding.investment
          : convertCurrency(holding.investment, selectedCurrency.code, exchangeRates),
        currentValue: selectedCurrency.code === 'USD'
          ? holding.currentValue
          : convertCurrency(holding.currentValue, selectedCurrency.code, exchangeRates),
        profitLoss: selectedCurrency.code === 'USD'
          ? holding.profitLoss
          : convertCurrency(holding.profitLoss, selectedCurrency.code, exchangeRates)
      }));

      // Convert portfolio summary to selected currency
      const convertedPortfolio = {
        ...portfolio,
        totalInvestment: selectedCurrency.code === 'USD'
          ? portfolio.totalInvestment
          : convertCurrency(portfolio.totalInvestment, selectedCurrency.code, exchangeRates),
        totalCurrentValue: selectedCurrency.code === 'USD'
          ? portfolio.totalCurrentValue
          : convertCurrency(portfolio.totalCurrentValue, selectedCurrency.code, exchangeRates),
        totalProfitLoss: selectedCurrency.code === 'USD'
          ? portfolio.totalProfitLoss
          : convertCurrency(portfolio.totalProfitLoss, selectedCurrency.code, exchangeRates)
      };

      exportToPDF(convertedHoldings, convertedPortfolio, 'portfolio.pdf', selectedCurrency.code);
      toast.success('Portfolio exported as PDF successfully');
    } catch (error) {
      console.error('Failed to export portfolio as PDF:', error);
      toast.error('Failed to export portfolio as PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  useEffect(() => {
    if (showAddModal) {
      // Only fetch coins when modal is opened
      if (coins.length === 0) {
        fetchCoins();
      }
    }
  }, [showAddModal]);

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
            Sign in to view your portfolio
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your cryptocurrency investments by creating an account
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
              Portfolio
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your cryptocurrency holdings and track performance
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
                disabled={exporting || holdings.length === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm hover:shadow"
              >
                <Download className="h-4 w-4" />
                <span>{exporting ? 'Exporting...' : 'Export'}</span>
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

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Holding</span>
            </button>
          </div>
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
                    ? formatCurrency(portfolio.totalCurrentValue || 0, selectedCurrency.code)
                    : formatCurrency(
                      convertCurrency(portfolio.totalCurrentValue || 0, selectedCurrency.code, exchangeRates),
                      selectedCurrency.code
                    )}
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
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCurrency.code === 'USD'
                    ? formatCurrency(portfolio.totalInvestment || 0, selectedCurrency.code)
                    : formatCurrency(
                      convertCurrency(portfolio.totalInvestment || 0, selectedCurrency.code, exchangeRates),
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
                <p className={`text-2xl font-bold ${(portfolio.totalProfitLoss || 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                  }`}>
                  {(portfolio.totalProfitLoss || 0) >= 0 ? '+' : ''}
                  {selectedCurrency.code === 'USD'
                    ? formatCurrency(portfolio.totalProfitLoss || 0, selectedCurrency.code)
                    : formatCurrency(
                      convertCurrency(portfolio.totalProfitLoss || 0, selectedCurrency.code, exchangeRates),
                      selectedCurrency.code
                    )}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${(portfolio.totalProfitLoss || 0) >= 0
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                {(portfolio.totalProfitLoss || 0) >= 0 ? (
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
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Holdings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolio.totalHoldings || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {holdings.length > 0 ? (
        <div className="crypto-card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="section-header">
              Your Holdings
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="text-left">Asset</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Buy Price</th>
                  <th className="text-right">Current Price</th>
                  <th className="text-right">Current Value</th>
                  <th className="text-right">Profit/Loss</th>
                  <th className="text-right">P&L %</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding._id}>
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
                      {holding.amount.toLocaleString()}
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD'
                        ? formatCurrency(holding.buyPrice, selectedCurrency.code)
                        : formatCurrency(
                          convertCurrency(holding.buyPrice, selectedCurrency.code, exchangeRates),
                          selectedCurrency.code
                        )}
                    </td>
                    <td className="text-right py-3 text-gray-900 dark:text-white">
                      {selectedCurrency.code === 'USD'
                        ? formatCurrency(holding.currentPrice || 0, selectedCurrency.code)
                        : formatCurrency(
                          convertCurrency(holding.currentPrice || 0, selectedCurrency.code, exchangeRates),
                          selectedCurrency.code
                        )}
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
                      <span className={`font-medium ${(holding.profitLoss || 0) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {(holding.profitLoss || 0) >= 0 ? '+' : ''}
                        {selectedCurrency.code === 'USD'
                          ? formatCurrency(holding.profitLoss || 0, selectedCurrency.code)
                          : formatCurrency(
                            convertCurrency(holding.profitLoss || 0, selectedCurrency.code, exchangeRates),
                            selectedCurrency.code
                          )}
                      </span>
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
                    <td className="text-right py-3">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeleteHolding(holding._id, holding.coinName)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete holding"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="crypto-card p-12 text-center">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              You don't have any holdings yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 mt-2 mb-6">
              Add your first cryptocurrency holding to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Holding</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Holding Modal */}
      {showAddModal && (
        <AddHoldingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddHolding}
          coins={coins}
        />
      )}
    </div>
  );
};

export default Portfolio;