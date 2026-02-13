<script setup lang="ts">
import { withDefaults, computed } from 'vue'

interface Props {
  padding?: boolean
  hoverable?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: true,
  hoverable: false,
  bordered: true,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const cardClasses = computed(() => {
  return [
    'rounded-lg bg-white',
    { 'border border-gray-200': props.bordered },
    { 'p-4': props.padding },
    { 'cursor-pointer hover:shadow-md transition-shadow': props.hoverable },
  ]
})

const handleClick = (event: MouseEvent) => {
  if (props.hoverable) {
    emit('click', event)
  }
}
</script>

<template>
  <div :class="cardClasses" @click="handleClick">
    <div v-if="$slots.header" class="border-b border-gray-200">
      <slot name="header"></slot>
    </div>
    <slot></slot>
    <div v-if="$slots.footer" class="border-t border-gray-200">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
