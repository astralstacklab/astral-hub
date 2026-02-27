import type { ErrorResponse } from '@astral-hub/shared-types'
import type { FetchError } from 'ofetch'

interface RequestOptions {
  headers?: HeadersInit
}

interface GetOptions extends RequestOptions {
  query?: Record<string, string | number | boolean | undefined>
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function useApiClient() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string
  const userStore = useUserStore()

  const buildHeaders = (headers?: HeadersInit): Headers => {
    const token = userStore.token
    const merged = new Headers(headers)

    if (token) {
      merged.set('Authorization', `Bearer ${token}`)
    }

    return merged
  }

  const get = <T>(url: string, options: GetOptions = {}) =>
    $fetch<T>(url, {
      method: 'GET',
      baseURL,
      query: options.query,
      headers: buildHeaders(options.headers),
    })

  const post = <T>(
    url: string,
    body?: BodyInit | Record<string, unknown> | null,
    options: RequestOptions = {}
  ) =>
    $fetch<T>(url, {
      method: 'POST',
      baseURL,
      body,
      headers: buildHeaders(options.headers),
    })

  const put = <T>(
    url: string,
    body?: BodyInit | Record<string, unknown> | null,
    options: RequestOptions = {}
  ) =>
    $fetch<T>(url, {
      method: 'PUT',
      baseURL,
      body,
      headers: buildHeaders(options.headers),
    })

  const patch = <T>(
    url: string,
    body?: BodyInit | Record<string, unknown> | null,
    options: RequestOptions = {}
  ) =>
    $fetch<T>(url, {
      method: 'PATCH',
      baseURL,
      body,
      headers: buildHeaders(options.headers),
    })

  const del = <T>(url: string, options: RequestOptions = {}) =>
    $fetch<T>(url, {
      method: 'DELETE',
      baseURL,
      headers: buildHeaders(options.headers),
    })

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  }
}

export function handleApiError(error: unknown): string {
  const fetchError = error as FetchError<ErrorResponse>

  const apiMessage = fetchError?.data?.error?.message
  if (apiMessage) {
    return apiMessage
  }

  if (fetchError?.statusCode) {
    if (fetchError.statusCode >= 500) {
      return '伺服器暫時無法回應，請稍後再試。'
    }

    if (fetchError.statusCode === 401) {
      return '登入狀態已失效，請重新登入。'
    }

    if (fetchError.statusCode === 403) {
      return '你沒有權限執行此操作。'
    }

    if (fetchError.statusCode === 404) {
      return '找不到請求的資源。'
    }

    if (fetchError.statusCode >= 400) {
      return '請求失敗，請檢查輸入資料。'
    }
  }

  if (isObject(error) && typeof error.message === 'string') {
    if (/network|fetch|failed/i.test(error.message)) {
      return '網路連線失敗，請確認網路後重試。'
    }

    return error.message
  }

  return '發生未知錯誤，請稍後再試。'
}
