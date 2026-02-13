<script setup lang="ts">
import { withDefaults, computed, watch, onUnmounted } from 'vue'

interface Props {
  modelValue?: boolean
  title?: string
  closable?: boolean
  closeOnOverlay?: boolean
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  closable: true,
  closeOnOverlay: true,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const closeModal = () => {
  emit('update:modelValue', false)
  emit('close')
}

const modalSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-sm'
    case 'md':
      return 'max-w-md'
    case 'lg':
      return 'max-w-lg'
    case 'full':
      return 'max-w-full mx-4'
    default:
      return 'max-w-md'
  }
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleEscape)
      } else {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleEscape)
      }
    }
  },
  { immediate: true }
)

const handleEscape = (e: KeyboardEvent) => {
  if (props.closable && e.key === 'Escape') {
    closeModal()
  }
}

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleEscape)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/50 transition-opacity"
          @click="closeOnOverlay && closeModal()"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative w-full rounded-lg bg-white shadow-xl transform transition-all"
          :class="modalSizeClasses"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
        >
          <!-- Header -->
          <div
            v-if="title || closable || $slots.header"
            class="flex items-center justify-between p-4 border-b border-gray-200"
          >
            <slot name="header">
              <h3 v-if="title" id="modal-title" class="text-lg font-medium text-gray-900">
                {{ title }}
              </h3>
              <button
                v-if="closable"
                type="button"
                class="text-gray-400 hover:text-gray-500"
                @click="closeModal"
              >
                <span class="sr-only">Close</span>
                <svg
                  class="h-6 w-6"
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
            </slot>
          </div>

          <!-- Body -->
          <div class="p-4">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex justify-end p-4 border-t border-gray-200">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
