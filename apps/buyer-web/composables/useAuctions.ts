import type { Auction, SuccessResponse } from '@card-erp/shared-types'
import type { MaybeRefOrGetter } from 'vue'
import type { AuctionListQuery, PlaceBidPayload } from '~/types'
import { readonly, toValue } from 'vue'

interface PlaceBidResponse {
  id: string
  auctionId: string
  bidderId: string
  maxBid: number
  currentPrice: number
  isActive: boolean
  createdAt: string
}

export function useAuctions(query: AuctionListQuery = {}) {
  const api = useApiClient()

  const asyncData = useAsyncData<SuccessResponse<Auction[]>>(
    () => `auctions:${JSON.stringify(query)}`,
    () =>
      api.get<SuccessResponse<Auction[]>>('/api/auctions', {
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

export function useAuction(id: MaybeRefOrGetter<string>) {
  const api = useApiClient()

  const asyncData = useAsyncData<SuccessResponse<Auction>>(
    () => `auction:${toValue(id)}`,
    () => api.get<SuccessResponse<Auction>>(`/api/auctions/${toValue(id)}`),
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

export function usePlaceBid() {
  const api = useApiClient()
  const pending = ref(false)
  const error = ref<string | null>(null)

  const execute = async (payload: PlaceBidPayload): Promise<PlaceBidResponse | null> => {
    pending.value = true
    error.value = null

    try {
      const response = await api.post<SuccessResponse<PlaceBidResponse>>(
        `/api/auctions/${payload.auctionId}/bid`,
        { maxBid: payload.amount }
      )

      return response.data
    } catch (err: unknown) {
      error.value = handleApiError(err)
      return null
    } finally {
      pending.value = false
    }
  }

  return {
    execute,
    pending: readonly(pending),
    error: readonly(error),
  }
}
