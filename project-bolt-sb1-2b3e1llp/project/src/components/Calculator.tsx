import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { safeEvaluateMath } from '../utils/safeCalc';

const buttons = [
  ['7', '8', '9', '+'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '×'],
  ['0', '.', '%', '÷'],
  ['( )', '←', 'AC', '='],
];

const fixedQuickAddAmounts = [50, 100, 150];
const defaultCustomQuickAddAmounts: Array<number | null> = [null, null, null];
const CUSTOM_QUICK_ADD_STORAGE_KEY = 'calculator_custom_quick_add_amounts';

const formatQuickAmount = (amount: number): string => (
  Number.isInteger(amount) ? amount.toString() : amount.toFixed(2)
);

const loadCustomQuickAddAmounts = (): Array<number | null> => {
  try {
    const stored = localStorage.getItem(CUSTOM_QUICK_ADD_STORAGE_KEY);
    if (!stored) return defaultCustomQuickAddAmounts;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length !== defaultCustomQuickAddAmounts.length) {
      return defaultCustomQuickAddAmounts;
    }

    const amounts = parsed.map((value) => {
      if (value === null || value === '') return null;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
    });

    return amounts.length === defaultCustomQuickAddAmounts.length
      ? amounts
      : defaultCustomQuickAddAmounts;
  } catch {
    return defaultCustomQuickAddAmounts;
  }
};

// 自定义更长尾巴的回删箭头
const CustomBackspaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <polyline points="13,11 8,16 13,21" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface CalculatorProps {
  initialValue?: string | number;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialValue }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddSuppressed, setQuickAddSuppressed] = useState(false);
  const [customQuickAddAmounts, setCustomQuickAddAmounts] = useState<Array<number | null>>(loadCustomQuickAddAmounts);
  const [editingCustomIndex, setEditingCustomIndex] = useState<number | null>(null);
  const [editingQuickAmount, setEditingQuickAmount] = useState('');
  const [editingError, setEditingError] = useState('');
  const displayRef = useRef<HTMLDivElement>(null);
  const quickAddClickTimerRef = useRef<number | null>(null);

  const handleCopy = useCallback(async () => {
    const valueToCopy = showResult && result !== null && result !== '错误'
      ? Number(result).toFixed(2)
      : input || '0';
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = valueToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [showResult, result, input]);

  // 外部初始值变化时自动填入
  useEffect(() => {
    if (typeof initialValue === 'string' || typeof initialValue === 'number') {
      setInput(initialValue.toString());
      setShowResult(false);
    }
  }, [initialValue]);

  // 只有聚焦时才监听键盘
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isFocused) return;
    const key = e.key;
    if ((key >= '0' && key <= '9') || key === '.') {
      setInput(prev => prev + key);
      setShowResult(false);
    } else if (key === '+' || key === '-') {
      setInput(prev => prev + key);
      setShowResult(false);
    } else if (key === '*' || key === 'x' || key === 'X') {
      setInput(prev => prev + '*');
      setShowResult(false);
    } else if (key === '/' || key === '÷') {
      setInput(prev => prev + '/');
      setShowResult(false);
    } else if (key === '%') {
      setInput(prev => prev + '%');
      setShowResult(false);
    } else if (key === '(' || key === ')') {
      setInput(prev => prev + key);
      setShowResult(false);
    } else if (key === 'Backspace') {
      setInput(prev => prev.slice(0, -1));
      setShowResult(false);
    } else if (key === 'Enter' || key === '=') {
      try {
        const evalResult = safeEvaluateMath(input);
        setResult(evalResult.toString());
        setShowResult(true);
      } catch {
        setResult('错误');
        setShowResult(true);
      }
    } else if (key === 'c' || key === 'C' || key === 'Escape') {
      setInput('');
      setResult(null);
      setShowResult(false);
    }
  }, [input, isFocused]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (quickAddClickTimerRef.current !== null) {
        window.clearTimeout(quickAddClickTimerRef.current);
      }
    };
  }, []);

  // 让显示区域可聚焦，点击时聚焦
  useEffect(() => {
    if (isFocused && displayRef.current) {
      displayRef.current.focus();
    }
  }, [isFocused]);

  const handleClick = (val: string) => {
    if (val === '=') {
      try {
        const evalResult = safeEvaluateMath(input);
        setResult(evalResult.toString());
        setShowResult(true);
      } catch {
        setResult('错误');
        setShowResult(true);
      }
    } else if (val === 'AC') {
      setInput('');
      setResult(null);
      setShowResult(false);
    } else if (val === '←') {
      setInput(input.slice(0, -1));
      setShowResult(false);
    } else if (val === '( )') {
      const leftCount = (input.match(/\(/g) || []).length;
      const rightCount = (input.match(/\)/g) || []).length;
      if (leftCount === rightCount) {
        setInput(input + '(');
      } else {
        setInput(input + ')');
      }
      setShowResult(false);
    } else {
      setInput(input + val);
      setShowResult(false);
    }
  };

  const baseValue = useMemo(() => {
    if (showResult && result !== null) {
      if (result === '错误') return null;
      const numericResult = Number(result);
      return Number.isFinite(numericResult) ? numericResult : null;
    }

    if (!input.trim()) return null;

    try {
      const evaluated = safeEvaluateMath(input);
      return Number.isFinite(evaluated) ? evaluated : null;
    } catch {
      const numericInput = Number(input);
      return Number.isFinite(numericInput) ? numericInput : null;
    }
  }, [input, result, showResult]);

  const initialBaseValue = useMemo(() => {
    if (initialValue === '' || initialValue === undefined || initialValue === null) return null;
    const numericInitialValue = Number(initialValue.toString().replace(/,/g, ''));
    return Number.isFinite(numericInitialValue) ? numericInitialValue : null;
  }, [initialValue]);

  const quickAddBaseValue = initialBaseValue ?? baseValue;

  const quickAddItems = useMemo(() => [
    ...fixedQuickAddAmounts.map((amount) => ({ amount, key: `fixed-${amount}` })),
    ...customQuickAddAmounts.map((amount, index) => ({ amount, key: `custom-${index}`, customIndex: index })),
  ], [customQuickAddAmounts]);

  const handleQuickAdd = (amountToAdd: number) => {
    if (quickAddBaseValue === null) return;

    const roundedBase = Number(quickAddBaseValue.toFixed(2));
    const expression = `${roundedBase.toFixed(2)}+${formatQuickAmount(amountToAdd)}`;
    const quickResult = roundedBase + amountToAdd;

    setInput(expression);
    setResult(quickResult.toString());
    setShowResult(true);
    setShowQuickAdd(false);
    setQuickAddSuppressed(true);
    displayRef.current?.focus();
  };

  const handleQuickAddButtonClick = (amountToAdd: number | null, customIndex?: number) => {
    if (amountToAdd === null) {
      if (customIndex !== undefined) {
        openCustomAmountEditor(customIndex);
      }
      return;
    }

    if (quickAddClickTimerRef.current !== null) return;

    quickAddClickTimerRef.current = window.setTimeout(() => {
      handleQuickAdd(amountToAdd);
      quickAddClickTimerRef.current = null;
    }, 180);
  };

  const openCustomAmountEditor = (customIndex: number) => {
    if (quickAddClickTimerRef.current !== null) {
      window.clearTimeout(quickAddClickTimerRef.current);
      quickAddClickTimerRef.current = null;
    }

    const currentAmount = customQuickAddAmounts[customIndex];
    setEditingCustomIndex(customIndex);
    setEditingQuickAmount(currentAmount === null ? '' : formatQuickAmount(currentAmount));
    setEditingError('');
  };

  const closeCustomAmountEditor = () => {
    setEditingCustomIndex(null);
    setEditingQuickAmount('');
    setEditingError('');
  };

  const saveCustomAmount = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (editingCustomIndex === null) return;

    const trimmedAmount = editingQuickAmount.trim();
    const numericAmount = trimmedAmount === '' ? null : Number(trimmedAmount);
    if (numericAmount !== null && (!Number.isFinite(numericAmount) || numericAmount < 0)) {
      setEditingError('请输入有效的非负数字');
      return;
    }

    const roundedAmount = numericAmount === null ? null : Number(numericAmount.toFixed(2));
    const nextAmounts = customQuickAddAmounts.map((amount, index) => (
      index === editingCustomIndex ? roundedAmount : amount
    ));

    setCustomQuickAddAmounts(nextAmounts);
    localStorage.setItem(CUSTOM_QUICK_ADD_STORAGE_KEY, JSON.stringify(nextAmounts));
    closeCustomAmountEditor();
  };

  const showQuickAddButtons = () => {
    if (!quickAddSuppressed) {
      setShowQuickAdd(true);
    }
  };

  const hideQuickAddButtons = () => {
    setShowQuickAdd(false);
    setQuickAddSuppressed(false);
  };

  const quickAddButtonClass =
    'h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white';

  return (
    <div
      className="relative mx-auto mb-8 w-full max-w-2xl"
      onMouseEnter={showQuickAddButtons}
      onMouseLeave={hideQuickAddButtons}
      onTouchStart={showQuickAddButtons}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full flex flex-col items-center">
        <div className="w-full flex flex-col items-end mb-4">
          <div
            className="w-full text-right bg-gray-50 rounded-xl px-4 py-3 mb-2 border border-gray-200 min-h-[60px] outline-none relative group"
            tabIndex={0}
            ref={displayRef}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={() => setIsFocused(true)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-blue-50 text-gray-400 hover:text-blue-600 border border-gray-200 shadow-sm"
              title="复制数值"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            {copied && (
              <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                已复制
              </div>
            )}
            {showResult && result !== null ? (
              <>
                <div className="text-base text-gray-500 select-all">{input} =</div>
                <div className="text-3xl font-bold text-gray-900 select-all">{result !== '错误' ? Number(result).toFixed(2) : result}</div>
              </>
            ) : (
              <div className="text-3xl font-bold select-all min-h-[2.5rem] flex items-center justify-end w-full pr-1">
                {input !== '' ? (
                  <span className="text-gray-900">{input}</span>
                ) : (
                  <span className="text-gray-400 text-xl font-normal">输入数字或算式</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className={`mb-4 grid w-full grid-cols-3 gap-x-1.5 gap-y-2.5 lg:hidden ${
            showQuickAdd ? '' : 'hidden'
          }`}
        >
          {quickAddItems.map((quickItem) => (
            <button
              key={quickItem.key}
              type="button"
              onClick={() => handleQuickAddButtonClick(quickItem.amount, quickItem.customIndex)}
              onDoubleClick={() => {
                if (quickItem.customIndex !== undefined) {
                  openCustomAmountEditor(quickItem.customIndex);
                }
              }}
              onContextMenu={(e) => {
                if (quickItem.customIndex !== undefined) {
                  e.preventDefault();
                  openCustomAmountEditor(quickItem.customIndex);
                }
              }}
              disabled={quickAddBaseValue === null && quickItem.amount !== null}
              className={quickAddButtonClass}
              title={
                quickItem.amount === null
                  ? '点击设置自定义金额'
                  : quickItem.customIndex === undefined
                  ? `加 ${quickItem.amount}`
                  : '单击添加，双击修改'
              }
              aria-label={quickItem.amount === null ? '设置自定义金额' : `加 ${quickItem.amount}`}
            >
              {quickItem.amount === null ? '+' : `+${formatQuickAmount(quickItem.amount)}`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 w-full">
          {buttons.map((row, rowIdx) =>
            row.map((btn, colIdx) =>
              btn ? (
                <button
                  key={rowIdx + '-' + colIdx}
                  className={
                    'py-4 rounded-full font-semibold transition-all ' +
                    (btn === '='
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow text-xl'
                      : btn === 'AC'
                      ? 'bg-gray-200 text-red-500 hover:bg-red-100 font-bold text-xl'
                      : btn === '-'
                      ? 'bg-gray-100 text-blue-600 hover:bg-blue-50 text-4xl'
                      : (btn === '÷')
                      ? 'bg-gray-100 text-blue-600 hover:bg-blue-50 text-3xl'
                      : (btn === '×' || btn === '+')
                      ? 'bg-gray-100 text-blue-600 hover:bg-blue-50 text-2xl'
                      : btn === '%'
                      ? 'bg-gray-100 text-blue-600 hover:bg-blue-50 text-xl'
                      : (['0','1','2','3','4','5','6','7','8','9','←'].includes(btn))
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 text-2xl font-extrabold'
                      : (btn === '.')
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 text-3xl font-extrabold flex items-center justify-center'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 text-xl')
                  }
                  style={{ minWidth: 0 }}
                  onClick={() => handleClick(btn === '×' ? '*' : btn === '÷' ? '/' : btn)}
                >
                  {btn === '←' ? (
                    <span className="flex items-center justify-center w-full h-full">
                      <CustomBackspaceIcon />
                    </span>
                  ) : (
                    btn
                  )}
                </button>
              ) : (
                <div key={rowIdx + '-' + colIdx}></div>
              )
            )
          )}
        </div>
      </div>

      <div className="absolute left-full top-4 ml-2 hidden h-20 w-44 lg:block" aria-hidden="true" />
      <div
        className={`absolute left-full top-5 z-10 ml-3 w-44 grid-cols-3 gap-x-1.5 gap-y-2.5 transition-opacity ${
          showQuickAdd ? 'hidden opacity-100 lg:grid' : 'hidden opacity-0'
        }`}
      >
        {quickAddItems.map((quickItem) => (
          <button
            key={quickItem.key}
            type="button"
            onClick={() => handleQuickAddButtonClick(quickItem.amount, quickItem.customIndex)}
            onDoubleClick={() => {
              if (quickItem.customIndex !== undefined) {
                openCustomAmountEditor(quickItem.customIndex);
              }
            }}
            onContextMenu={(e) => {
              if (quickItem.customIndex !== undefined) {
                e.preventDefault();
                openCustomAmountEditor(quickItem.customIndex);
              }
            }}
            disabled={quickAddBaseValue === null && quickItem.amount !== null}
            className={quickAddButtonClass}
            title={
              quickItem.amount === null
                ? '点击设置自定义金额'
                : quickItem.customIndex === undefined
                ? `加 ${quickItem.amount}`
                : '单击添加，双击修改'
            }
            aria-label={quickItem.amount === null ? '设置自定义金额' : `加 ${quickItem.amount}`}
          >
            {quickItem.amount === null ? '+' : `+${formatQuickAmount(quickItem.amount)}`}
          </button>
        ))}
      </div>
      {editingCustomIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4">
          <form
            onSubmit={saveCustomAmount}
            className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-5 shadow-xl"
          >
            <div className="text-base font-semibold text-gray-900">设置自定义金额</div>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={editingQuickAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEditingQuickAmount(e.target.value);
                setEditingError('');
              }}
              className="mt-4 h-11 w-full rounded-md border border-gray-300 px-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="输入金额，留空则显示 +"
              autoFocus
            />
            {editingError && (
              <div className="mt-2 text-sm text-red-600">{editingError}</div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCustomAmountEditor}
                className="h-9 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
