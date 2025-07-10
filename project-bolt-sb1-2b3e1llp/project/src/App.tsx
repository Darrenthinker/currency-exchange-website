import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CurrencySelector } from './components/CurrencySelector';
import { ConversionResult } from './components/ConversionResult';
import { ExchangeRateChart } from './components/ExchangeRateChart';
import { TimePeriodSelector } from './components/TimePeriodSelector';
import { convertCurrency, getExchangeRate, generateHistoricalData, getSupportedCurrenciesFromAPI, preloadExchangeRate } from './utils/currencyService';
import { TimePeriod } from './types/currency';
import { RefreshCw, ArrowLeftRight } from 'lucide-react';
import { Calculator } from './components/Calculator';
import { currencyMetaMap } from './data/currencies';

// 防抖函数
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

function App() {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('CNY');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 新增：异步数据状态
  const [result, setResult] = useState<number>(0);
  const [rate, setRate] = useState<number>(7.1661); // 初始汇率USD-CNY
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [timestamp, setTimestamp] = useState<string>(new Date().toLocaleString('zh-CN'));

  // 新增：立即响应状态
  const [immediateResult, setImmediateResult] = useState<number>(0);
  const [isImmediateCalculation, setIsImmediateCalculation] = useState<boolean>(false);

  // 新增：币种列表状态
  const [currencyList, setCurrencyList] = useState<{ code: string; country: string; name: string }[]>([]);

  // 新增：用于传递给计算器的初始值
  const [calculatorInitValue, setCalculatorInitValue] = useState<string>('');

  // 新增：刷新触发器
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 新增：刷新状态
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'success'>('idle');

  // 新增：系统错误状态
  const [systemError, setSystemError] = useState<string>('');
  const [isUsingStaleRate, setIsUsingStaleRate] = useState<boolean>(false);

  // 处理刷新完成回调
  const handleRefreshComplete = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    console.log('🔄 触发应用数据刷新');
  }, []);

  // 使用防抖来优化API调用 - 减少延迟时间提升用户体验
  const debouncedAmount = useDebounce(amount, 200); // 进一步减少到200ms
  const debouncedFromCurrency = useDebounce(fromCurrency, 100); // 减少到100ms
  const debouncedToCurrency = useDebounce(toCurrency, 100); // 减少到100ms
  const debouncedSelectedPeriod = useDebounce(selectedPeriod, 300); // 从500ms减少到300ms

  // 全局加载API币种列表和初始汇率
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

    async function fetchInitialRate() {
      // 立即获取初始汇率，不等待防抖
      try {
        const initialRateObj = await getExchangeRate('USD', 'CNY');
        if (initialRateObj.rate > 0) {
          setRate(initialRateObj.rate);
          setTimestamp(new Date().toLocaleString('zh-CN'));
          console.log('初始汇率获取成功:', initialRateObj.rate);
        }
      } catch (error) {
        console.warn('初始汇率获取失败，使用默认值:', error);
      }
    }

    fetchCurrencies();
    fetchInitialRate();
  }, []);

  // 汇率和兑换结果
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!debouncedFromCurrency || !debouncedToCurrency || debouncedFromCurrency === debouncedToCurrency) {
        console.warn('跳过汇率获取，货币参数无效:', { debouncedFromCurrency, debouncedToCurrency });
        return;
      }
      
      // 不再显示加载状态，直接获取汇率数据
      console.log('开始获取汇率数据:', { debouncedAmount, debouncedFromCurrency, debouncedToCurrency });
      
      try {
        const [r, rtObj] = await Promise.all([
          convertCurrency(debouncedAmount, debouncedFromCurrency, debouncedToCurrency),
          getExchangeRate(debouncedFromCurrency, debouncedToCurrency)
        ]);
        
        if (!cancelled) {
          console.log('汇率数据获取完成:', { result: r, rate: rtObj });
          setResult(Number(r));
          setRate(Number(rtObj.rate));
          setTimestamp(new Date().toLocaleString('zh-CN'));
          setIsImmediateCalculation(false); // 重置立即计算状态，优先显示API结果
          
          // 检查是否使用过期汇率
          if (rtObj.isStale) {
            setIsUsingStaleRate(true);
            setSystemError('系统故障，无法获取最新汇率，正在使用上次缓存汇率，请通知 13424243144 修复');
          } else {
            setIsUsingStaleRate(false);
            setSystemError(''); // 清除错误状态
          }
        }
      } catch (error) {
        console.error('获取汇率数据失败:', error);
        if (!cancelled) {
          // 显示系统故障提示
          setSystemError('系统故障，无法获取最新汇率，请通知 13424243144 修复');
          setIsUsingStaleRate(false);
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [debouncedAmount, debouncedFromCurrency, debouncedToCurrency, refreshTrigger]);

  // 历史数据
  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      // 确保货币代码有效且不相同
      if (!debouncedFromCurrency || !debouncedToCurrency || debouncedFromCurrency === debouncedToCurrency) {
        console.warn('跳过历史数据获取，货币参数无效:', { debouncedFromCurrency, debouncedToCurrency });
        return;
      }
      
      console.log('开始获取历史数据:', { debouncedFromCurrency, debouncedToCurrency, debouncedSelectedPeriod });
      
      try {
        const data = await generateHistoricalData(debouncedFromCurrency, debouncedToCurrency, debouncedSelectedPeriod);
        if (!cancelled) {
          console.log('历史数据获取完成:', data.length, '条记录');
          
          // 如果有实时汇率且历史数据不包含今天的数据，添加当天数据点
          if (rate > 0 && data.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const hasToday = data.some(item => item.date === today);
            
            if (!hasToday) {
              const todayData = {
                date: today,
                rate: rate,
                change: 0,
                changePercent: 0,
              };
              data.push(todayData);
              console.log('添加当天汇率数据:', todayData);
            }
          }
          
          // 对于1天数据，如果数据点太少，添加当前时间点
          if (debouncedSelectedPeriod === '1D' && rate > 0) {
            if (data.length < 2) {
              // 如果数据太少，创建基础数据点
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const today = new Date();
              
              const baseData = [
                {
                  date: yesterday.toISOString().split('T')[0],
                  rate: rate * 0.999, // 模拟昨天稍微不同的汇率
                  change: 0,
                  changePercent: 0,
                },
                {
                  date: today.toISOString().split('T')[0],
                  rate: rate,
                  change: 0,
                  changePercent: 0,
                }
              ];
              
              console.log('为1天数据创建基础数据点:', baseData);
              setHistoricalData(baseData);
              return;
            }
          }
          
          setHistoricalData(data);
        }
      } catch (error) {
        console.error('获取历史数据失败:', error);
        if (!cancelled) {
          setHistoricalData([]);
        }
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [debouncedFromCurrency, debouncedToCurrency, debouncedSelectedPeriod, rate]);

  // 立即响应计算 - 使用当前汇率立即计算结果
  useEffect(() => {
    if (rate > 0 && amount !== '' && fromCurrency !== toCurrency) {
      const immediate = Number(amount) * rate;
      setImmediateResult(immediate);
      setIsImmediateCalculation(true);
      console.log('立即计算结果:', { amount, rate, immediate });
    } else if (amount === '') {
      // 当金额为空时，立即显示0结果
      setImmediateResult(0);
      setIsImmediateCalculation(true);
    }
  }, [amount, rate, fromCurrency, toCurrency]);

  // 预加载汇率 - 当货币选择变化时立即开始预加载
  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      preloadExchangeRate(fromCurrency, toCurrency);
    }
  }, [fromCurrency, toCurrency]);

  // 监听兑换结果变化，自动填入计算器（保留两位小数）
  useEffect(() => {
    if (result && !isNaN(Number(result))) {
      const formatted = Number(result).toFixed(2);
      setCalculatorInitValue(formatted);
    }
  }, [result]);

  const handleSwapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handleConvert = useCallback(() => {
    // 转换按钮点击，不再显示加载状态
    console.log('用户点击兑换按钮');
  }, []);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setAmount(value);
    }
  }, []);

  // 处理刷新汇率
  const handleRefresh = useCallback(async () => {
    setRefreshState('refreshing');
    try {
      const { forceRefreshRates } = await import('./utils/currencyService');
      await forceRefreshRates();
      setRefreshState('success');
      
      // 清除错误状态
      setSystemError('');
      setIsUsingStaleRate(false);
      
      // 触发数据刷新
      handleRefreshComplete();
      
      // 显示成功状态2小时后恢复
      setTimeout(() => {
        setRefreshState('idle');
      }, 2 * 60 * 60 * 1000); // 2小时 = 2 * 60分钟 * 60秒 * 1000毫秒
    } catch (error) {
      console.error('刷新汇率失败:', error);
      setRefreshState('idle');
      
      // 显示系统故障提示
      setSystemError('系统故障，无法获取最新汇率，请通知 13424243144 修复');
      setIsUsingStaleRate(false);
    }
  }, [handleRefreshComplete]);

  // 计算数值时，amount为空则视为0
  const numericAmount = amount === '' ? 0 : Number(amount);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
        {/* 系统错误提示 */}
        {systemError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  系统提醒
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{systemError}</p>
                  {isUsingStaleRate && (
                    <p className="mt-1 text-xs">
                      当前显示的汇率为上次成功获取的真实汇率，非模拟数据
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
                onChange={handleAmountChange}
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
            <button
              onClick={handleRefresh}
              disabled={refreshState === 'refreshing'}
              className={`
                w-28 py-4 rounded-lg font-medium mt-2 flex items-center justify-center text-lg transition-all duration-300
                ${refreshState === 'refreshing'
                  ? 'bg-blue-100 text-blue-600 cursor-not-allowed' 
                  : refreshState === 'success'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 active:bg-gray-300'
                }
              `}
              title="手动刷新汇率数据"
            >
              <RefreshCw className={`w-4 h-4 mr-1 transition-transform duration-300 ${
                refreshState === 'refreshing' ? 'animate-spin' : ''
              }`} />
              <span className={`transition-all duration-300 ${
                refreshState === 'refreshing' ? 'opacity-80' : 
                refreshState === 'success' ? 'text-white font-semibold' : ''
              }`}>
                {refreshState === 'refreshing' ? '刷新中...' : 
                 refreshState === 'success' ? '刷新完成' : 
                 '刷新汇率'}
              </span>
            </button>
          </div>
        </div>

        {/* 转换结果 */}
        <div className="mb-6">
          <ConversionResult
            amount={numericAmount}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            result={result}
            rate={rate}
            timestamp={timestamp}
            immediateResult={immediateResult}
            isImmediateCalculation={isImmediateCalculation}
          />
        </div>

        {/* 数学计算器 */}
        <Calculator initialValue={calculatorInitValue} />

      </main>
      
      {/* 底部联系信息 */}
      <footer className="text-center py-6 text-sm text-gray-500">
        若系统故障，请通知 13424243144 / 13424240034（微信同号）<br />
        <a href="https://huodaiagent.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-block mt-1">货代导航网</a>
      </footer>
    </div>
  );
}

export default App;