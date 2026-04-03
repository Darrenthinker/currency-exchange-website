/**
 * 安全解析计算器表达式（替代 eval）。
 * 支持 + - * / 括号；% 与原先一致，全部替换为 /100 后再解析。
 */
export function safeEvaluateMath(rawInput: string): number {
  const expanded = rawInput.replace(/\s/g, '').split('%').join('/100');
  if (!expanded.length) throw new Error('empty');

  if (!/^[\d.+\-*/()]+$/.test(expanded)) {
    throw new Error('invalid');
  }

  let i = 0;
  const s = expanded;

  const peek = () => s[i];

  const readNumber = (): number => {
    const start = i;
    while (i < s.length && /[\d.]/.test(s[i])) i++;
    const n = parseFloat(s.slice(start, i));
    if (Number.isNaN(n)) throw new Error('number');
    return n;
  };

  const parsePrimary = (): number => {
    if (peek() === '(') {
      i++;
      const v = parseExpr();
      if (peek() !== ')') throw new Error('paren');
      i++;
      return v;
    }
    if (peek() === '-') {
      i++;
      return -parsePrimary();
    }
    if (peek() === '+') {
      i++;
      return parsePrimary();
    }
    return readNumber();
  };

  const parseFactor = (): number => {
    let v = parsePrimary();
    while (peek() === '*' || peek() === '/') {
      const op = peek();
      i++;
      const rhs = parsePrimary();
      if (op === '*') v *= rhs;
      else v /= rhs;
    }
    return v;
  };

  const parseExpr = (): number => {
    let v = parseFactor();
    while (peek() === '+' || peek() === '-') {
      const op = peek();
      i++;
      const rhs = parseFactor();
      if (op === '+') v += rhs;
      else v -= rhs;
    }
    return v;
  };

  const result = parseExpr();
  if (i !== s.length) throw new Error('trail');
  if (!Number.isFinite(result) || Number.isNaN(result)) throw new Error('range');
  return result;
}
