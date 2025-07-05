import { ExchangeRate, TimePeriod } from '../types/currency';

const UNIRATE_API_KEY = 'boD3FcxoDzeGMukU48L9S0hakWV0np7feubaSJbH2tEnNerht7vir39R06mr9VRD';
const UNIRATE_BASE = 'https://api.unirateapi.com/api';

// 获取实时汇率（异步，调用 UniRateAPI）
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return 1;
  const url = `${UNIRATE_BASE}/rates?api_key=${UNIRATE_API_KEY}&from=${fromCurrency}&to=${toCurrency}`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.rates?.[toCurrency] || 0;
};

// 兑换金额（异步，调用 getExchangeRate）
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

// 获取历史数据（异步，调用 UniRateAPI）
export const generateHistoricalData = async (
  fromCurrency: string,
  toCurrency: string,
  period: TimePeriod
): Promise<ExchangeRate[]> => {
  // 只支持最大5年，按 period 计算起止日期
  const end = new Date();
  let days = 30;
  switch (period) {
    case '1D': days = 1; break;
    case '5D': days = 5; break;
    case '1M': days = 30; break;
    case '1Y': days = 365; break;
    case '5Y': days = 1825; break;
    case 'MAX': days = 1825; break;
    default: days = 30;
  }
  const start = new Date(end);
  start.setDate(end.getDate() - days);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const url = `${UNIRATE_BASE}/historical/timeseries?api_key=${UNIRATE_API_KEY}&from=${fromCurrency}&to=${toCurrency}&start_date=${startStr}&end_date=${endStr}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  // 组装成 ExchangeRate[]
  return Object.entries(data.data || {}).map(([date, rates]: any) => ({
    date,
    rate: rates[toCurrency] || 0,
    change: 0,
    changePercent: 0,
  }));
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
};

export const formatRate = (rate: number): string => {
  return rate.toFixed(4);
};

// 获取UniRateAPI支持的币种列表
export const getSupportedCurrenciesFromAPI = async (): Promise<string[]> => {
  const url = `${UNIRATE_BASE}/currencies?api_key=${UNIRATE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.currencies || [];
};