<template>
  <div
    v-if="visible"
    class="flex items-start justify-between gap-4 border border-error bg-[rgba(255,0,85,0.1)] p-4 text-error"
    role="alert"
  >
    <p class="text-sm leading-6">
      {{ message }}
    </p>

    <button
      v-if="dismissible"
      type="button"
      aria-label="Dismiss error"
      class="shrink-0 text-error transition-opacity duration-200 hover:opacity-70"
      @click="handleDismiss"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  message: string
  dismissible?: boolean
}

withDefaults(defineProps<Props>(), {
  dismissible: true,
})

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(true)

const handleDismiss = (): void => {
  visible.value = false
  emit('dismiss')
}
</script>

<style scoped>
div[role='alert'] {
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.3);
}
</style>
