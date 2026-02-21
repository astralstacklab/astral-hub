import type { Product, SuccessResponse } from '@card-erp/shared-types'
import type { MaybeRefOrGetter } from 'vue'
import type { ProductListQuery } from '~/types'
import { toValue } from 'vue'

export function useProducts(query: ProductListQuery = {}) {
  const api = useApiClient()

  const asyncData = useAsyncData<SuccessResponse<Product[]>>(
    () => `products:${JSON.stringify(query)}`,
    () =>
      api.get<SuccessResponse<Product[]>>('/api/products', {
        query,
      })
  )

  return {
    data: computed(() => asyncData.data.value?.data ?? []),
    pending: asyncData.pending,
    error: computed(() => (asyncData.error.value ? handleApiError(asyncData.error.value) : null)),
    refresh: asyncData.refresh,
  }
}

export function useProduct(id: MaybeRefOrGetter<string>) {
  const api = useApiClient()

  const asyncData = useAsyncData<SuccessResponse<Product>>(
    () => `product:${toValue(id)}`,
    () => api.get<SuccessResponse<Product>>(`/api/products/${toValue(id)}`),
    {
      watch: [() => toValue(id)],
      immediate: true,
    }
  )

  return {
    data: computed(() => asyncData.data.value?.data ?? null),
    pending: asyncData.pending,
    error: computed(() => (asyncData.error.value ? handleApiError(asyncData.error.value) : null)),
  }
}
