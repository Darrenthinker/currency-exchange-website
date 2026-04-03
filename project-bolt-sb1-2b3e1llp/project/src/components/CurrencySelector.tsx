import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  label?: string;
  currencyList: { code: string; country: string; name: string }[];
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  label,
  currencyList,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const labelId = label ? `${uid}-label` : undefined;
  const listId = `${uid}-list`;

  const selectedCurrencyData = currencyList.find(c => c.code === selectedCurrency);
  const filteredCurrencies = currencyList.length > 0 
    ? currencyList.filter(currency =>
        currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (currency.country && currency.country.includes(searchTerm))
      )
    : [];

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  const handleCurrencySelect = (currency: { code: string; country: string; name: string }) => {
    onCurrencyChange(currency.code);
    close();
  };

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        close();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  return (
    <div className="relative" ref={rootRef}>
      {label && (
        <label id={labelId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listId : undefined}
        aria-labelledby={labelId}
        className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px]"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg">{selectedCurrencyData?.country}</span>
            <span className="font-semibold text-lg">{selectedCurrencyData?.code}</span>
            <span className="text-sm text-gray-500">{selectedCurrencyData?.name}</span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {isOpen && (
        <div
          id={listId}
          className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden"
          role="listbox"
        >
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
              <input
                type="text"
                placeholder="搜索货币..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="搜索货币"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  role="option"
                  aria-selected={currency.code === selectedCurrency}
                  onClick={() => handleCurrencySelect(currency)}
                  className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors text-left min-h-[40px]"
                >
                  <span className="flex-1 flex items-center justify-start gap-x-2">
                    <span className="font-semibold text-base text-left align-middle whitespace-nowrap">{currency.country}</span>
                    <span className="font-mono font-semibold text-base text-left align-middle whitespace-nowrap mr-1">{currency.code}</span>
                    <span className="text-xs text-gray-500 text-left align-middle whitespace-nowrap">{currency.name}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {currencyList.length === 0 ? '正在加载币种列表...' : '未找到匹配的币种'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
