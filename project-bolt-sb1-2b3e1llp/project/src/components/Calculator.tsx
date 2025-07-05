import React, { useState } from 'react';

const buttons = [
  ['7', '8', '9', '+'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '×'],
  ['0', '.', '%', '÷'],
  ['( )', '←', 'AC', '='],
];

// 自定义更长尾巴的回删箭头
const CustomBackspaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <polyline points="13,11 8,16 13,21" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Calculator: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleClick = (val: string) => {
    if (val === '=') {
      try {
        // eslint-disable-next-line no-eval
        const evalResult = eval(input.replace('%', '/100'));
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
      // 自动补全括号，优先补(
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex flex-col items-end mb-4">
        <div className="w-full text-right bg-gray-50 rounded-xl px-4 py-3 mb-2 border border-gray-200 min-h-[60px]">
          {showResult && result !== null ? (
            <>
              <div className="text-base text-gray-500 select-all">{input} =</div>
              <div className="text-3xl font-bold text-gray-900 select-all">{result}</div>
            </>
          ) : (
            <div className="text-3xl font-bold text-gray-900 select-all">{input || '0'}</div>
          )}
        </div>
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
  );
}; 