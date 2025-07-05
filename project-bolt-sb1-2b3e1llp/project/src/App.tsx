import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CurrencySelector } from './components/CurrencySelector';
import { ConversionResult } from './components/ConversionResult';
import { ExchangeRateChart } from './components/ExchangeRateChart';
import { TimePeriodSelector } from './components/TimePeriodSelector';
import { convertCurrency, getExchangeRate, generateHistoricalData, getSupportedCurrenciesFromAPI } from './utils/currencyService';
import { TimePeriod } from './types/currency';
import { RefreshCw, ArrowLeftRight } from 'lucide-react';
import { Calculator } from './components/Calculator';
import { currencyMetaMap } from './data/currencies';

function App() {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('CNY');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 新增：异步数据状态
  const [result, setResult] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [timestamp, setTimestamp] = useState<string>(new Date().toLocaleString('zh-CN'));

  // 新增：币种列表状态
  const [currencyList, setCurrencyList] = useState<{ code: string; country: string; name: string }[]>([]);

  // 全局加载API币种列表
  useEffect(() => {
    async function fetchCurrencies() {
      const codes = await getSupportedCurrenciesFromAPI();
      // 用本地映射补全展示信息
      const list = codes.map((code: string) => ({
        code,
        country: currencyMetaMap[code]?.country || code,
        name: currencyMetaMap[code]?.name || code
      }));
      // 排序逻辑
      const majorFiat = [
        'USD', 'CNY', 'EUR', 'JPY', 'GBP', 'HKD', 'AUD', 'CAD', 'SGD', 'KRW', 'INR', 'RUB', 'BRL', 'ZAR'
      ];
      const fiatList = list.filter(item => currencyMetaMap[item.code]);
      const cryptoList = list.filter(item => !currencyMetaMap[item.code]);
      // 经济大国法币优先
      const sortedFiat = [
        ...majorFiat
          .map(code => fiatList.find(item => item.code === code))
          .filter((item): item is { code: string; country: string; name: string } => Boolean(item)),
        ...fiatList.filter(item => !majorFiat.includes(item.code))
      ];
      setCurrencyList([...sortedFiat, ...cryptoList]);
    }
    fetchCurrencies();
  }, []);

  // 汇率和兑换结果
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setIsLoading(true);
      const [r, rt] = await Promise.all([
        convertCurrency(amount, fromCurrency, toCurrency),
        getExchangeRate(fromCurrency, toCurrency)
      ]);
      if (!cancelled) {
        setResult(Number(r));
        setRate(Number(rt));
        setTimestamp(new Date().toLocaleString('zh-CN'));
        setIsLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [amount, fromCurrency, toCurrency]);

  // 历史数据
  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      const data = await generateHistoricalData(fromCurrency, toCurrency, selectedPeriod);
      if (!cancelled) setHistoricalData(data);
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [fromCurrency, toCurrency, selectedPeriod]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleConvert = () => {
    // 触发转换动画或其他效果
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
        {/* 货币选择区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* 原始货币 */}
            <div>
              <CurrencySelector
                selectedCurrency={fromCurrency}
                onCurrencyChange={setFromCurrency}
                label="原始货币："
                currencyList={currencyList}
              />
            </div>

            {/* 交换按钮 */}
            <div className="flex justify-center">
              <button
                onClick={handleSwapCurrencies}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-md"
                title="交换货币"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>

            {/* 目标货币 */}
            <div>
              <CurrencySelector
                selectedCurrency={toCurrency}
                onCurrencyChange={setToCurrency}
                label="目标货币："
                currencyList={currencyList}
              />
            </div>
          </div>
        </div>

        {/* 兑换数额输入区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                兑换数额：
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入金额"
              />
            </div>
            <button
              onClick={handleConvert}
              className="w-28 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mt-2 flex items-center justify-center text-lg"
              disabled={isLoading}
            >
              {isLoading ? '转换中...' : '兑换'}
            </button>
          </div>
        </div>

        {/* 转换结果 */}
        <div className="mb-6">
          <ConversionResult
            amount={amount}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            result={result}
            rate={rate}
            timestamp={timestamp}
          />
        </div>

        {/* 数学计算器 */}
        <Calculator />

        {/* 汇率图表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800">汇率历史走势</h2>
            <TimePeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>

          <ExchangeRateChart
            data={historicalData}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
          />
        </div>
      </main>
    </div>
  );
}

export default App;