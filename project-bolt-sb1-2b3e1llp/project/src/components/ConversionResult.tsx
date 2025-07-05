import React from 'react';
import { currencies } from '../data/currencies';

interface ConversionResultProps {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  result: number;
  rate: number;
  timestamp: string;
  immediateResult?: number;
  isImmediateCalculation?: boolean;
}

export const ConversionResult: React.FC<ConversionResultProps> = ({
  amount,
  fromCurrency,
  toCurrency,
  result,
  rate,
  timestamp,
  immediateResult,
  isImmediateCalculation,
}) => {
  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  // 优先显示立即计算结果，提升响应速度
  const displayResult = isImmediateCalculation && immediateResult !== undefined ? immediateResult : result;
  const isUsingImmediateResult = isImmediateCalculation && immediateResult !== undefined;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="text-right">
          <div className="text-3xl font-bold text-red-600">
            {amount.toLocaleString()} {fromCurrency}
          </div>
          <div className="text-lg text-gray-600 mt-1">{fromCurrencyData?.name}</div>
        </div>
        
        <div className="text-4xl font-bold text-gray-400">=</div>
        
        <div className="text-left">
          <div className={`text-3xl font-bold ${isUsingImmediateResult ? 'text-blue-600' : 'text-green-600'}`}>
            {displayResult.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {toCurrency}
          </div>
          <div className="text-lg text-gray-600 mt-1">{toCurrencyData?.name}</div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        {isUsingImmediateResult ? (
          <span className="text-blue-600 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在获取最新汇率...
          </span>
        ) : (
          <>
            汇率更新时间：{timestamp}
            <span className="ml-4">
              数据来源：<a href="https://unirateapi.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">UniRateAPI</a>
            </span>
          </>
        )}
      </div>
    </div>
  );
};