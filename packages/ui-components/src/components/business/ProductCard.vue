<script setup lang="ts">
import { withDefaults, computed } from 'vue'
import type { Product } from '@card-erp/shared-types'
import { GradingStatus as GradingStatusEnum } from '@card-erp/shared-types' // Import runtime object
import BaseCard from '../base/Card.vue'

interface Props {
  product: Product
  compact?: boolean
  showPrice?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showPrice: true,
})

const emit = defineEmits<{
  (e: 'click', product: Product): void
}>()

const imageUrl = computed(() => {
  return props.product.images?.[0]?.url || null
})

const gradingStatusLabel = computed(() => {
  if (!props.product.gradingStatus || props.product.gradingStatus === GradingStatusEnum.RAW) {
    return '未鑑定'
  }
  // If it's graded (PSA, ARS, BGS)
  return `${props.product.gradingStatus}${props.product.gradingScore ? ` ${props.product.gradingScore}` : ''}`
})

const gradingStatusColorClass = computed(() => {
  if (!props.product.gradingStatus || props.product.gradingStatus === GradingStatusEnum.RAW) {
    return 'bg-gray-500 text-white' // Ungraded color
  }
  return 'bg-warning text-white' // Graded color (from mission spec)
})
</script>

<template>
  <BaseCard hoverable :padding="!compact" @click="emit('click', product)">
    <!-- Image area -->
    <div
      class="relative overflow-hidden rounded-t-lg"
      :class="{ 'aspect-[4/3]': !compact, 'aspect-[1/1]': compact }"
    >
      <slot name="image">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="product.name"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400"
        >
          無圖片
        </div>
      </slot>
      <!-- Grading badge -->
      <slot name="badge">
        <span
          v-if="gradingStatusLabel"
          class="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold"
          :class="gradingStatusColorClass"
        >
          {{ gradingStatusLabel }}
        </span>
      </slot>
    </div>

    <!-- Info area -->
    <div :class="{ 'p-3': !compact, 'p-2': compact }">
      <h3
        class="font-medium text-gray-900 line-clamp-2"
        :class="{ 'text-sm': !compact, 'text-xs': compact }"
      >
        {{ product.name }}
      </h3>
      <p v-if="!compact" class="text-xs text-gray-500 mt-1">{{ product.category }}</p>
      <p
        v-if="showPrice"
        class="font-bold text-primary mt-2"
        :class="{ 'text-base': !compact, 'text-sm': compact }"
      >
        NT$ {{ product.sellingPrice }}
      </p>
    </div>

    <slot name="footer" />
  </BaseCard>
</template>
