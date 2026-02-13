<script setup lang="ts">
import { withDefaults, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { AuctionStatus } from '@card-erp/shared-types'
import { AuctionStatus as AuctionStatusEnum } from '@card-erp/shared-types'

interface Props {
  endTime: Date | string
  status?: AuctionStatus
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: AuctionStatusEnum.ACTIVE,
  showLabel: true,
})

const emit = defineEmits<{
  (e: 'expired'): void
}>()

const remaining = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const isExpired = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const statusLabels: Record<AuctionStatus, string> = {
  [AuctionStatusEnum.UPCOMING]: '即將開始',
  [AuctionStatusEnum.ACTIVE]: '進行中',
  [AuctionStatusEnum.ENDED]: '已結束',
  [AuctionStatusEnum.CANCELLED]: '已取消',
}

const updateRemaining = () => {
  const end = new Date(props.endTime).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)

  if (diff === 0) {
    if (!isExpired.value) {
      // Only emit if it wasn't expired before
      isExpired.value = true
      emit('expired')
      if (timer) clearInterval(timer)
      timer = null
    }
    return
  }

  // If not expired, but was previously, reset state
  if (isExpired.value) {
    isExpired.value = false
  }

  remaining.value = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

const startTimer = () => {
  if (typeof window === 'undefined') return // SSR Guard
  if (timer) clearInterval(timer) // Clear any existing timer
  if (props.status !== AuctionStatusEnum.ACTIVE) {
    // If not active, stop timer and show status text
    isExpired.value = false // Ensure not expired if auction is not active
    return
  }
  updateRemaining() // Initial update
  timer = setInterval(updateRemaining, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => [props.endTime, props.status],
  () => {
    stopTimer()
    startTimer()
  },
  { immediate: true }
)

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

const formattedTime = computed(() => {
  if (isExpired.value) return '00:00:00'
  const h = String(remaining.value.hours).padStart(2, '0')
  const m = String(remaining.value.minutes).padStart(2, '0')
  const s = String(remaining.value.seconds).padStart(2, '0')
  return remaining.value.days > 0 ? `${remaining.value.days} 天 ${h}:${m}:${s}` : `${h}:${m}:${s}`
})

const isCriticalTime = computed(() => {
  const totalSeconds =
    remaining.value.days * 86400 +
    remaining.value.hours * 3600 +
    remaining.value.minutes * 60 +
    remaining.value.seconds
  return !isExpired.value && totalSeconds <= 300 // 5 minutes = 300 seconds
})
</script>

<template>
  <div class="inline-flex items-center gap-1">
    <slot v-if="isExpired" name="expired">
      <span class="text-sm text-gray-500">{{ statusLabels[AuctionStatusEnum.ENDED] }}</span>
    </slot>
    <template v-else-if="props.status !== AuctionStatusEnum.ACTIVE">
      <span class="text-sm text-gray-500">{{ statusLabels[props.status] }}</span>
    </template>
    <template v-else>
      <slot
        :days="remaining.days"
        :hours="remaining.hours"
        :minutes="remaining.minutes"
        :seconds="remaining.seconds"
        :is-expired="isExpired"
      >
        <span v-if="showLabel" class="text-xs text-gray-500">剩餘時間</span>
        <span
          class="font-mono text-sm font-bold"
          :class="{ 'text-danger animate-pulse': isCriticalTime }"
        >
          {{ formattedTime }}
        </span>
      </slot>
    </template>
  </div>
</template>
