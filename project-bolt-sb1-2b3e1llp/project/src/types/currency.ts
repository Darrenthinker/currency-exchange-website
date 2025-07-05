export interface ExchangeRate {
  date: string;
  rate: number;
  change: number;
  changePercent: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  result: number;
  timestamp: string;
}

export type TimePeriod = '1D' | '5D' | '1M' | '1Y' | '5Y' | 'MAX';