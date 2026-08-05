// ============================================================
// 格式化工具
// ============================================================

/**
 * 截断文本
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 首字母大写
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 将 snake_case 转为 camelCase
 */
export function toCamelCase(text: string): string {
  return text.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

/**
 * 获取优先级标签
 */
export function priorityLabel(priority: number): string {
  const labels: Record<number, string> = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3' };
  return labels[priority] ?? 'P2';
}

/**
 * 获取任务状态标签
 */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    inbox: '收件箱',
    todo: '待办',
    doing: '进行中',
    done: '已完成',
    archived: '已归档',
  };
  return labels[status] ?? status;
}

/**
 * 获取习惯频率标签
 */
export function frequencyLabel(type: string, count: number): string {
  const labels: Record<string, string> = {
    daily: '每天',
    weekly: `每周${count}次`,
    monthly: `每月${count}次`,
    custom: '自定义',
  };
  return labels[type] ?? type;
}
