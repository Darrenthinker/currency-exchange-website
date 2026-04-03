/** 仅开发环境输出，减少生产环境控制台噪音 */
export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) console.log(...args);
}

export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) console.warn(...args);
}
