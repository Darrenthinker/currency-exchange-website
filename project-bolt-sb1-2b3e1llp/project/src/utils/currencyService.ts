import { ExchangeRate, TimePeriod } from '../types/currency';

const UNIRATE_API_KEY = 'boD3FcxoDzeGMukU48L9S0hakWV0np7feubaSJbH2tEnNerht7vir39R06mr9VRD';
const UNIRATE_BASE = 'https://api.unirateapi.com/api';

// 添加缓存机制
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const historyCache = new Map<string, { data: ExchangeRate[]; timestamp: number }>();
const CACHE_DURATION = 14400000; // 4小时缓存 (4 * 60 * 60 * 1000)
const HISTORY_CACHE_DURATION = 14400000; // 历史数据缓存4小时，减少API调用

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
  
  // 清理历史数据缓存
  for (const [key, value] of historyCache.entries()) {
    if (shouldUpdateCache(value.timestamp)) {
      historyCache.delete(key);
      console.log('删除过期历史数据缓存:', key);
    }
  }
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
      rate: Number(rate.toFixed(4)),
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
const getMockExchangeRate = (fromCurrency: string, toCurrency: string): number => {
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

// 预加载汇率（后台静默获取，不影响用户体验）
export const preloadExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<void> => {
  if (fromCurrency === toCurrency) return;
  
  // 检查缓存，如果已有有效缓存则不需要预加载
  const cacheKey = getCacheKey(fromCurrency, toCurrency);
  const cached = rateCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('缓存有效，跳过预加载:', cacheKey);
    return;
  }
  
  // 后台静默获取汇率
  console.log('开始预加载汇率:', { fromCurrency, toCurrency });
  try {
    await getExchangeRate(fromCurrency, toCurrency);
    console.log('汇率预加载完成:', cacheKey);
  } catch (error) {
    console.warn('汇率预加载失败:', error);
  }
};

// 获取实时汇率（异步，调用 UniRateAPI）
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; isMock: boolean }> => {
  if (fromCurrency === toCurrency) return { rate: 1, isMock: false };
  
  // 检查缓存
  const cacheKey = getCacheKey(fromCurrency, toCurrency);
  const cached = rateCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('使用缓存汇率:', cached.rate, '缓存键:', cacheKey);
    return { rate: cached.rate, isMock: false };
  }

  // 如果有过期的缓存，直接使用，避免等待API
  if (cached && cached.rate > 0) {
    console.log('使用过期缓存汇率避免等待:', cached.rate, '缓存键:', cacheKey);
    return { rate: cached.rate, isMock: false };
  }

  // 如果没有任何缓存，使用模拟汇率立即响应
  console.log('无缓存数据，使用模拟汇率立即响应');
  const mockRate = getMockExchangeRate(fromCurrency, toCurrency);
  if (mockRate > 0) {
    // 缓存模拟汇率
    rateCache.set(cacheKey, { rate: mockRate, timestamp: Date.now() });
    console.log('使用模拟汇率:', mockRate, '缓存键:', cacheKey);
    return { rate: mockRate, isMock: true };
  }
  
  // 只在固定时间点才调用API，其他时间直接返回模拟数据
  if (!isUpdateTime()) {
    console.log('非更新时间点，使用模拟汇率');
    const mockRate = getMockExchangeRate(fromCurrency, toCurrency);
    if (mockRate > 0) {
      rateCache.set(cacheKey, { rate: mockRate, timestamp: Date.now() });
      return { rate: mockRate, isMock: true };
    }
  }

  const url = `${UNIRATE_BASE}/rates?api_key=${UNIRATE_API_KEY}&from=${fromCurrency}&to=${toCurrency}`;
  console.log('固定时间点获取实时汇率:', { fromCurrency, toCurrency, url });
  
  try {
    const res = await fetch(url);
    console.log('实时汇率API响应状态:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('实时汇率API错误:', errorText);
      
      // 如果是429错误（请求过多），使用模拟汇率
      if (res.status === 429) {
        console.warn('API请求限制，使用模拟实时汇率');
        incrementRetryCount(cacheKey); // 增加重试计数
        const mockRate = getMockExchangeRate(fromCurrency, toCurrency);
        // 缓存模拟汇率，但设置较短的有效期以便重试
        if (mockRate > 0) {
          rateCache.set(cacheKey, { rate: mockRate, timestamp: Date.now() });
        }
        return { rate: mockRate, isMock: true };
      }
      
      return { rate: 0, isMock: true };
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
    
    if (data.rates && data.rates[toCurrency]) {
      // 原有格式：{ rates: { CNY: 7.16 } }
      rate = data.rates[toCurrency];
      console.log('使用rates格式，汇率:', rate);
    } else if (data.rate && data.to === toCurrency) {
      // 新格式：{ rate: 7.16, to: "CNY" }
      rate = data.rate;
      console.log('使用rate格式，汇率:', rate);
    } else if (data.result && data.to === toCurrency) {
      // 备用格式：{ result: 7.16, to: "CNY" }
      rate = data.result;
      console.log('使用result格式，汇率:', rate);
    } else {
      console.error('未能解析汇率数据，数据格式:', data);
    }
    
    console.log('最终解析出的汇率:', rate);
    
    // 存储到缓存
    if (rate > 0) {
      rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      resetRetryCount(cacheKey); // 成功时重置重试计数
      console.log('汇率已缓存:', cacheKey, rate);
      return { rate, isMock: false };
    }
    
    return { rate: 0, isMock: true };
  } catch (error) {
    console.error('实时汇率API调用异常:', error);
    
    // API调用失败时，使用模拟汇率作为降级方案
    console.warn('API调用失败，使用模拟汇率作为降级方案');
    incrementRetryCount(cacheKey); // 增加重试计数
    const mockRate = getMockExchangeRate(fromCurrency, toCurrency);
    if (mockRate > 0) {
      // 缓存模拟汇率，但设置较短的缓存时间，以便稍后重试API
      rateCache.set(cacheKey, { rate: mockRate, timestamp: Date.now() });
      console.log('使用模拟汇率作为降级方案:', mockRate, '重试次数:', apiRetryCount.get(cacheKey) || 0);
      return { rate: mockRate, isMock: true };
    }
    
    return { rate: 0, isMock: true };
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

  // 如果没有任何缓存，使用模拟历史数据立即响应
  console.log('无历史数据缓存，使用模拟数据立即响应');
  const mockHistoricalData = generateMockHistoricalData(fromCurrency, toCurrency, period);
  if (mockHistoricalData.length > 0) {
    // 缓存模拟历史数据
    historyCache.set(historyCacheKey, { data: mockHistoricalData, timestamp: Date.now() });
    console.log('使用模拟历史数据:', mockHistoricalData.length, '条记录，缓存键:', historyCacheKey);
    return mockHistoricalData;
  }
  
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
      
      // 如果是429错误（请求过多），使用模拟数据
      if (res.status === 429) {
        console.warn('API请求限制，使用模拟历史数据');
        return generateMockHistoricalData(fromCurrency, toCurrency, period);
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
    return [];
  }
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