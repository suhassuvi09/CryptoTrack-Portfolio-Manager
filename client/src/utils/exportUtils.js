import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPercentage } from './helpers';

/**
 * Export portfolio data to CSV
 * @param {Array} holdings - Array of holding objects
 * @param {Object} summary - Portfolio summary data
 * @param {string} filename - Name of the file to export
 * @param {string} currency - Currency code for export
 */
export const exportToCSV = (holdings, summary, filename = 'portfolio.csv', currency = 'USD') => {
  // Create CSV content with currency in header
  let csvContent = `Coin Name,Symbol,Amount,Buy Price (${currency}),Current Price (${currency}),Investment (${currency}),Current Value (${currency}),Profit/Loss (${currency}),P&L %,Purchase Date\n`;

  // Helper to format numbers to 2 decimal places
  const formatNumber = (value) => {
    return Number(value || 0).toFixed(2);
  };

  // Add holdings data
  holdings.forEach(holding => {
    const row = [
      `"${holding.coinName || ''}"`,
      `"${holding.symbol || ''}"`,
      `"${holding.amount || 0}"`,
      `"${formatNumber(holding.buyPrice)}"`,
      `"${formatNumber(holding.currentPrice)}"`,
      `"${formatNumber(holding.investment || (holding.amount * holding.buyPrice))}"`,
      `"${formatNumber(holding.currentValue)}"`,
      `"${(holding.profitLoss || 0) >= 0 ? '+' : ''}${formatNumber(holding.profitLoss)}"`,
      `"${formatPercentage(holding.profitLossPercentage || 0, 2, true)}"`, // forCSV = true
      `"${holding.purchaseDate ? new Date(holding.purchaseDate).toISOString().split('T')[0] : ''}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  // Add summary row
  if (summary) {
    const summaryRow = [
      '"TOTAL"',
      '""',
      '""',
      '""',
      '""',
      `"${formatNumber(summary.totalInvestment)}"`,
      `"${formatNumber(summary.totalCurrentValue)}"`,
      `"${(summary.totalProfitLoss || 0) >= 0 ? '+' : ''}${formatNumber(summary.totalProfitLoss)}"`,
      `"${formatPercentage(summary.totalProfitLossPercentage || 0, 2, true)}"`, // forCSV = true
      '""'
    ];
    csvContent += summaryRow.join(',') + '\n';
  }

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export portfolio data to PDF
 * @param {Array} holdings - Array of holding objects
 * @param {Object} summary - Portfolio summary data
 * @param {string} filename - Name of the file to export
 * @param {string} currency - Currency code for export
 */
export const exportToPDF = (holdings, summary, filename = 'portfolio.pdf', currency = 'USD') => {
  try {
    const doc = new jsPDF();

    // Currency symbols map
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'Fr',
      'KRW': '₩',
      'RUB': '₽',
      'BRL': 'R$',
      'ZAR': 'R',
      'TRY': '₺',
      'MXN': 'Mex$'
    };

    const currencySymbol = currencySymbols[currency] || currency;

    // Helper function to format with currency symbol
    const formatWithSymbol = (value) => {
      return `${currencySymbol}${Math.abs(value).toFixed(2)}`;
    };

    // Add title
    doc.setFontSize(20);
    doc.text('CryptoTrack Portfolio Report', 14, 22);

    // Add date and currency
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Currency: ${currency}`, 14, 38);

    // Add summary table
    if (summary) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Portfolio Summary', 14, 48);

      autoTable(doc, {
        startY: 53,
        head: [['Indicator', 'Amount']],
        body: [
          ['Total Holdings', summary.totalHoldings || 0],
          ['Total Investment', formatWithSymbol(summary.totalInvestment || 0)],
          ['Current Value', formatWithSymbol(summary.totalCurrentValue || 0)],
          ['Profit/Loss', `${(summary.totalProfitLoss || 0) >= 0 ? '+' : '-'}${formatWithSymbol(summary.totalProfitLoss || 0)}`],
          ['P&L Percentage', formatPercentage(summary.totalProfitLossPercentage || 0)]
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [26, 115, 232] },
        margin: { left: 14 }
      });
    }

    // Add holdings table
    if (holdings && holdings.length > 0) {
      const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 100;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Holdings Details', 14, startY);

      // Prepare holdings data
      const holdingsData = holdings.map(holding => [
        holding.coinName || '',
        holding.symbol || '',
        holding.amount || 0,
        formatWithSymbol(holding.buyPrice || 0),
        formatWithSymbol(holding.currentPrice || 0),
        formatWithSymbol(holding.investment || (holding.amount * holding.buyPrice) || 0),
        formatWithSymbol(holding.currentValue || 0),
        `${(holding.profitLoss || 0) >= 0 ? '+' : '-'}${formatWithSymbol(holding.profitLoss || 0)}`,
        formatPercentage(holding.profitLossPercentage || 0),
        holding.purchaseDate ? new Date(holding.purchaseDate).toISOString().split('T')[0] : ''
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [
          ['Coin', 'Symbol', 'Amount', `Buy Price (${currency})`, `Current (${currency})`, `Investment (${currency})`, `Value (${currency})`, `P/L (${currency})`, 'P/L %', 'Date']
        ],
        body: holdingsData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 115, 232] },
        margin: { left: 14 }
      });
    }

    // Save the PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error in exportToPDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

/**
 * Trigger browser download for any blob data
 * @param {Blob} blob - The data to download
 * @param {string} filename - Name of the file to save
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};