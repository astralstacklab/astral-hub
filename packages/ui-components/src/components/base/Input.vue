<script setup lang="ts">
import { withDefaults, computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  error?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  error: false,
  id: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const inputClasses = computed(() => {
  return [
    'w-full rounded-md border px-3 py-2 text-sm transition-colors',
    props.error
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary',
    {
      'bg-gray-100 cursor-not-allowed opacity-50': props.disabled,
    },
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex items-center">
    <slot name="prefix"></slot>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClasses"
      @input="handleInput"
    />
    <slot name="suffix"></slot>
  </div>
</template>
