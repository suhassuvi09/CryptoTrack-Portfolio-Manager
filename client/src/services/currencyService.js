import api from './authService';

export const currencyService = {
  // Get exchange rates from Frankfurter API
  getExchangeRates: async (baseCurrency = 'USD') => {
    try {
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=${baseCurrency}`);
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates for major currencies
      return {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        INR: 74.5,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45
      };
    }
  }
};

export default currencyService;