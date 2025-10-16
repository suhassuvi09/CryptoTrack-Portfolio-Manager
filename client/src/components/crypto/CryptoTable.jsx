import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Star, Eye } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { formatCurrency, formatPercentage, convertCurrency } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';

const CryptoTable = ({ 
  data = [], 
  loading = false, 
  onAddToWatchlist, 
  onViewDetails,
  watchlist = [],
  showWatchlistColumn = true 
}) => {
  const { selectedCurrency, exchangeRates } = useCurrency();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(coin => 
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return filtered;
  }, [data, search, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const isInWatchlist = (coinId) => {
    return watchlist.some(item => item.coinId === coinId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3">
                <button
                  onClick={() => handleSort('market_cap_rank')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>#</span>
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Name</span>
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => handleSort('current_price')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Price</span>
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => handleSort('price_change_percentage_24h')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>24h %</span>
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => handleSort('market_cap')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Market Cap</span>
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => handleSort('total_volume')}
                  className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Volume (24h)</span>
                </button>
              </th>
              {showWatchlistColumn && (
                <th className="px-6 py-3">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((coin) => (
              <tr
                key={coin.id}
                className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {coin.market_cap_rank}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {coin.name}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {selectedCurrency.code === 'USD' 
                    ? formatCurrency(coin.current_price, selectedCurrency.code)
                    : formatCurrency(
                        convertCurrency(coin.current_price, selectedCurrency.code, exchangeRates), 
                        selectedCurrency.code
                      )}
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center space-x-1 ${
                    coin.price_change_percentage_24h >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {coin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {formatPercentage(coin.price_change_percentage_24h)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {selectedCurrency.code === 'USD' 
                    ? formatCurrency(coin.market_cap, selectedCurrency.code, 0)
                    : formatCurrency(
                        convertCurrency(coin.market_cap, selectedCurrency.code, exchangeRates), 
                        selectedCurrency.code,
                        0
                      )}
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {selectedCurrency.code === 'USD' 
                    ? formatCurrency(coin.total_volume, selectedCurrency.code, 0)
                    : formatCurrency(
                        convertCurrency(coin.total_volume, selectedCurrency.code, exchangeRates), 
                        selectedCurrency.code,
                        0
                      )}
                </td>
                {showWatchlistColumn && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onAddToWatchlist(coin)}
                        className={`p-2 rounded-lg transition-colors ${
                          isInWatchlist(coin.id)
                            ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        }`}
                        title={isInWatchlist(coin.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <Star className={`h-4 w-4 ${isInWatchlist(coin.id) ? 'fill-current' : ''}`} />
                      </button>
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(coin)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No cryptocurrencies found
          </p>
        </div>
      )}
    </div>
  );
};

export default CryptoTable;