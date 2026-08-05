// ============================================================
// 通用工具类型
// ============================================================

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/** 排序方向 */
export type SortDirection = 'asc' | 'desc';

/** 排序参数 */
export interface SortParams {
  field: string;
  direction: SortDirection;
}

/** 日期范围 */
export interface DateRange {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

/** 时间戳记录 */
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/** 用户标识 */
export interface UserOwned {
  user_id: string;
}

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** 可空类型 */
export type Nullable<T> = T | null;

/** 可选字段（所有字段变成可选 + nullable） */
export type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};

/** 深层只读 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/** ID 类型 */
export type UUID = string;

/** 年-季度 */
export type TimePeriod = `${number}-Q${1 | 2 | 3 | 4}` | `${number}-H${1 | 2}` | `${number}`;

/** 一周中的某天 (0 = 周日) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
