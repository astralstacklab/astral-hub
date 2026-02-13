<script setup lang="ts">
import { withDefaults } from 'vue'

interface Props {
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: '暫無資料',
  description: '',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <slot v-if="$slots.default"></slot>
    <template v-else>
      <div class="mb-4 text-gray-300">
        <slot name="icon">
          <!-- Default Empty Document SVG Icon -->
          <svg
            class="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h2m-2 4h2m-4 5h4m-4 5h4"
            ></path>
          </svg>
        </slot>
      </div>
      <p class="text-lg font-medium text-gray-500">{{ title }}</p>
      <p v-if="description" class="mt-1 text-sm text-gray-400">{{ description }}</p>
      <div v-if="$slots.action" class="mt-4">
        <slot name="action"></slot>
      </div>
    </template>
  </div>
</template>
