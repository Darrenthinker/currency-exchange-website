import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mr-5">
          <ArrowLeftRight className="w-10 h-10 text-white" />
            </div>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">货币汇率兑换</h1>
          <p className="text-base font-bold text-red-500 mt-1 mb-0">实时汇率查询</p>
          <p className="text-xs text-gray-500 mt-1">支持593种货币（170法定/423加密）</p>
        </div>
      </div>
    </header>
  );
};