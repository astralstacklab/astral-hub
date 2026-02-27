<script setup lang="ts">
import { withDefaults, computed, useSlots } from 'vue'
import type { OrderStatus } from '@astral-hub/shared-types'
import { OrderStatus as OrderStatusEnum } from '@astral-hub/shared-types' // Runtime value

interface Props {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const slots = useSlots()
void slots

const statusConfig: Record<OrderStatus, { label: string; colorClass: string }> = {
  [OrderStatusEnum.PENDING]: { label: '待處理', colorClass: 'bg-gray-100 text-gray-700' },
  [OrderStatusEnum.PROCESSING]: { label: '處理中', colorClass: 'bg-info/10 text-info' },
  [OrderStatusEnum.SHIPPED]: { label: '已出貨', colorClass: 'bg-primary/10 text-primary' },
  [OrderStatusEnum.COMPLETED]: { label: '已完成', colorClass: 'bg-success/10 text-success' },
  [OrderStatusEnum.CANCELLED]: { label: '已取消', colorClass: 'bg-danger/10 text-danger' },
}

const currentStatusConfig = computed(() => {
  return (
    statusConfig[props.status] || { label: props.status, colorClass: 'bg-gray-100 text-gray-700' }
  )
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs'
    case 'md':
      return 'px-2.5 py-1 text-sm'
    case 'lg':
      return 'px-3 py-1.5 text-base'
    default:
      return 'px-2.5 py-1 text-sm'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-medium"
    :class="[currentStatusConfig.colorClass, sizeClasses]"
  >
    <slot>{{ currentStatusConfig.label }}</slot>
  </span>
</template>
