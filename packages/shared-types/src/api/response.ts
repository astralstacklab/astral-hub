export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ErrorDetail {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ErrorResponse {
  success: false
  error: ErrorDetail
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse
