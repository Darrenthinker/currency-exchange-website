import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CurrencySelector } from './components/CurrencySelector';
import { ConversionResult } from './components/ConversionResult';
import {
  getExchangeRate,
  applyDisplayExchangeMarkup,
  applyDisplayConversionMarkup,
} from './utils/currencyService';
import { devLog, devWarn } from './utils/devLog';
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

// 发达国家/常用货币基础优先列表
const MAJOR_FIAT_ORDER = [
  'USD', 'CNY', 'EUR', 'JPY', 'GBP', 'HKD', 'AUD', 'CAD', 'SGD',
  'KRW', 'INR', 'RUB', 'BRL', 'ZAR', 'MYR', 'THB', 'IDR', 'VND',
  'PHP', 'TWD', 'NZD', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN',
];

// 按使用频率排序，使用次数高的排最前，使用次数相同的按发达国家优先顺序排
function sortCurrencyListByUsage(
  list: { code: string; country: string; name: string }[]
): { code: string; country: string; name: string }[] {
  let usageStats: Record<string, number> = {};
  try {
    const storedStats = localStorage.getItem('currency_usage_stats');
    if (storedStats) {
      usageStats = JSON.parse(storedStats);
    }
  } catch (e) {
    // ignore
  }

  return [...list].sort((a, b) => {
    const aUsage = usageStats[a.code] || 0;
    const bUsage = usageStats[b.code] || 0;
    // 使用次数不同：按次数降序
    if (aUsage !== bUsage) return bUsage - aUsage;
    // 使用次数相同：按发达国家优先列表排序
    const aIdx = MAJOR_FIAT_ORDER.indexOf(a.code);
    const bIdx = MAJOR_FIAT_ORDER.indexOf(b.code);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.code.localeCompare(b.code);
  });
}

function App() {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('CNY');
  const [result, setResult] = useState<number>(0);
  const [rate, setRate] = useState<number>(() => applyDisplayExchangeMarkup(7.1661));
  const [timestamp, setTimestamp] = useState<string>(new Date().toLocaleString('zh-CN'));

  // 新增：立即响应状态
  const [immediateResult, setImmediateResult] = useState<number>(0);
  const [isImmediateCalculation, setIsImmediateCalculation] = useState<boolean>(false);

  // 币种列表状态 - 使用本地数据作为初始值，按使用频率排序
  const [currencyList, setCurrencyList] = useState<{ code: string; country: string; name: string }[]>(() => {
    return sortCurrencyListByUsage(
      Object.entries(currencyMetaMap).map(([code, meta]) => ({
        code,
        country: meta.country,
        name: meta.name
      }))
    );
  });

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
    devLog('触发应用数据刷新');
  }, []);

  // 使用防抖来优化API调用 - 减少延迟时间提升用户体验
  const debouncedAmount = useDebounce(amount, 200); // 进一步减少到200ms
  const debouncedFromCurrency = useDebounce(fromCurrency, 100); // 减少到100ms
  const debouncedToCurrency = useDebounce(toCurrency, 100);

  // 全局加载币种列表（使用本地列表，不调用API以节省配额）
  useEffect(() => {
    const allFiatList = Object.entries(currencyMetaMap)
      .map(([code, meta]) => ({
        code,
        country: meta.country,
        name: meta.name
      }))
      .filter(item => item.country && item.name);

    setCurrencyList(sortCurrencyListByUsage(allFiatList));

    async function fetchInitialRate() {
      // 立即获取初始汇率，不等待防抖
      try {
        const initialRateObj = await getExchangeRate('USD', 'CNY');
        if (initialRateObj.rate > 0) {
          setRate(applyDisplayExchangeMarkup(initialRateObj.rate));
          setTimestamp(new Date().toLocaleString('zh-CN'));
          devLog('初始汇率获取成功(展示已含上浮):', initialRateObj.rate);
        }
      } catch (error) {
        devWarn('初始汇率获取失败，使用默认值:', error);
      }
    }

    // fetchCurrencies(); // 已移除此函数调用，因为直接使用了本地列表
    fetchInitialRate();
  }, []);

  // 汇率和兑换结果
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!debouncedFromCurrency || !debouncedToCurrency) {
        devWarn('跳过汇率获取，货币参数无效:', { debouncedFromCurrency, debouncedToCurrency });
        return;
      }
      // 相同币种：无需请求接口，汇率为 1，结果等于金额（与 getExchangeRate 语义一致）
      if (debouncedFromCurrency === debouncedToCurrency) {
        const amt =
          debouncedAmount === '' || debouncedAmount === undefined
            ? 0
            : Number(debouncedAmount);
        if (!cancelled) {
          setResult(Number.isFinite(amt) ? amt : 0);
          setRate(applyDisplayExchangeMarkup(1));
          setTimestamp(new Date().toLocaleString('zh-CN'));
          setIsImmediateCalculation(false);
          setIsUsingStaleRate(false);
          setSystemError('');
        }
        return;
      }
      
      devLog('开始获取汇率数据:', { debouncedAmount, debouncedFromCurrency, debouncedToCurrency });
      
      try {
        const rtObj = await getExchangeRate(debouncedFromCurrency, debouncedToCurrency);
        const rawRate = Number(rtObj.rate);
        const amt = Number(debouncedAmount);
        const displayRate = applyDisplayExchangeMarkup(rawRate);
        const displayResult = applyDisplayConversionMarkup(amt * rawRate);
        
        if (!cancelled) {
          devLog('汇率数据获取完成:', { displayResult, rate: rtObj, rawRate });
          setResult(displayResult);
          setRate(displayRate);
          setTimestamp(new Date().toLocaleString('zh-CN'));
          setIsImmediateCalculation(false); // 重置立即计算状态，优先显示API结果
          
          // 检查是否使用过期汇率（24小时内的缓存）
          if (rtObj.isStale) {
            setIsUsingStaleRate(true);
            setSystemError('系统故障，无法获取最新汇率，正在使用24小时内的缓存汇率，请通知 13424243144 修复');
          } else {
            setIsUsingStaleRate(false);
            setSystemError(''); // 清除错误状态
          }
        }
      } catch (error) {
        console.error('获取汇率数据失败:', error);
        if (!cancelled) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          let systemErrorMsg = '系统故障，无法获取最新汇率，请通知 13424243144 修复';
          
          if (errorMessage.includes('限流') || errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
            systemErrorMsg =
              'API请求频率超限（主接口 ExchangeRate-API 免费版每日约1500次，或备用接口限流），请稍后再试；若页面仍显示金额，多为缓存汇率。';
          }
          
          setSystemError(systemErrorMsg);
          setIsUsingStaleRate(false);
          // 保留上次有效结果，不清零，避免用户看到结果突然变0
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [debouncedAmount, debouncedFromCurrency, debouncedToCurrency, refreshTrigger]);

  // 立即响应计算 - 使用当前汇率立即计算结果
  useEffect(() => {
    if (fromCurrency === toCurrency) {
      const n = amount === '' ? 0 : Number(amount);
      setImmediateResult(Number.isFinite(n) ? n : 0);
      setIsImmediateCalculation(true);
      return;
    }
    if (rate > 0 && amount !== '') {
      const immediate = Number(amount) * rate;
      setImmediateResult(immediate);
      setIsImmediateCalculation(true);
      devLog('立即计算结果:', { amount, rate, immediate });
    } else if (amount === '') {
      setImmediateResult(0);
      setIsImmediateCalculation(true);
    }
  }, [amount, rate, fromCurrency, toCurrency]);

  // 与 ConversionResult 同一套展示金额同步计算器；金额未输入时不写入 0.00，避免下面计算器只显示 0
  useEffect(() => {
    if (amount === '') {
      setCalculatorInitValue('');
      return;
    }
    const display =
      isImmediateCalculation && immediateResult !== undefined && !Number.isNaN(immediateResult)
        ? immediateResult
        : result;
    if (typeof display === 'number' && !Number.isNaN(display)) {
      setCalculatorInitValue(Number(display).toFixed(2));
    }
  }, [amount, result, immediateResult, isImmediateCalculation]);

  // 更新货币使用频率并重新排序币种列表
  const updateCurrencyUsage = useCallback((code: string) => {
    try {
      const storedStats = localStorage.getItem('currency_usage_stats');
      const stats = storedStats ? JSON.parse(storedStats) : {};
      stats[code] = (stats[code] || 0) + 1;
      localStorage.setItem('currency_usage_stats', JSON.stringify(stats));
    } catch (e) {
      // ignore
    }
    setCurrencyList(prev => sortCurrencyListByUsage(prev));
  }, []);

  const handleSwapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    updateCurrencyUsage(toCurrency);
    updateCurrencyUsage(fromCurrency);
  }, [fromCurrency, toCurrency, updateCurrencyUsage]);

  const handleConvert = useCallback(() => {
    updateCurrencyUsage(fromCurrency);
    updateCurrencyUsage(toCurrency);
  }, [fromCurrency, toCurrency, updateCurrencyUsage]);

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
                type="button"
                onClick={handleSwapCurrencies}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-md"
                title="交换货币"
                aria-label="交换原始货币与目标货币"
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
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
            <div className="flex-1 min-w-[12rem]">
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
              type="button"
              onClick={handleConvert}
              className="w-full sm:w-28 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium sm:mt-2 flex items-center justify-center text-lg shrink-0"
            >
              兑换
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshState === 'refreshing'}
              className={`
                w-full sm:w-28 py-4 rounded-lg font-medium sm:mt-2 flex items-center justify-center text-lg transition-all duration-300 shrink-0
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
            amountInputEmpty={amount === ''}
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