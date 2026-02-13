<script setup lang="ts">
import { withDefaults, computed, useSlots } from 'vue'
import BaseInput from '../base/Input.vue'

interface Props {
  modelValue?: string | number
  label?: string
  id?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  id: () => `form-input-${Math.random().toString(36).slice(2, 9)}`,
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
  error: '',
  hint: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const slots = useSlots()

const hasLabel = computed(() => !!props.label || slots.label)
const hasMessage = computed(() => !!props.error || !!props.hint)

const handleInput = (value: string | number) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="space-y-1">
    <label v-if="hasLabel" :for="id" class="block text-sm font-medium text-gray-700">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <BaseInput
      :id="id"
      :type="type"
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :error="!!error"
      @update:model-value="handleInput"
    >
      <template v-if="slots.prefix" #prefix>
        <slot name="prefix"></slot>
      </template>
      <template v-if="slots.suffix" #suffix>
        <slot name="suffix"></slot>
      </template>
    </BaseInput>

    <p v-if="hasMessage" :class="['text-sm', error ? 'text-danger' : 'text-gray-400']">
      {{ error || hint }}
    </p>
  </div>
</template>
