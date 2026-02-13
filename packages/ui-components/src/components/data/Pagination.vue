<script setup lang="ts">
import { withDefaults, computed } from 'vue'

interface Props {
  currentPage?: number
  totalPages?: number
  totalItems?: number
  pageSize?: number
  siblingCount?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 20,
  siblingCount: 1,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const goToPage = (page: number) => {
  if (page > 0 && page <= props.totalPages && page !== props.currentPage && !props.disabled) {
    emit('update:currentPage', page)
  }
}

const paginationRange = computed(() => {
  const range = []
  const startPage = Math.max(1, props.currentPage - props.siblingCount)
  const endPage = Math.min(props.totalPages, props.currentPage + props.siblingCount)

  if (startPage > 1) {
    range.push(1)
    if (startPage > 2) {
      range.push('...')
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i)
  }

  if (endPage < props.totalPages) {
    if (endPage < props.totalPages - 1) {
      range.push('...')
    }
    range.push(props.totalPages)
  }
  return range
})

const startItem = computed(() => (props.currentPage - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.currentPage * props.pageSize, props.totalItems))
</script>

<template>
  <div class="flex items-center justify-between">
    <!-- Info Slot -->
    <div class="text-sm text-gray-700">
      <slot
        name="info"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
      >
        <span v-if="totalItems > 0">
          第 {{ startItem }}-{{ endItem }} 筆，共 {{ totalItems }} 筆
        </span>
        <span v-else>共 0 筆</span>
      </slot>
    </div>

    <!-- Pagination Buttons -->
    <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
      <button
        type="button"
        class="relative inline-flex items-center justify-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        :class="{ 'opacity-50 cursor-not-allowed': disabled || currentPage === 1 }"
        :disabled="disabled || currentPage === 1"
        @click="goToPage(1)"
      >
        <span class="sr-only">First</span>
        «
      </button>
      <button
        type="button"
        class="relative inline-flex items-center justify-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        :class="{ 'opacity-50 cursor-not-allowed': disabled || currentPage === 1 }"
        :disabled="disabled || currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        <span class="sr-only">Previous</span>
        ‹
      </button>

      <template v-for="(page, index) in paginationRange" :key="index">
        <span
          v-if="page === '...'"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >...</span
        >
        <button
          v-else
          type="button"
          class="relative inline-flex items-center justify-center w-8 h-8 border text-sm font-medium"
          :class="[
            page === currentPage
              ? 'z-10 bg-primary text-white border-primary'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100',
            { 'opacity-50 cursor-not-allowed': disabled },
          ]"
          :disabled="disabled"
          @click="goToPage(page as number)"
        >
          {{ page }}
        </button>
      </template>

      <button
        type="button"
        class="relative inline-flex items-center justify-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        :class="{ 'opacity-50 cursor-not-allowed': disabled || currentPage === totalPages }"
        :disabled="disabled || currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        <span class="sr-only">Next</span>
        ›
      </button>
      <button
        type="button"
        class="relative inline-flex items-center justify-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        :class="{ 'opacity-50 cursor-not-allowed': disabled || currentPage === totalPages }"
        :disabled="disabled || currentPage === totalPages"
        @click="goToPage(totalPages)"
      >
        <span class="sr-only">Last</span>
        »
      </button>
    </nav>
  </div>
</template>
