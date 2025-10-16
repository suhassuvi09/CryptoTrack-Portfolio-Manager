import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';

const AddHoldingModal = ({ isOpen, onClose, onSubmit, coins = [] }) => {
  const [formData, setFormData] = useState({
    coinId: '',
    coinName: '',
    symbol: '',
    amount: '',
    buyPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Filter coins based on search term
  const filteredCoins = useMemo(() => {
    if (!searchTerm) return [];
    return coins
      .filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 20); // Limit to 20 results for performance
  }, [coins, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCoinSelect = (coin) => {
    console.log('Selected coin:', coin); // Debug log
    const currentPrice = coin.current_price || 0;
    setFormData(prev => ({
      ...prev,
      coinId: coin.id,
      coinName: coin.name,
      symbol: coin.symbol,
      buyPrice: currentPrice.toString()
    }));
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.coinId) newErrors.coinId = 'Please select a cryptocurrency';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.buyPrice || isNaN(parseFloat(formData.buyPrice)) || parseFloat(formData.buyPrice) < 0) {
      newErrors.buyPrice = 'Buy price must be 0 or greater';
    }
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        coinId: '',
        coinName: '',
        symbol: '',
        amount: '',
        buyPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      onClose();
    } catch (error) {
      console.error('Failed to add holding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define selectedCoin using useMemo for better performance
  const selectedCoin = useMemo(() => {
    return coins.find(coin => coin.id === formData.coinId);
  }, [coins, formData.coinId]);

  // Memoize the formatted current price to prevent unnecessary re-renders
  const formattedCurrentPrice = useMemo(() => {
    return selectedCoin ? formatCurrency(selectedCoin.current_price) : '';
  }, [selectedCoin]);

  // Memoize the total investment calculation
  const totalInvestment = useMemo(() => {
    if (formData.amount && formData.buyPrice) {
      const amount = parseFloat(formData.amount);
      const buyPrice = parseFloat(formData.buyPrice);
      if (!isNaN(amount) && !isNaN(buyPrice)) {
        return formatCurrency(amount * buyPrice);
      }
    }
    return '';
  }, [formData.amount, formData.buyPrice]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add New Holding
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Coin Selection */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cryptocurrency
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm || (selectedCoin ? `${selectedCoin.name} (${selectedCoin.symbol.toUpperCase()})` : '')}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm && setShowDropdown(true)}
                  placeholder="Search for a cryptocurrency..."
                  className={`w-full px-3 py-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.coinId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              {showDropdown && filteredCoins.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md max-h-60 overflow-auto">
                  {filteredCoins.map(coin => (
                    <div
                      key={coin.id}
                      onClick={() => handleCoinSelect(coin)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center"
                    >
                      <img 
                        src={coin.image} 
                        alt={coin.name} 
                        className="w-6 h-6 mr-2 rounded-full" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{coin.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{coin.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showDropdown && searchTerm && filteredCoins.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md py-2 px-4 text-gray-500 dark:text-gray-400">
                  No cryptocurrencies found
                </div>
              )}
            </div>
            
            {errors.coinId && (
              <p className="mt-1 text-sm text-red-600">{errors.coinId}</p>
            )}

            {/* Current Price Display */}
            {selectedCoin && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Current Price:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formattedCurrentPrice || '$0.00'}
                  </span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.amount ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-primary-500`}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Buy Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buy Price (USD)
              </label>
              <input
                type="number"
                name="buyPrice"
                value={formData.buyPrice}
                onChange={handleChange}
                step="any"
                min="0"
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.buyPrice ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-primary-500`}
              />
              {errors.buyPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.buyPrice}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.purchaseDate ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-primary-500`}
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Total Investment Display */}
            {formData.amount && formData.buyPrice && totalInvestment && (
              <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-700 dark:text-primary-300">Total Investment:</span>
                  <span className="font-medium text-primary-900 dark:text-primary-100">
                    {totalInvestment}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" className="text-white" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holding
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddHoldingModal;