<script setup lang="ts">
import { withDefaults, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  message?: string
  duration?: number
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  message: '',
  duration: 3000,
  closable: true,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isVisible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const closeToast = () => {
  isVisible.value = false
  emit('close')
}

const startTimer = () => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      closeToast()
    }, props.duration)
  }
}

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

watch(
  () => props.message,
  (newMessage) => {
    if (newMessage) {
      isVisible.value = true
      clearTimer()
      startTimer()
    }
  }
)

onMounted(() => {
  if (props.message) {
    isVisible.value = true
    startTimer()
  }
})

onUnmounted(() => {
  clearTimer()
})

const typeClasses = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  warning: 'bg-warning text-white',
  info: 'bg-info text-white',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div
        v-if="isVisible"
        :class="[
          'fixed top-4 right-4 z-50 flex items-center justify-between p-4 rounded-lg shadow-lg',
          typeClasses[type],
        ]"
        role="alert"
        aria-live="polite"
      >
        <span>{{ message }}</span>
        <button v-if="closable" class="ml-4 text-white" @click="closeToast">
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
