import React from 'react';
import { currencies } from '../data/currencies';

interface ConversionResultProps {
  amount: number;
  /** 输入框为空（未输入），不展示「0 = 0.00」占位换算 */
  amountInputEmpty?: boolean;
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
  amountInputEmpty,
  fromCurrency,
  toCurrency,
  result,
  timestamp,
  immediateResult,
  isImmediateCalculation,
}) => {
  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  const displayResult = isImmediateCalculation && immediateResult !== undefined ? immediateResult : result;

  const formattedResult = displayResult.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
      <div className="flex items-center justify-center space-x-4 mb-6">
        {amountInputEmpty ? (
          <div className="text-lg text-gray-500 py-4">
            请输入兑换数额后查看换算结果
          </div>
        ) : (
          <>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600">
                {amount.toLocaleString()} {fromCurrency}
              </div>
              <div className="text-lg text-gray-600 mt-1">{fromCurrencyData?.name}</div>
            </div>

            <div className="text-4xl font-bold text-gray-400">=</div>

            <div className="text-left">
              <div className="text-3xl font-bold text-green-600">
                {formattedResult} {toCurrency}
              </div>
              <div className="text-lg text-gray-600 mt-1">{toCurrencyData?.name}</div>
            </div>
          </>
        )}
      </div>

      <div className="text-sm text-gray-500">
        汇率更新：{timestamp}
        <span className="ml-4">
          汇率来源：
          <a href="https://unirateapi.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">UniRateAPI</a>
          <span className="mx-1">|</span>
          <a href="https://www.boc.cn/sourcedb/whpj/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">中国银行</a>
        </span>
      </div>
    </div>
  );
};