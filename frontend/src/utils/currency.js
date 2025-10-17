// Utilidades para formateo de moneda en Quetzales Guatemaltecos
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const formatCurrencyCompact = (amount) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount || 0);
};

export const parseCurrency = (value) => {
  if (!value) return 0;
  // Remover símbolos de moneda y espacios
  const cleanValue = value.toString().replace(/[Q$,\s]/g, '');
  return parseFloat(cleanValue) || 0;
};

export const CURRENCY_SYMBOL = 'Q';
export const CURRENCY_CODE = 'GTQ';
export const CURRENCY_NAME = 'Quetzal Guatemalteco';
