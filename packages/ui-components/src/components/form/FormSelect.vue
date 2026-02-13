<script setup lang="ts">
import { withDefaults, computed, useSlots } from 'vue'

interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  label?: string
  id?: string
  options?: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: '',
  id: () => `form-select-${Math.random().toString(36).slice(2, 9)}`,
  options: () => [],
  placeholder: '請選擇',
  required: false,
  disabled: false,
  error: '',
  hint: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const slots = useSlots()

const hasLabel = computed(() => !!props.label || slots.label)
const hasMessage = computed(() => !!props.error || !!props.hint)

const selectClasses = computed(() => {
  return [
    'block w-full rounded-md border px-3 py-2 text-sm transition-colors appearance-none bg-white pr-8', // pr-8 for arrow
    props.error
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary',
    {
      'bg-gray-100 cursor-not-allowed opacity-50': props.disabled,
    },
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedValue = target.value

  // If selected value is empty string (from placeholder), emit null
  if (selectedValue === '') {
    emit('update:modelValue', null)
    return
  }

  // Find the original option to get the correct type
  const selectedOption = props.options.find((option) => String(option.value) === selectedValue)

  if (selectedOption) {
    emit('update:modelValue', selectedOption.value)
  } else {
    // Fallback to emitting string if option not found (should not happen with proper options)
    emit('update:modelValue', selectedValue)
  }
}
</script>

<template>
  <div class="space-y-1">
    <label v-if="hasLabel" :for="id" class="block text-sm font-medium text-gray-700">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="selectClasses"
        @change="handleInput"
      >
        <option v-if="placeholder && modelValue === null" value="" disabled selected>
          {{ placeholder }}
        </option>
        <option v-else-if="placeholder && !required" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <!-- Custom Arrow -->
      <div
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
      >
        <svg
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <p v-if="hasMessage" :class="['text-sm', error ? 'text-danger' : 'text-gray-400']">
      {{ error || hint }}
    </p>
  </div>
</template>
