<template>
  <div role="status" aria-live="polite" :class="containerClasses">
    <span class="sr-only">Loading</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-[3px]',
  lg: 'h-14 w-14 border-4',
}

const containerClasses = computed(() => [
  'inline-block animate-spin rounded-full border-neon-cyan border-t-transparent shadow-neon-cyan',
  sizeClasses[props.size],
])
</script>
