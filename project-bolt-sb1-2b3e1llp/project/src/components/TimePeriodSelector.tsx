import React from 'react';
import { TimePeriod } from '../types/currency';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: '1D', label: '1天' },
    { value: '5D', label: '5天' },
    { value: '1M', label: '1个月' },
    { value: '1Y', label: '1年' },
    { value: '5Y', label: '5年' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedPeriod === period.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};