import type { SuccessResponse, ErrorResponse, PaginationMeta } from '@astral-hub/shared-types'

export function successResponse<T>(data: T, meta?: PaginationMeta): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
  }
}

export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}
