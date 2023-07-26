export function numberFormat(
  number,
  format,
  decimals,
  currency,
  lang = 'en-US',
) {
  return new Intl.NumberFormat(lang, {
    style: format || 'decimal', // "decimal", "currency", "percent", "unit"
    currency: currency || 'USD',
    useGrouping: 'auto',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: decimals || 0,
    minimumFractionDigits: decimals || 0,
  }).format(number || 0)
}
