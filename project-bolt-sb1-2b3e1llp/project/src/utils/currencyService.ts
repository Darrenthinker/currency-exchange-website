import { ExchangeRate, TimePeriod } from '../types/currency';
import { devLog, devWarn } from './devLog';

// 主 API：ExchangeRate-API（免费1500次/天，无需密钥，一次返回所有币种汇率）
const PRIMARY_API_BASE = 'https://open.er-api.com/v6/latest';

// UniRate 备用：浏览器直连（与原先一致）。密钥放在 .env 的 VITE_UNIRATE_API_KEY（会进前端包，勿提交仓库）
const UNIRATE_API_BASE = 'https://api.unirateapi.com/api';

function getUnirateApiKey(): string {
  const k = import.meta.env.VITE_UNIRATE_API_KEY;
  return typeof k === 'string' ? k.trim() : '';
}

/** path 如 rates、currencies 或 historical/timeseries（勿前导斜杠） */
function buildUnirateDirectUrl(path: string, search: Record<string, string>): string | null {
  const key = getUnirateApiKey();
  if (!key) return null;
  const p = path.replace(/^\//, '');
  const q = new URLSearchParams({ ...search, api_key: key });
  return `${UNIRATE_API_BASE}/${p}?${q.toString()}`;
}

/** 页面展示用：在接口返回汇率基础上上浮 0.05%（缓存仍存原始汇率，仅影响展示与换算结果） */
export const DISPLAY_EXCHANGE_MARKUP_RATIO = 0.0005;

export function applyDisplayExchangeMarkup(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return rate;
  if (rate === 1) return 1;
  return rate * (1 + DISPLAY_EXCHANGE_MARKUP_RATIO);
}

export function applyDisplayConversionMarkup(convertedAmount: number): number {
  if (!Number.isFinite(convertedAmount) || convertedAmount <= 0) return convertedAmount;
  return convertedAmount * (1 + DISPLAY_EXCHANGE_MARKUP_RATIO);
}

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
      devLog('从本地存储加载了', memoryCache.size, '条汇率缓存');
    }
  } catch (e) {
    devWarn('读取本地汇率缓存失败:', e);
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
      devLog('从本地存储加载了', memoryCache.size, '条历史数据缓存');
    }
  } catch (e) {
    devWarn('读取本地历史数据缓存失败:', e);
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
    devWarn('保存汇率缓存失败:', e);
  }
};

const saveHistoryCache = () => {
  try {
    const obj = Object.fromEntries(historyCache);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    devWarn('保存历史数据缓存失败:', e);
  }
};

const CACHE_DURATION = 86400000; // 24小时缓存 (24 * 60 * 60 * 1000)
const VALID_CACHE_DURATION = 86400000; // 有效缓存时长24小时

// 内置默认汇率（作为最后防线，基于最新市场数据更新）
const DEFAULT_RATES: Record<string, number> = {
  'USD-CNY': 7.08,
  'CNY-USD': 0.141,
  'EUR-CNY': 7.65,
  'CNY-EUR': 0.131,
  'GBP-CNY': 9.15,
  'CNY-GBP': 0.109,
  'JPY-CNY': 0.047,
  'CNY-JPY': 21.28,
  'HKD-CNY': 0.91,
  'CNY-HKD': 1.10,
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
        devLog('删除过期汇率缓存:', key);
      }
    }
    saveCache(); // 保存清理后的缓存
    
    // 清理历史数据缓存
    for (const [key, value] of historyCache.entries()) {
      if (shouldUpdateCache(value.timestamp)) {
        historyCache.delete(key);
        devLog('删除过期历史数据缓存:', key);
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
  devLog('下一次汇率更新时间:', nextUpdateDate.toLocaleString('zh-CN'));
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
  monthlyData.forEach((monthData) => {
    // 按日期排序，取最后一个
    const sortedData = monthData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push(sortedData[sortedData.length - 1]);
  });
  
  // 按日期排序
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  devLog('1年数据优化完成:', result.length, '个月份数据点');
  devLog('月份数据范围:', {
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
  yearlyData.forEach((yearData) => {
    // 按日期排序，取最后一个
    const sortedData = yearData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push(sortedData[sortedData.length - 1]);
  });
  
  // 按日期排序
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  devLog('长期数据优化完成:', result.length, '个年份数据点');
  devLog('年份数据范围:', {
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
  devLog('生成模拟历史数据:', { fromCurrency, toCurrency, period });
  
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
  
  devLog('模拟数据生成完成:', result.length, '条记录');
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
  
  devWarn('无法找到货币对的模拟汇率:', rateKey, '使用默认值1.0');
  return 1.0;
};

// 预加载汇率（已禁用，避免API限流）
// 由于免费API套餐每日只有200次请求限制，禁用预加载功能
export const preloadExchangeRate = async (): Promise<void> => {
  devLog('预加载已禁用，避免API限流');
  return;
};

// 主 API：ExchangeRate-API - 一次调用返回所有币种汇率，批量缓存
const fetchFromPrimaryAPI = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; isMock: boolean; isStale?: boolean }> => {
  const url = `${PRIMARY_API_BASE}/${fromCurrency}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  
  if (!res.ok) {
    throw new Error(`主API(ExchangeRate-API)调用失败: ${res.status}`);
  }
  
  const data = await res.json();
  
  if (data.result === 'success' && data.rates) {
    const now = Date.now();
    // 批量缓存：一次API调用缓存所有币种对，大幅减少后续调用
    for (const [code, rate] of Object.entries(data.rates)) {
      if (typeof rate === 'number' && rate > 0) {
        const key = getCacheKey(fromCurrency, code);
        rateCache.set(key, { rate, timestamp: now });
      }
    }
    saveCache();
    
    const targetRate = data.rates[toCurrency];
    if (targetRate && targetRate > 0) {
      devLog('主API(ExchangeRate-API)汇率获取成功:', fromCurrency, '->', toCurrency, '=', targetRate, '(同时缓存了', Object.keys(data.rates).length, '个币种)');
      return { rate: targetRate, isMock: false };
    }
    
    throw new Error(`主API未返回 ${toCurrency} 的汇率`);
  }
  
  throw new Error('主API返回数据格式异常');
};

// 备用 API：UniRateAPI
const fetchFromBackupAPI = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; isMock: boolean; isStale?: boolean }> => {
  const url = buildUnirateDirectUrl('rates', { from: fromCurrency, to: toCurrency });
  if (!url) {
    throw new Error('备用API(UniRateAPI)未配置 VITE_UNIRATE_API_KEY');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  const res = await fetch(url, {
    signal: controller.signal,
    headers: { 'Accept': 'application/json' }
  });
  clearTimeout(timeoutId);
  
  if (!res.ok) {
    throw new Error(`备用API(UniRateAPI)调用失败: ${res.status}`);
  }
  
  const data = await res.json();
  
  let rate = 0;
  if (data.rate && data.to === toCurrency) {
    rate = data.rate;
  } else if (data.result && data.to === toCurrency) {
    rate = data.result;
  } else if (data.rates && data.rates[toCurrency]) {
    rate = data.rates[toCurrency];
  }
  
  if (rate > 0) {
    const cacheKey = getCacheKey(fromCurrency, toCurrency);
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    saveCache();
    devLog('备用API(UniRateAPI)汇率获取成功:', fromCurrency, '->', toCurrency, '=', rate);
    return { rate, isMock: false };
  }
  
  throw new Error('备用API返回数据无法解析');
};

// 获取实时汇率（主入口）
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; isMock: boolean; isStale?: boolean }> => {
  if (fromCurrency === toCurrency) return { rate: 1, isMock: false };
  
  // 1. 检查缓存
  const cacheKey = getCacheKey(fromCurrency, toCurrency);
  const cached = rateCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    return { rate: cached.rate, isMock: false };
  }

  if (cached && cached.rate > 0) {
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge < VALID_CACHE_DURATION) {
      return { rate: cached.rate, isMock: false };
    }
  }

  // 2. 尝试主 API（ExchangeRate-API）
  try {
    return await fetchFromPrimaryAPI(fromCurrency, toCurrency);
  } catch (primaryError) {
    devWarn('主API(ExchangeRate-API)失败:', primaryError instanceof Error ? primaryError.message : primaryError);
  }
  
  // 3. 主API失败，尝试备用 API（UniRateAPI）
  try {
    devLog('尝试备用API(UniRateAPI)...');
    return await fetchFromBackupAPI(fromCurrency, toCurrency);
  } catch (backupError) {
    devWarn('备用API(UniRateAPI)也失败:', backupError instanceof Error ? backupError.message : backupError);
  }
  
  // 4. 两个API都失败，尝试使用过期缓存
  if (cached && cached.rate > 0) {
    devWarn('所有API失败，使用过期缓存汇率:', cached.rate);
    return { rate: cached.rate, isMock: false, isStale: true };
  }
  
  // 5. 无缓存，使用内置默认汇率
  const defaultRate = DEFAULT_RATES[cacheKey];
  if (defaultRate) {
    devWarn('使用内置默认汇率:', defaultRate);
    return { rate: defaultRate, isMock: true, isStale: true };
  }

  const reverseKey = `${toCurrency}-${fromCurrency}`;
  if (DEFAULT_RATES[reverseKey]) {
    const rate = 1 / DEFAULT_RATES[reverseKey];
    devWarn('使用反向内置默认汇率:', rate);
    return { rate, isMock: true, isStale: true };
  }

  throw new Error('无法获取汇率数据：所有API均失败且无缓存');
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
    devWarn('无效的货币参数:', { fromCurrency, toCurrency });
    return [];
  }
  
  // 检查历史数据缓存
  const historyCacheKey = getHistoryCacheKey(fromCurrency, toCurrency, period);
  const cachedHistory = historyCache.get(historyCacheKey);
  
  if (cachedHistory && isHistoryCacheValid(cachedHistory.timestamp)) {
    devLog('使用缓存历史数据:', cachedHistory.data.length, '条记录，缓存键:', historyCacheKey);
    return cachedHistory.data;
  }

  // 如果有过期的历史数据缓存，直接使用避免等待
  if (cachedHistory && cachedHistory.data.length > 0) {
    devLog('使用过期历史数据缓存避免等待:', cachedHistory.data.length, '条记录，缓存键:', historyCacheKey);
    return cachedHistory.data;
  }

  // 如果没有任何缓存，直接调用API获取真实历史数据
  devLog('无历史数据缓存，调用API获取真实历史数据');
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
    devLog('非更新时间点，使用模拟历史数据');
    const mockHistoricalData = generateMockHistoricalData(fromCurrency, toCurrency, period);
    if (mockHistoricalData.length > 0) {
      historyCache.set(historyCacheKey, { data: mockHistoricalData, timestamp: Date.now() });
      return mockHistoricalData;
    }
  }

  const url = buildUnirateDirectUrl('historical/timeseries', {
    from: fromCurrency,
    to: toCurrency,
    start_date: startStr,
    end_date: endStr,
  });
  if (!url) {
    devWarn('历史数据：未配置 VITE_UNIRATE_API_KEY，跳过 UniRate 请求');
    return [];
  }
  
  devLog('固定时间点获取历史数据API调用详情:', {
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
    devLog('API响应状态:', res.status, res.statusText);
    devLog('API响应头:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API错误响应:', errorText);
      console.error('完整响应:', res);
      
      // 如果是429错误（请求过多），等待后重试而不使用模拟数据
      if (res.status === 429) {
        devWarn('历史数据API请求限制，请稍后重试');
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
    devLog('API返回数据结构:', {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      totalDays: data.total_days,
      startDate: data.start_date,
      endDate: data.end_date
    });
    
    if (!data.data || Object.keys(data.data).length === 0) {
      devWarn('API返回了空数据');
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
    
    devLog('处理后的结果:', result.slice(0, 3)); // 只显示前3条
    
    // 存储到缓存
    if (result.length > 0) {
      historyCache.set(historyCacheKey, { data: result, timestamp: Date.now() });
      devLog('历史数据已缓存:', historyCacheKey, result.length, '条记录');
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
        devWarn('历史数据API调用失败，使用24小时内的缓存数据');
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
  const url = buildUnirateDirectUrl('currencies', {});
  if (!url) return [];
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.currencies || [];
};

// 强制刷新汇率数据（无视缓存）
// ExchangeRate-API 一次调用返回所有币种，只需按基础货币调用即可
export const forceRefreshRates = async (): Promise<void> => {
  devLog('开始强制刷新汇率数据...');
  
  rateCache.clear();
  historyCache.clear();
  saveCache();
  saveHistoryCache();
  
  // 只需刷新几个基础货币，每次调用会缓存该货币对所有币种的汇率
  const baseCurrencies = ['USD', 'CNY', 'EUR'];
  
  for (const base of baseCurrencies) {
    try {
      await fetchFromPrimaryAPI(base, base === 'USD' ? 'CNY' : 'USD');
      devLog(`${base} 基准汇率刷新成功（已缓存所有币种）`);
    } catch (error) {
      devWarn(`${base} 基准主API刷新失败，尝试备用API:`, error instanceof Error ? error.message : error);
      try {
        await fetchFromBackupAPI(base, base === 'USD' ? 'CNY' : 'USD');
      } catch (backupError) {
        console.error(`${base} 基准备用API也失败:`, backupError instanceof Error ? backupError.message : backupError);
      }
    }
  }
  
  devLog('强制刷新完成，当前缓存', rateCache.size, '条汇率');
};