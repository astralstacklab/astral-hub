<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1" aria-label="Pagination">
    <button
      type="button"
      :disabled="currentPage <= 1"
      class="rounded border border-neon-cyan/20 bg-dark/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-neon-cyan/60 hover:text-neon-cyan disabled:cursor-not-allowed disabled:opacity-30"
      @click="goToPreviousPage"
    >
      ‹
    </button>

    <template v-for="(page, index) in visiblePages" :key="`page-${index}`">
      <span v-if="page === 'ellipsis'" class="px-2 text-text-secondary">…</span>
      <NeonButton
        v-else
        :variant="page === currentPage ? 'cyan' : 'ghost'"
        size="sm"
        @click="emit('page-change', page as number)"
      >
        {{ page }}
      </NeonButton>
    </template>

    <button
      type="button"
      :disabled="currentPage >= totalPages"
      class="rounded border border-neon-cyan/20 bg-dark/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-neon-cyan/60 hover:text-neon-cyan disabled:cursor-not-allowed disabled:opacity-30"
      @click="goToNextPage"
    >
      ›
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

type VisiblePage = number | 'ellipsis'

const visiblePages = computed<VisiblePage[]>(() => {
  if (props.totalPages <= 7) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1)
  }

  const pages: VisiblePage[] = [1]

  if (props.currentPage > 3) {
    pages.push('ellipsis')
  }

  const neighbors = [props.currentPage - 1, props.currentPage, props.currentPage + 1].filter(
    (page) => page > 1 && page < props.totalPages
  )

  pages.push(...neighbors)

  if (props.currentPage < props.totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(props.totalPages)

  return pages
})

const goToPreviousPage = () => {
  if (props.currentPage <= 1) {
    return
  }

  emit('page-change', props.currentPage - 1)
}

const goToNextPage = () => {
  if (props.currentPage >= props.totalPages) {
    return
  }

  emit('page-change', props.currentPage + 1)
}
</script>
