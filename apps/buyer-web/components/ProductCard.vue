<template>
  <article
    class="group overflow-hidden rounded-xl border border-neon-cyan/20 bg-dark/50 backdrop-blur-sm transition-all duration-300 hover:border-neon-cyan/60 hover:shadow-neon-cyan"
  >
    <NuxtLink
      :to="`/products/${product.id}`"
      class="block relative aspect-square overflow-hidden border-b border-neon-cyan/10"
    >
      <img
        v-if="hasImage"
        :src="primaryImageUrl"
        :alt="product.name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-black/30 text-text-secondary/60"
        aria-label="No image available"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="h-14 w-14"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <path d="M21 15 16 10 5 21" />
        </svg>
      </div>

      <span
        v-if="statusLabel"
        class="absolute right-2 top-2 rounded bg-neon-magenta px-2 py-0.5 text-xs text-black"
      >
        {{ statusLabel }}
      </span>
    </NuxtLink>

    <div class="space-y-3 p-4">
      <p class="text-xs uppercase tracking-[0.12em] text-text-secondary">{{ product.category }}</p>
      <NuxtLink :to="`/products/${product.id}`">
        <h3
          class="line-clamp-2 min-h-[3rem] text-base font-display tracking-[0.12em] text-text-primary transition-colors hover:text-neon-cyan"
        >
          {{ product.name }}
        </h3>
      </NuxtLink>
      <div class="flex items-center justify-between gap-3">
        <p class="font-mono text-neon-cyan [text-shadow:0_0_14px_rgba(0,240,255,0.7)]">
          NT$ {{ formattedPrice }}
        </p>
        <NeonButton
          v-if="product.status === 'LISTED'"
          size="sm"
          variant="cyan"
          @click.prevent="addToCart"
        >
          加入購物車
        </NeonButton>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@card-erp/shared-types'
import { useCartStore } from '~/stores/cart'

const props = defineProps<{
  product: Product
}>()

const cartStore = useCartStore()

const formattedPrice = computed(() =>
  new Intl.NumberFormat('zh-TW').format(props.product.sellingPrice)
)
const primaryImageUrl = computed(() => props.product.images[0]?.url ?? '')
const hasImage = computed(() => primaryImageUrl.value.length > 0)

const statusLabel = computed(() => {
  if (props.product.status === 'SOLD') {
    return '已售出'
  }

  if (props.product.status === 'PENDING') {
    return '待上架'
  }

  return null
})

const addToCart = () => {
  cartStore.addItem(props.product)
}
</script>
