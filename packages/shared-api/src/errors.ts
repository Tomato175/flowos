// ============================================================
// @flow/api — API 错误处理
// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static notFound(resource: string): ApiError {
    return new ApiError(`${resource} 不存在`, 'NOT_FOUND', 404);
  }

  static unauthorized(): ApiError {
    return new ApiError('请先登录', 'UNAUTHORIZED', 401);
  }

  static forbidden(): ApiError {
    return new ApiError('没有权限', 'FORBIDDEN', 403);
  }

  static validation(message: string): ApiError {
    return new ApiError(message, 'VALIDATION_ERROR', 400);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 'CONFLICT', 409);
  }
}

/**
 * 包装 Supabase 错误
 */
export function handleSupabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const message = error instanceof Error ? error.message : '未知错误';

  if (message.includes('duplicate')) {
    return ApiError.conflict('数据已存在');
  }

  if (message.includes('violates row-level security')) {
    return ApiError.unauthorized();
  }

  return new ApiError(message, 'INTERNAL_ERROR', 500);
}
