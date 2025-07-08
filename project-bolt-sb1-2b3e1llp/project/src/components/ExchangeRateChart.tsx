import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ExchangeRate } from '../types/currency';

interface ExchangeRateChartProps {
  data: ExchangeRate[];
  fromCurrency: string;
  toCurrency: string;
  currentRate?: number;
  period?: string;
}

export const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({
  data,
  fromCurrency,
  toCurrency,
  currentRate: propCurrentRate,
  period = '1M',
}) => {
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    
    switch (period) {
      case '1D':
      case '5D':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      case '1M':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      case '1Y':
        // 1年数据只显示月份，确保不重复
        return date.toLocaleDateString('zh-CN', { month: 'short' });
      case '5Y':
        // 5年数据只显示年份
        return date.getFullYear().toString();
      default:
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'rate') {
      return [value.toFixed(4), `${fromCurrency}/${toCurrency}`];
    }
    return [value, name];
  };

  const formatTooltipLabel = (label: string) => {
    return new Date(label).toLocaleDateString('zh-CN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentRate = propCurrentRate || data[data.length - 1]?.rate || 0;
  const isPositiveTrend = data.length > 1 && data[data.length - 1].rate > data[0].rate;

  // 根据时间段计算X轴刻度数量
  const getTickCount = () => {
    switch (period) {
      case '1D':
        return 3; // 1天显示3个点
      case '5D':
        return 5; // 5天显示5个点
      case '1M':
        return 6; // 1个月显示6个点
      case '1Y':
        return Math.min(data.length, 12); // 1年显示最多12个月，但不超过实际数据点数
      case '5Y':
        return Math.min(data.length, 6); // 5年显示最多6个年份，但不超过实际数据点数
      default:
        return 6;
    }
  };

  // 如果没有数据，显示提示信息
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {fromCurrency}/{toCurrency} 汇率走势
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">当前汇率:</span>
            <span className="font-semibold">{currentRate.toFixed(4)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">📊</div>
            <div className="text-gray-500">正在加载历史数据...</div>
            <div className="text-sm text-gray-400 mt-1">时间段: {period}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {fromCurrency}/{toCurrency} 汇率走势
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">当前汇率:</span>
          <span className="font-semibold">{currentRate.toFixed(4)}</span>
          <span className={`text-sm ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveTrend ? '↗' : '↘'}
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#666"
            fontSize={12}
            tickCount={getTickCount()}
            interval={period === '1Y' ? 0 : 'preserveStartEnd'}
            minTickGap={period === '1Y' ? 30 : 10}
          />
          <YAxis
            domain={['dataMin - 0.01', 'dataMax + 0.01']}
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={isPositiveTrend ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            dot={{ fill: isPositiveTrend ? '#10b981' : '#ef4444', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: isPositiveTrend ? '#10b981' : '#ef4444', strokeWidth: 2 }}
          />
          <ReferenceLine
            y={currentRate}
            stroke="#9ca3af"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};