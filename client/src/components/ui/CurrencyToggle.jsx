import React from 'react';
import { useCurrency } from '../../context/CurrencyContext.jsx';

const CurrencyToggle = () => {
  const { selectedCurrency, availableCurrencies, updateCurrency, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
        <div className="w-4 h-4 rounded-full bg-primary-500 animate-pulse"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <select
        value={selectedCurrency.code}
        onChange={(e) => updateCurrency(e.target.value)}
        className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md pl-3 pr-8 py-1.5 transition-all duration-200"
        aria-label="Select currency"
      >
        {Object.entries(availableCurrencies).map(([code, name]) => (
          <option key={code} value={code}>
            {code} - {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencyToggle;