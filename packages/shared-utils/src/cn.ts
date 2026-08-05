// ============================================================
// 轻量级 className 合并工具（替代 clsx + tailwind-merge）
// ============================================================

type ClassValue = string | undefined | null | false | ClassValue[];

/**
 * 合并 class name，过滤掉 falsy 值
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ')
    .trim();
}
