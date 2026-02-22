<template>
  <aside
    class="space-y-5 rounded-xl border border-neon-cyan/20 bg-dark/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-neon-cyan/60 hover:shadow-neon-cyan"
  >
    <h3 class="font-display text-sm uppercase tracking-[0.12em] text-neon-cyan">Filter</h3>

    <div class="space-y-2">
      <label class="text-xs uppercase tracking-[0.12em] text-text-secondary">類別</label>
      <select
        v-model="categoryValue"
        class="w-full appearance-none border border-neon-cyan/20 bg-transparent px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:border-neon-cyan focus:outline-none rounded"
      >
        <option value="">All</option>
        <option value="Pokemon">Pokemon</option>
        <option value="OnePiece">OnePiece</option>
        <option value="YuGiOh">YuGiOh</option>
        <option value="Baseball">Baseball</option>
      </select>
    </div>

    <div class="space-y-2">
      <label class="text-xs uppercase tracking-[0.12em] text-text-secondary">狀態</label>
      <select
        v-model="statusValue"
        class="w-full appearance-none border border-neon-cyan/20 bg-transparent px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:border-neon-cyan focus:outline-none rounded"
      >
        <option value="">All</option>
        <option value="LISTED">Available</option>
        <option value="SOLD">Sold</option>
      </select>
    </div>

    <div class="space-y-2">
      <label class="text-xs uppercase tracking-[0.12em] text-text-secondary">價格</label>
      <div class="grid grid-cols-2 gap-2">
        <input
          :value="localFilters.minPrice ?? ''"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Min"
          class="w-full rounded border border-neon-cyan/20 bg-transparent px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:border-neon-cyan focus:outline-none"
          @input="onPriceInput('minPrice', $event)"
        />
        <input
          :value="localFilters.maxPrice ?? ''"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Max"
          class="w-full rounded border border-neon-cyan/20 bg-transparent px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:border-neon-cyan focus:outline-none"
          @input="onPriceInput('maxPrice', $event)"
        />
      </div>
    </div>

    <NeonButton variant="ghost" size="sm" @click="resetFilters"> Reset Filters </NeonButton>
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { ProductListQuery } from '~/types'

const props = defineProps<{
  filters: ProductListQuery
}>()

const emit = defineEmits<{
  'update:filters': [filters: ProductListQuery]
}>()

const localFilters = reactive<ProductListQuery>({
  ...props.filters,
})

watch(
  () => props.filters,
  (nextFilters) => {
    Object.assign(localFilters, nextFilters)
  },
  { deep: true }
)

watch(
  localFilters,
  (value) => {
    emit('update:filters', { ...value })
  },
  { deep: true }
)

const categoryValue = computed({
  get: () => localFilters.category ?? '',
  set: (value: string) => {
    localFilters.category = value || undefined
  },
})

const statusValue = computed({
  get: () => localFilters.status ?? '',
  set: (value: string) => {
    localFilters.status = value || undefined
  },
})

const onPriceInput = (field: 'minPrice' | 'maxPrice', event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.trim()

  if (value.length === 0) {
    localFilters[field] = undefined
    return
  }

  const numericValue = Number(value)
  localFilters[field] = Number.isFinite(numericValue) ? numericValue : undefined
}

const resetFilters = () => {
  localFilters.page = undefined
  localFilters.limit = undefined
  localFilters.search = undefined
  localFilters.category = undefined
  localFilters.status = undefined
  localFilters.minPrice = undefined
  localFilters.maxPrice = undefined
}
</script>
