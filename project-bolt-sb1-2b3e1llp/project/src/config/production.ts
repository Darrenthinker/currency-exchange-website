// 生产环境配置
export const PRODUCTION_CONFIG = {
  // API配置
  API: {
    BASE_URL: 'https://api.unirate.co/v1',
    API_KEY: 'boD3FcxoDzeGMukU48L9S0hakWV0np7feubaSJbH2tEnNerht7vir39R06mr9VRD',
    RATE_LIMIT: 50, // 每小时50次请求
    TIMEOUT: 10000, // 10秒超时
  },
  
  // 缓存策略
  CACHE: {
    // 固定更新时间点（小时）
    UPDATE_HOURS: [0, 4, 8, 12, 16, 20],
    // 缓存持续时间（4小时）
    DURATION: 4 * 60 * 60 * 1000,
    // 历史数据缓存时间（4小时）
    HISTORY_DURATION: 4 * 60 * 60 * 1000,
  },
  
  // 重试策略
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000, // 5秒
    BACKOFF_MULTIPLIER: 2,
  },
  
  // 降级策略
  FALLBACK: {
    ENABLE_MOCK_DATA: true,
    MOCK_DATA_CACHE_DURATION: 1 * 60 * 60 * 1000, // 1小时
  }
};

// 部署说明
export const DEPLOYMENT_NOTES = `
部署到生产环境的注意事项：

1. API限制管理：
   - 每小时最多50次API调用
   - 系统按固定时间点更新：0点、4点、8点、12点、16点、20点
   - 每天最多24次API调用，远低于限制

2. 缓存策略：
   - 实时汇率缓存4小时
   - 历史数据缓存4小时
   - 智能降级：API失败时使用模拟数据

3. 用户体验：
   - 首次加载优先使用API数据
   - API失败时自动降级到模拟数据
   - 固定时间点更新，用户无感知

4. 监控建议：
   - 监控API调用次数
   - 监控API响应时间
   - 监控降级使用频率

5. 性能优化：
   - 所有数据都有缓存
   - 按需加载历史数据
   - 智能重试机制
`; 