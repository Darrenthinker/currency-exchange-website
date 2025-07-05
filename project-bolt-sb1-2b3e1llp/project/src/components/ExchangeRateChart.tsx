import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ExchangeRate } from '../types/currency';

interface ExchangeRateChartProps {
  data: ExchangeRate[];
  fromCurrency: string;
  toCurrency: string;
}

export const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({
  data,
  fromCurrency,
  toCurrency,
}) => {
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
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

  const currentRate = data[data.length - 1]?.rate || 0;
  const isPositiveTrend = data.length > 1 && data[data.length - 1].rate > data[0].rate;

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