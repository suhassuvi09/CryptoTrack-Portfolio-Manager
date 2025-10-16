// Format currency values
export const formatCurrency = (value, currency = 'USD', decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  // If currency is not provided, default to USD
  if (!currency) {
    currency = 'USD';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
};

// Convert USD value to target currency using exchange rates
export const convertCurrency = (usdAmount, targetCurrency, exchangeRates) => {
  if (!usdAmount || !targetCurrency || !exchangeRates || targetCurrency === 'USD') {
    return usdAmount;
  }

  const rate = exchangeRates[targetCurrency];
  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}`);
    return usdAmount;
  }

  return usdAmount * rate;
};

// Format large numbers with abbreviations (K, M, B, T)
export const formatLargeNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(decimals)}T`;
  } else if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }

  return value.toFixed(decimals);
};

// Format percentage
export const formatPercentage = (value, decimals = 2, forCSV = false) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  // For CSV export, we want the raw number without the % symbol
  if (forCSV) {
    return value.toFixed(decimals);
  }

  return `${value.toFixed(decimals)}%`;
};

// Format crypto amount
export const formatCryptoAmount = (amount, symbol = '', decimals = 8) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }

  // Use fewer decimals for larger amounts
  let displayDecimals = decimals;
  if (amount >= 1000) {
    displayDecimals = 2;
  } else if (amount >= 1) {
    displayDecimals = 4;
  }

  const formatted = Number(amount).toFixed(displayDecimals);
  return symbol ? `${formatted} ${symbol.toUpperCase()}` : formatted;
};

// Get price change color class
export const getPriceChangeColor = (change) => {
  if (change > 0) return 'text-crypto-green';
  if (change < 0) return 'text-crypto-red';
  return 'text-gray-500';
};

// Get price change icon
export const getPriceChangeIcon = (change) => {
  if (change > 0) return '↗';
  if (change < 0) return '↘';
  return '→';
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

// Calculate password strength
const calculatePasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*(),.?\":{}|<>]/.test(password)) strength += 1;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Generate random ID
export const generateId = (length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate portfolio metrics
export const calculatePortfolioMetrics = (holdings, currentPrices) => {
  if (!holdings || holdings.length === 0) {
    return {
      totalInvestment: 0,
      totalCurrentValue: 0,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
      bestPerformer: null,
      worstPerformer: null,
    };
  }

  let totalInvestment = 0;
  let totalCurrentValue = 0;
  let bestPerformer = null;
  let worstPerformer = null;
  let bestPerformance = -Infinity;
  let worstPerformance = Infinity;

  holdings.forEach(holding => {
    const investment = holding.amount * holding.buyPrice;
    const currentPrice = currentPrices[holding.coinId] || 0;
    const currentValue = holding.amount * currentPrice;
    const profitLoss = currentValue - investment;
    const profitLossPercentage = investment > 0 ? (profitLoss / investment) * 100 : 0;

    totalInvestment += investment;
    totalCurrentValue += currentValue;

    if (profitLossPercentage > bestPerformance) {
      bestPerformance = profitLossPercentage;
      bestPerformer = { ...holding, profitLossPercentage };
    }

    if (profitLossPercentage < worstPerformance) {
      worstPerformance = profitLossPercentage;
      worstPerformer = { ...holding, profitLossPercentage };
    }
  });

  const totalProfitLoss = totalCurrentValue - totalInvestment;
  const totalProfitLossPercentage = totalInvestment > 0
    ? (totalProfitLoss / totalInvestment) * 100
    : 0;

  return {
    totalInvestment,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercentage,
    bestPerformer,
    worstPerformer,
  };
};

// Sort array of objects by multiple criteria
export const multiSort = (array, sortBy) => {
  return array.sort((a, b) => {
    for (const { key, direction = 'asc' } of sortBy) {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) continue;

      const comparison = aVal > bVal ? 1 : -1;
      return direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
};

// Get coin logo URL (using CoinGecko images as fallback)
export const getCoinLogoUrl = (coinId, size = 'small') => {
  const sizeMap = {
    small: 32,
    medium: 64,
    large: 128,
  };

  const pixelSize = sizeMap[size] || 32;
  return `https://assets.coingecko.com/coins/images/${coinId}/${pixelSize}x${pixelSize}.png`;
};

// Format date relative to now (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Check if device is mobile
export const isMobile = () => {
  return window.innerWidth <= 768;
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};