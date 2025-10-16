import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyService } from '../services/currencyService';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  // Default to USD, but check localStorage first
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const saved = localStorage.getItem('selectedCurrency');
    return saved ? JSON.parse(saved) : { code: 'USD', name: 'US Dollar' };
  });
  
  const [availableCurrencies, setAvailableCurrencies] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Exchange rates cache
  const [exchangeRates, setExchangeRates] = useState({});
  
  // Fetch available currencies and exchange rates from Frankfurter API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available currencies
        const currenciesResponse = await fetch('https://api.frankfurter.dev/v1/currencies');
        if (!currenciesResponse.ok) throw new Error('Failed to fetch currencies');
        
        const currenciesData = await currenciesResponse.json();
        setAvailableCurrencies(currenciesData);
        
        // If current selected currency is not in available currencies, reset to USD
        if (!currenciesData[selectedCurrency.code]) {
          const defaultCurrency = { code: 'USD', name: 'US Dollar' };
          setSelectedCurrency(defaultCurrency);
          localStorage.setItem('selectedCurrency', JSON.stringify(defaultCurrency));
        }
        
        // Fetch initial exchange rates
        const rates = await currencyService.getExchangeRates('USD');
        setExchangeRates(rates);
        
      } catch (error) {
        console.error('Error fetching currency data:', error);
        // Set fallback data
        setAvailableCurrencies({
          USD: 'US Dollar',
          EUR: 'Euro',
          GBP: 'British Pound',
          JPY: 'Japanese Yen',
          INR: 'Indian Rupee',
          CAD: 'Canadian Dollar',
          AUD: 'Australian Dollar',
          CHF: 'Swiss Franc',
          CNY: 'Chinese Yuan'
        });
        
        setExchangeRates({
          USD: 1,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110,
          INR: 74.5,
          CAD: 1.25,
          AUD: 1.35,
          CHF: 0.92,
          CNY: 6.45
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Update selected currency and refresh exchange rates
  const updateCurrency = async (currencyCode) => {
    if (availableCurrencies[currencyCode]) {
      const currency = { code: currencyCode, name: availableCurrencies[currencyCode] };
      setSelectedCurrency(currency);
      localStorage.setItem('selectedCurrency', JSON.stringify(currency));
      
      // Refresh exchange rates for the new base currency
      const rates = await currencyService.getExchangeRates('USD');
      setExchangeRates(rates);
    }
  };
  
  const value = {
    selectedCurrency,
    availableCurrencies,
    exchangeRates,
    isLoading,
    updateCurrency
  };
  
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );


};