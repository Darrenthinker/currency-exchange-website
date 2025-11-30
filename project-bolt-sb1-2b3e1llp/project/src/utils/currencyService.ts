import { ExchangeRate, TimePeriod } from '../types/currency';

const UNIRATE_API_KEY = 'boD3FcxoDzeGMukU48L9S0hakWV0np7feubaSJbH2tEnNerht7vir39R06mr9VRD';
const UNIRATE_BASE = 'https://api.unirateapi.com/api';

// 添加缓存机制
// 使用 localStorage 进行持久化缓存，同时保持内存缓存以提高性能
const STORAGE_KEY = 'currency_rates_cache';
const HISTORY_STORAGE_KEY = 'currency_history_cache';

// 初始化缓存：尝试从 localStorage 读取
const initCache = () => {
  const memoryCache = new Map<string, { rate: number; timestamp: number }>();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        memoryCache.set(key, value);
      });
      console.log('从本地存储加载了', memoryCache.size, '条汇率缓存');
    }
  } catch (e) {
    console.warn('读取本地汇率缓存失败:', e);
  }
  return memoryCache;
};

const initHistoryCache = () => {
  const memoryCache = new Map<string, { data: ExchangeRate[]; timestamp: number }>();
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        memoryCache.set(key, value);
      });
      console.log('从本地存储加载了', memoryCache.size, '条历史数据缓存');
    }
  } catch (e) {
    console.warn('读取本地历史数据缓存失败:', e);
  }
  return memoryCache;
};

const rateCache = initCache();
const historyCache = initHistoryCache();

// 保存缓存到 localStorage
const saveCache = () => {
  try {
    const obj = Object.fromEntries(rateCache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('保存汇率缓存失败:', e);
  }
};

const saveHistoryCache = () => {
  try {
    const obj = Object.fromEntries(historyCache);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('保存历史数据缓存失败:', e);
  }
};

const CACHE_DURATION = 86400000; // 24小时缓存 (24 * 60 * 60 * 1000)
const HISTORY_CACHE_DURATION = 86400000; // 历史数据缓存24小时，减少API调用
const VALID_CACHE_DURATION = 86400000; // 有效缓存时长24小时

// 内置默认汇率（作为最后防线）
const DEFAULT_RATES: Record<string, number> = {
  'USD-CNY': 7.25,
  'CNY-USD': 0.138,
  'EUR-CNY': 7.85,
  'CNY-EUR': 0.127,
  'GBP-CNY': 9.20,
  'CNY-GBP': 0.109,
  'JPY-CNY': 0.048,
  'CNY-JPY': 20.83,
  'HKD-CNY': 0.93,
  'CNY-HKD': 1.07,
};

// 获取下一个固定时间点（0点、4点、8点、12点、16点、20点）
const getNextUpdateTime = (): number => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // 固定时间点：0, 4, 8, 12, 16, 20
  const updateHours = [0, 4, 8, 12, 16, 20];
  
  // 找到下一个更新时间点
  let nextHour = updateHours.find(hour => hour > currentHour);
  
  // 如果当天没有更新时间点了，使用明天的0点
  if (!nextHour) {
    nextHour = 0;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
  
  // 设置为今天的下一个更新时间点
  const nextUpdate = new Date(now);
  nextUpdate.setHours(nextHour, 0, 0, 0);
  return nextUpdate.getTime();
};

// 检查是否需要更新缓存（基于固定时间点）
const shouldUpdateCache = (timestamp: number): boolean => {
  const now = Date.now();
  const nextUpdateTime = getNextUpdateTime();
  
  // 如果缓存时间戳早于当前时间段的开始时间，需要更新
  const currentPeriodStart = nextUpdateTime - CACHE_DURATION;
  return timestamp < currentPeriodStart;
};

// 生成缓存键
const getCacheKey = (fromCurrency: string, toCurrency: string): string => {
  return `${fromCurrency}-${toCurrency}`;
};

const getHistoryCacheKey = (fromCurrency: string, toCurrency: string, period: TimePeriod): string => {
  return `${fromCurrency}-${toCurrency}-${period}`;
};

// 检查缓存是否有效
const isCacheValid = (timestamp: number): boolean => {
  return !shouldUpdateCache(timestamp);
};

const isHistoryCacheValid = (timestamp: number): boolean => {
  return !shouldUpdateCache(timestamp);
};

// 清理过期缓存
const cleanExpiredCache = () => {
    // 清理汇率缓存
    for (const [key, value] of rateCache.entries()) {
      if (shouldUpdateCache(value.timestamp)) {
        rateCache.delete(key);
        console.log('删除过期汇率缓存:', key);
      }
    }
    saveCache(); // 保存清理后的缓存
    
    // 清理历史数据缓存
    for (const [key, value] of historyCache.entries()) {
      if (shouldUpdateCache(value.timestamp)) {
        historyCache.delete(key);
        console.log('删除过期历史数据缓存:', key);
      }
    }
    saveHistoryCache(); // 保存清理后的缓存
};

// 定期清理缓存
setInterval(cleanExpiredCache, 60000); // 每分钟清理一次

// 调试函数：显示下一次更新时间
const logNextUpdateTime = () => {
  const nextUpdate = getNextUpdateTime();
  const nextUpdateDate = new Date(nextUpdate);
  console.log('下一次汇率更新时间:', nextUpdateDate.toLocaleString('zh-CN'));
};

// 启动时显示更新时间
logNextUpdateTime();

// 检查是否到了固定更新时间点
const isUpdateTime = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 固定时间点：0, 4, 8, 12, 16, 20
  const updateHours = [0, 4, 8, 12, 16, 20];
  
  // 只在整点的前5分钟内允许API调用
  return updateHours.includes(currentHour) && currentMinute < 5;
};

// API重试计数器
const apiRetryCount = new Map<string, number>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5秒后重试

// 检查是否应该重试API调用
const shouldRetryAPI = (cacheKey: string): boolean => {
  const retries = apiRetryCount.get(cacheKey) || 0;
  return retries < MAX_RETRIES;
};

// 增加重试计数
const incrementRetryCount = (cacheKey: string): void => {
  const retries = apiRetryCount.get(cacheKey) || 0;
  apiRetryCount.set(cacheKey, retries + 1);
};

// 重置重试计数
const resetRetryCount = (cacheKey: string): void => {
  apiRetryCount.delete(cacheKey);
};

// 优化1年数据，确保每月只有一个数据点
const optimizeYearlyData = (data: ExchangeRate[]): ExchangeRate[] => {
  if (data.length === 0) return data;
  
  // 按月份分组
  const monthlyData = new Map<string, ExchangeRate[]>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }
    monthlyData.get(monthKey)!.push(item);
  });
  
  // 每月取最后一个数据点（月末汇率）
  const result: ExchangeRate[] = [];
  monthlyData.forEach((monthData, monthKey) => {
    // 按日期排序，取最后一个
    const sortedData = monthData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push(sortedData[sortedData.length - 1]);
  });
  
  // 按日期排序
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log('1年数据优化完成:', result.length, '个月份数据点');
  console.log('月份数据范围:', {
    开始: result[0]?.date,
    结束: result[result.length - 1]?.date,
    月份列表: result.map(item => new Date(item.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }))
  });
  
  return result;
};

// 优化长期数据（5年/最大），确保每年只有一个数据点
const optimizeLongTermData = (data: ExchangeRate[]): ExchangeRate[] => {
  if (data.length === 0) return data;
  
  // 按年份分组
  const yearlyData = new Map<string, ExchangeRate[]>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const yearKey = date.getFullYear().toString();
    
    if (!yearlyData.has(yearKey)) {
      yearlyData.set(yearKey, []);
    }
    yearlyData.get(yearKey)!.push(item);
  });
  
  // 每年取最后一个数据点（年末汇率）
  const result: ExchangeRate[] = [];
  yearlyData.forEach((yearData, yearKey) => {
    // 按日期排序，取最后一个
    const sortedData = yearData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push(sortedData[sortedData.length - 1]);
  });
  
  // 按日期排序
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log('长期数据优化完成:', result.length, '个年份数据点');
  console.log('年份数据范围:', {
    开始: result[0]?.date,
    结束: result[result.length - 1]?.date,
    年份列表: result.map(item => new Date(item.date).getFullYear())
  });
  
  return result;
};

// 生成模拟历史数据（当API限制时使用）
const generateMockHistoricalData = (
  fromCurrency: string,
  toCurrency: string,
  period: TimePeriod
): ExchangeRate[] => {
  console.log('生成模拟历史数据:', { fromCurrency, toCurrency, period });
  
  // 基础汇率（可以根据实际情况调整）
  const baseRates: { [key: string]: number } = {
    'USD-CNY': 7.16,
    'EUR-CNY': 7.85,
    'GBP-CNY': 9.12,
    'JPY-CNY': 0.048,
    'CNY-USD': 0.14,
    'USD-EUR': 0.91,
    'EUR-USD': 1.10,
    'RUB-CNY': 0.08, // 1 RUB ≈ 0.08 CNY
    'CNY-RUB': 12.5, // 1 CNY ≈ 12.5 RUB
  };
  
  const rateKey = `${fromCurrency}-${toCurrency}`;
  const reverseKey = `${toCurrency}-${fromCurrency}`;
  let baseRate = baseRates[rateKey] || (baseRates[reverseKey] ? 1 / baseRates[reverseKey] : 1.0);
  
  const now = new Date();
  let days = 30;
  
  switch (period) {
    case '1D': days = 2; break;
    case '5D': days = 5; break;
    case '1M': days = 30; break;
    case '1Y': days = 365; break;
    case '5Y': days = 1825; break;
    default: days = 30;
  }
  
  const result: ExchangeRate[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // 生成随机波动（±5%）
    const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const rate = baseRate * (1 + variation);
    
    result.push({
      date: date.toISOString().split('T')[0],
      rate: Number(rate.toFixed(2)),
      change: 0,
      changePercent: 0,
    });
  }
  
  // 应用相同的优化逻辑
  if (period === '1Y' && result.length > 0) {
    return optimizeYearlyData(result);
  }
  
  if (period === '5Y' && result.length > 0) {
    return optimizeLongTermData(result);
  }
  
  console.log('模拟数据生成完成:', result.length, '条记录');
  return result;
};

// 获取模拟实时汇率（当API限制时使用）
export const getMockExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return 1;
  
  // 基础汇率表
  const baseRates: { [key: string]: number } = {
    'USD-CNY': 7.1661,
    'EUR-CNY': 7.85,
    'GBP-CNY': 9.12,
    'JPY-CNY': 0.048,
    'HKD-CNY': 0.92,
    'AUD-CNY': 4.68,
    'CAD-CNY': 5.12,
    'SGD-CNY': 5.28,
    'KRW-CNY': 0.0054,
    'RUB-CNY': 0.08,
    'BRL-CNY': 1.35,
    'ZAR-CNY': 0.39,
    'MYR-CNY': 1.54, // 1马来西亚林吉特 ≈ 1.54人民币
    'CNY-MYR': 0.649, // 1人民币 ≈ 0.649马来西亚林吉特
    'MYR-USD': 0.21, // 1马来西亚林吉特 ≈ 0.21美元
    'USD-MYR': 4.76, // 1美元 ≈ 4.76马来西亚林吉特
    'CNY-USD': 0.1397,
    'CNY-EUR': 0.1274,
    'CNY-GBP': 0.1096,
    'CNY-JPY': 20.83,
    'CNY-HKD': 1.09,
    'CNY-AUD': 0.2137,
    'CNY-CAD': 0.1953,
    'CNY-SGD': 0.1894,
    'CNY-KRW': 185.19,
    'CNY-RUB': 12.5,
    'CNY-BRL': 0.74,
    'CNY-ZAR': 2.56,
    'USD-EUR': 0.91,
    'EUR-USD': 1.10,
    'USD-GBP': 0.785,
    'GBP-USD': 1.274,
    'USD-JPY': 149.2,
    'JPY-USD': 0.0067,
    'USD-RUB': 90.0,
    'RUB-USD': 0.011,
    'USD-BRL': 5.2,
    'BRL-USD': 0.192,
    'USD-ZAR': 18.0,
    'ZAR-USD': 0.055,
    'USD-AUD': 1.52,
    'AUD-USD': 0.658,
    'USD-CAD': 1.36,
    'CAD-USD': 0.735,
    'USD-HKD': 7.85,
    'HKD-USD': 0.1274,
    'USD-SGD': 1.35,
    'SGD-USD': 0.74,
    'USD-KRW': 1350.0,
    'KRW-USD': 0.00074,
    // 以下为补全的常用币种对CNY汇率（如有重复，保留最新一条）
    'MXN-CNY': 0.41, // 墨西哥比索
    'CNY-MXN': 2.44,
    'THB-CNY': 0.20, // 泰铢
    'CNY-THB': 5.00,
    'IDR-CNY': 0.00045, // 印尼盾
    'CNY-IDR': 2222.22,
    'VND-CNY': 0.00029, // 越南盾
    'CNY-VND': 3448.28,
    'PHP-CNY': 0.13, // 菲律宾比索
    'CNY-PHP': 7.69,
    'TWD-CNY': 0.23, // 新台币
    'CNY-TWD': 4.35,
    'MOP-CNY': 0.90, // 澳门元
    'CNY-MOP': 1.11,
    'NZD-CNY': 4.30, // 新西兰元
    'CNY-NZD': 0.2326,
    'INR-CNY': 0.087, // 印度卢比
    'CNY-INR': 11.49,
    // ...可继续补充更多币种...
  };
  
  const rateKey = `${fromCurrency}-${toCurrency}`;
  const reverseKey = `${toCurrency}-${fromCurrency}`;
  
  // 直接查找汇率
  if (baseRates[rateKey]) {
    return baseRates[rateKey];
  }
  
  // 查找反向汇率
  if (baseRates[reverseKey]) {
    return 1 / baseRates[reverseKey];
  }
  
  // 通过USD作为中介货币计算
  const fromToUSD = baseRates[`${fromCurrency}-USD`] || (baseRates[`USD-${fromCurrency}`] ? 1 / baseRates[`USD-${fromCurrency}`] : null);
  const usdToTo = baseRates[`USD-${toCurrency}`] || (baseRates[`${toCurrency}-USD`] ? 1 / baseRates[`${toCurrency}-USD`] : null);
  
  if (fromToUSD && usdToTo) {
    return fromToUSD * usdToTo;
  }
  
  console.warn('无法找到货币对的模拟汇率:', rateKey, '使用默认值1.0');
  return 1.0;
};

// 预加载汇率（已禁用，避免API限流）
// 由于免费API套餐每日只有200次请求限制，禁用预加载功能
export const preloadExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<void> => {
  // 完全禁用预加载，避免消耗API配额
  // 只在用户实际需要时才调用API
  console.log('预加载已禁用，避免API限流');
  return;
};

// 获取实时汇率（异步，调用 UniRateAPI）
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; isMock: boolean; isStale?: boolean }> => {
  if (fromCurrency === toCurrency) return { rate: 1, isMock: false };
  
  // 检查缓存
  const cacheKey = getCacheKey(fromCurrency, toCurrency);
  const cached = rateCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('使用缓存汇率:', cached.rate, '缓存键:', cacheKey);
    return { rate: cached.rate, isMock: false };
  }

  // 如果有过期缓存（超过24小时），不直接使用，需要重新获取
  // 如果缓存超过24小时，应该调用API获取新数据
  if (cached && cached.rate > 0) {
    const cacheAge = Date.now() - cached.timestamp;
    
    if (cacheAge < VALID_CACHE_DURATION) {
      // 24小时内的缓存已在上面处理，这里不应该到达
      console.log('使用24小时内缓存汇率:', cached.rate, '缓存键:', cacheKey);
      return { rate: cached.rate, isMock: false };
    } else {
      console.log('缓存已过期（超过24小时），需要重新获取:', (cacheAge / (60 * 60 * 1000)).toFixed(1), '小时');
    }
  }

  // 如果没有任何缓存或缓存已过期，直接调用API获取真实汇率
  console.log('无有效缓存数据，调用API获取真实汇率');
  
  const url = `${UNIRATE_BASE}/rates?api_key=${UNIRATE_API_KEY}&from=${fromCurrency}&to=${toCurrency}`;
  console.log('调用实时汇率API:', { fromCurrency, toCurrency, url: url.replace(UNIRATE_API_KEY, '***') });
  
  try {
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    console.log('实时汇率API响应状态:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('实时汇率API错误:', {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
        url: url.replace(UNIRATE_API_KEY, '***')
      });
      
      // 如果是429限流错误，提供更详细的错误信息
      if (res.status === 429) {
        const rateLimitInfo = errorData.limit 
          ? `每日限制: ${errorData.limit}次，当前已用: ${errorData.current_count || '未知'}次`
          : 'API请求频率超限';
        console.error('API限流:', rateLimitInfo);
        
        // 检查是否有24小时内的缓存可以使用
        const cacheKey = getCacheKey(fromCurrency, toCurrency);
        const cached = rateCache.get(cacheKey);
        
        if (cached && cached.rate > 0) {
          const cacheAge = Date.now() - cached.timestamp;
          
          if (cacheAge < VALID_CACHE_DURATION) {
            console.warn('API限流，使用24小时内的缓存汇率:', cached.rate);
            return { rate: cached.rate, isMock: false, isStale: true };
          } else {
            // 使用过期缓存作为降级方案
            console.warn('API限流，使用过期的缓存汇率:', cached.rate, '缓存时间:', new Date(cached.timestamp).toLocaleString());
            return { rate: cached.rate, isMock: false, isStale: true };
          }
        }
        
        // 如果没有有效缓存，抛出包含限流信息的错误
        throw new Error(`API限流: ${rateLimitInfo}。请稍后再试或升级API套餐。`);
      }
      
      // 其他API错误时，检查是否有24小时内的缓存可以使用
      const cacheKey = getCacheKey(fromCurrency, toCurrency);
      const cached = rateCache.get(cacheKey);
      
      if (cached && cached.rate > 0) {
        const cacheAge = Date.now() - cached.timestamp;
        
        if (cacheAge < VALID_CACHE_DURATION) {
          console.warn('API错误，使用24小时内的缓存汇率:', cached.rate);
          return { rate: cached.rate, isMock: false, isStale: true };
        } else {
          // 使用过期缓存作为降级方案
          console.warn('API错误，使用过期的缓存汇率:', cached.rate, '缓存时间:', new Date(cached.timestamp).toLocaleString());
          return { rate: cached.rate, isMock: false, isStale: true };
        }
      }
      
      // 如果没有有效缓存，抛出错误，不返回模拟数据
      throw new Error(`API调用失败: ${res.status} ${errorData.message || errorText}`);
    }
    
    const data = await res.json();
    console.log('实时汇率API返回数据:', data);
    console.log('数据结构详情:', {
      hasRates: !!data.rates,
      ratesKeys: data.rates ? Object.keys(data.rates) : [],
      targetCurrency: toCurrency,
      targetRate: data.rates?.[toCurrency],
      allRates: data.rates,
      // 检查新的数据格式
      hasRate: !!data.rate,
      directRate: data.rate,
      hasResult: !!data.result,
      directResult: data.result
    });
    
    // 尝试多种数据格式
    let rate = 0;
    
    if (data.rate && data.to === toCurrency) {
      // 新格式（当前API格式）：{ rate: 7.16, to: "CNY", amount: 1, base: "USD", result: 7.16 }
      rate = data.rate;
      console.log('使用rate格式，汇率:', rate);
    } else if (data.result && data.to === toCurrency) {
      // 备用格式：{ result: 7.16, to: "CNY" }
      rate = data.result;
      console.log('使用result格式，汇率:', rate);
    } else if (data.rates && data.rates[toCurrency]) {
      // 旧格式：{ rates: { CNY: 7.16 } }
      rate = data.rates[toCurrency];
      console.log('使用rates格式，汇率:', rate);
    } else {
      console.error('未能解析汇率数据，数据格式:', data);
    }
    
    console.log('最终解析出的汇率:', rate);
    
    // 存储到缓存
    if (rate > 0) {
      rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      saveCache(); // 持久化保存
      resetRetryCount(cacheKey); // 成功时重置重试计数
      console.log('汇率已缓存:', cacheKey, rate);
      return { rate, isMock: false };
    }
    
    // 如果无法解析汇率，检查是否有24小时内的缓存
    console.error('无法解析API返回的汇率');
    const cached = rateCache.get(cacheKey);
    
    if (cached && cached.rate > 0) {
      const cacheAge = Date.now() - cached.timestamp;
      
      if (cacheAge < VALID_CACHE_DURATION) {
        console.warn('使用24小时内的缓存汇率:', cached.rate);
        return { rate: cached.rate, isMock: false, isStale: true };
      }
    }
    
    // 如果没有有效缓存，抛出错误
    throw new Error('无法解析汇率数据且无有效缓存');
  } catch (error) {
    // 详细记录错误信息
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      isAbortError: error instanceof Error && error.name === 'AbortError',
      isNetworkError: error instanceof Error && (error.message.includes('fetch') || error.message.includes('network')),
    };
    
    console.error('实时汇率API调用异常:', errorDetails);
    
    // API调用失败时，检查是否有24小时内的缓存可以使用
    const cacheKey = getCacheKey(fromCurrency, toCurrency);
    const cached = rateCache.get(cacheKey);
    
    if (cached && cached.rate > 0) {
      const cacheAge = Date.now() - cached.timestamp;
      
      if (cacheAge < VALID_CACHE_DURATION) {
        console.warn('API调用失败，使用24小时内的缓存汇率:', cached.rate, '缓存年龄:', (cacheAge / (60 * 60 * 1000)).toFixed(1), '小时');
        return { rate: cached.rate, isMock: false, isStale: true };
      } else {
        console.error('缓存已过期（超过24小时），无法使用，缓存年龄:', (cacheAge / (60 * 60 * 1000)).toFixed(1), '小时');
      }
    } else {
      console.error('无任何缓存数据');
    }
    
    // 如果没有24小时内的有效缓存，尝试使用默认汇率
    const defaultRate = DEFAULT_RATES[cacheKey];
    if (defaultRate) {
      console.warn('使用内置默认汇率:', defaultRate);
      return { rate: defaultRate, isMock: true, isStale: true };
    }

    // 最后的降级：反向查找默认汇率
    const reverseKey = `${toCurrency}-${fromCurrency}`;
    if (DEFAULT_RATES[reverseKey]) {
      const rate = 1 / DEFAULT_RATES[reverseKey];
      console.warn('使用反向内置默认汇率:', rate);
      return { rate, isMock: true, isStale: true };
    }

    console.error('API调用失败且无24小时内的有效缓存，无法获取汇率');
    throw new Error(`无法获取汇率数据: ${errorDetails.message}`);
  }
};

// 兑换金额（异步，调用 getExchangeRate）
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  const { rate } = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

// 获取历史数据（异步，调用 UniRateAPI）
export const generateHistoricalData = async (
  fromCurrency: string,
  toCurrency: string,
  period: TimePeriod
): Promise<ExchangeRate[]> => {
  // 参数验证
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    console.warn('无效的货币参数:', { fromCurrency, toCurrency });
    return [];
  }
  
  // 检查历史数据缓存
  const historyCacheKey = getHistoryCacheKey(fromCurrency, toCurrency, period);
  const cachedHistory = historyCache.get(historyCacheKey);
  
  if (cachedHistory && isHistoryCacheValid(cachedHistory.timestamp)) {
    console.log('使用缓存历史数据:', cachedHistory.data.length, '条记录，缓存键:', historyCacheKey);
    return cachedHistory.data;
  }

  // 如果有过期的历史数据缓存，直接使用避免等待
  if (cachedHistory && cachedHistory.data.length > 0) {
    console.log('使用过期历史数据缓存避免等待:', cachedHistory.data.length, '条记录，缓存键:', historyCacheKey);
    return cachedHistory.data;
  }

  // 如果没有任何缓存，直接调用API获取真实历史数据
  console.log('无历史数据缓存，调用API获取真实历史数据');
  // 不使用模拟历史数据，直接进行API调用
  
  // 按 period 计算起止日期
  const now = new Date();
  let days = 30;
  switch (period) {
    case '1D': days = 1; break;
    case '5D': days = 5; break;
    case '1M': days = 30; break;
    case '1Y': days = 365; break;
    case '5Y': days = 1825; break;
    default: days = 30;
  }
  
  // 确保使用UTC时间来避免时区问题
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(endDate);
  
  // 对于1天的情况，获取前一天到今天的数据
  if (period === '1D') {
    startDate.setDate(endDate.getDate() - 2); // 获取前2天的数据，确保有足够数据点
  } else if (period === '1Y') {
    // 对于1年数据，获取完整的12个月数据
    // 从去年的当前月份开始，到今年的当前月份结束
    startDate.setFullYear(now.getFullYear() - 1);
    startDate.setMonth(now.getMonth());
    startDate.setDate(1); // 月初开始
    
    // 结束日期设为本月最后一天
    endDate.setMonth(now.getMonth() + 1);
    endDate.setDate(0); // 上个月的最后一天，即本月最后一天
  } else {
    startDate.setDate(endDate.getDate() - days);
  }
  
  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);
  
  // 只在固定时间点才调用历史数据API
  if (!isUpdateTime()) {
    console.log('非更新时间点，使用模拟历史数据');
    const mockHistoricalData = generateMockHistoricalData(fromCurrency, toCurrency, period);
    if (mockHistoricalData.length > 0) {
      historyCache.set(historyCacheKey, { data: mockHistoricalData, timestamp: Date.now() });
      return mockHistoricalData;
    }
  }

  const url = `${UNIRATE_BASE}/historical/timeseries?api_key=${UNIRATE_API_KEY}&from=${fromCurrency}&to=${toCurrency}&start_date=${startStr}&end_date=${endStr}`;
  
  console.log('固定时间点获取历史数据API调用详情:', {
    url,
    startStr,
    endStr,
    period,
    days,
    fromCurrency,
    toCurrency,
    currentDate: now.toISOString(),
    localDate: now.toLocaleDateString(),
    dateRange: `${startStr} 到 ${endStr}`,
    totalDays: Math.ceil((new Date(endStr).getTime() - new Date(startStr).getTime()) / (1000 * 60 * 60 * 24))
  });
  
  try {
    const res = await fetch(url);
    console.log('API响应状态:', res.status, res.statusText);
    console.log('API响应头:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API错误响应:', errorText);
      console.error('完整响应:', res);
      
      // 如果是429错误（请求过多），等待后重试而不使用模拟数据
      if (res.status === 429) {
        console.warn('历史数据API请求限制，请稍后重试');
        return [];
      }
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText);
        console.error('解析后的错误信息:', errorData);
        
        // 检查是否是特定的错误类型
        if (errorData.error && errorData.error.includes('Unable to retrieve time series data')) {
          console.error('时间序列数据获取失败，可能是日期范围或货币对问题');
        }
      } catch (e) {
        console.error('无法解析错误响应为JSON');
      }
      
      return [];
    }
    
    const data = await res.json();
    console.log('API返回数据结构:', {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      totalDays: data.total_days,
      startDate: data.start_date,
      endDate: data.end_date
    });
    
    if (!data.data || Object.keys(data.data).length === 0) {
      console.warn('API返回了空数据');
      return [];
    }
    
    // 组装成 ExchangeRate[]
    let result = Object.entries(data.data || {}).map(([date, rates]: any) => ({
      date,
      rate: rates[toCurrency] || 0,
      change: 0,
      changePercent: 0,
    }));
    
    // 对于1年数据，优化为每月一个数据点，确保显示12个月
    if (period === '1Y' && result.length > 0) {
      result = optimizeYearlyData(result);
    }
    
    // 对于5年数据，优化为每年一个数据点，确保显示清晰
    if (period === '5Y' && result.length > 0) {
      result = optimizeLongTermData(result);
    }
    
    console.log('处理后的结果:', result.slice(0, 3)); // 只显示前3条
    
    // 存储到缓存
    if (result.length > 0) {
      historyCache.set(historyCacheKey, { data: result, timestamp: Date.now() });
      console.log('历史数据已缓存:', historyCacheKey, result.length, '条记录');
    }
    
    return result;
    
  } catch (error) {
    console.error('API调用异常:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    
    // API失败时，检查是否有24小时内的历史数据缓存
    const cachedHistory = historyCache.get(historyCacheKey);
    
    if (cachedHistory && cachedHistory.data.length > 0) {
      const cacheAge = Date.now() - cachedHistory.timestamp;
      
      if (cacheAge < VALID_CACHE_DURATION) {
        console.warn('历史数据API调用失败，使用24小时内的缓存数据');
        return cachedHistory.data;
      } else {
        console.error('历史数据缓存已过期（超过24小时），无法使用');
      }
    }
    
    // 如果没有24小时内的有效缓存，返回空数组（显示系统故障）
    console.error('历史数据API调用失败且无24小时内的有效缓存');
    return [];
  }
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatRate = (rate: number): string => {
  return rate.toFixed(2);
};

// 获取UniRateAPI支持的币种列表
export const getSupportedCurrenciesFromAPI = async (): Promise<string[]> => {
  const url = `${UNIRATE_BASE}/currencies?api_key=${UNIRATE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.currencies || [];
};

// 强制刷新汇率数据（无视时间限制和缓存）
export const forceRefreshRates = async (): Promise<void> => {
  console.log('🔄 开始强制刷新汇率数据...');
  
  // 清空所有缓存
  rateCache.clear();
  historyCache.clear();
  apiRetryCount.clear();
  
  console.log('✅ 所有缓存已清空');
  
  // 强制获取主要货币对的汇率
  const mainCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
  const promises: Promise<any>[] = [];
  
  for (const fromCurrency of mainCurrencies) {
    for (const toCurrency of mainCurrencies) {
      if (fromCurrency !== toCurrency) {
        promises.push(
          forceGetExchangeRate(fromCurrency, toCurrency)
            .then(result => {
              console.log(`✅ ${fromCurrency} → ${toCurrency}: ${result.rate} (${result.isMock ? '模拟' : '实时'})`);
              return result;
            })
            .catch(error => {
              console.error(`❌ ${fromCurrency} → ${toCurrency} 失败:`, error.message);
              return null;
            })
        );
      }
    }
  }
  
  try {
    await Promise.allSettled(promises);
    console.log('🎉 强制刷新完成');
  } catch (error) {
    console.error('强制刷新过程中出现错误:', error);
  }
};

// 强制获取汇率（无视时间限制）
const forceGetExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; isMock: boolean; isStale?: boolean }> => {
  if (fromCurrency === toCurrency) {
    return { rate: 1, isMock: false };
  }

  // 直接调用API，不检查时间限制
  const url = `${UNIRATE_BASE}/rates?api_key=${UNIRATE_API_KEY}&from=${fromCurrency}&to=${toCurrency}`;
  
  console.log('🔄 强制API调用:', url.replace(UNIRATE_API_KEY, 'YOUR_API_KEY'));
  
  try {
    const response = await fetch(url);
    console.log('API响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      throw new Error(`API调用失败: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    let rate = 0;
    if (data.rate && data.to === toCurrency) {
      // 新格式（当前API格式）：{ rate: 7.16, to: "CNY", amount: 1, base: "USD", result: 7.16 }
      rate = parseFloat(data.rate);
    } else if (data.result && data.to === toCurrency) {
      // 备用格式：{ result: 7.16, to: "CNY" }
      rate = parseFloat(data.result);
    } else if (data.rates && data.rates[toCurrency]) {
      // 旧格式：{ rates: { CNY: 7.16 } }
      rate = parseFloat(data.rates[toCurrency]);
    } else {
      throw new Error(`未找到 ${toCurrency} 的汇率数据`);
    }
    
    if (rate > 0) {
      // 存入缓存
      const cacheKey = getCacheKey(fromCurrency, toCurrency);
      rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      
      return { rate, isMock: false };
    } else {
      throw new Error(`汇率数据无效: ${rate}`);
    }
  } catch (error) {
    console.error('强制API调用失败:', error);
    
    // 检查是否有过期缓存可以使用
    const cacheKey = getCacheKey(fromCurrency, toCurrency);
    const cached = rateCache.get(cacheKey);
    
    if (cached && cached.rate > 0) {
      console.warn('强制刷新失败，使用上次缓存的真实汇率:', cached.rate);
      return { rate: cached.rate, isMock: false, isStale: true };
    }
    
    // 完全无法获取汇率时抛出错误
    throw new Error(`强制获取汇率失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};