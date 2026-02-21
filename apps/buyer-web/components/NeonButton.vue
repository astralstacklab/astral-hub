<template>
  <component :is="componentTag" :to="href" :class="buttonClasses">
    <span class="relative z-10">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'cyan' | 'magenta' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'cyan',
  size: 'md',
  href: undefined,
})

const componentTag = computed(() => (props.href ? 'NuxtLink' : 'button'))

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  cyan: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan',
  magenta:
    'border-neon-magenta text-neon-magenta hover:bg-neon-magenta/10 hover:shadow-neon-magenta',
  ghost:
    'border-text-secondary/30 text-text-secondary hover:border-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan',
}

const buttonClasses = computed(() => [
  'neon-sweep relative inline-flex items-center justify-center overflow-hidden border bg-transparent font-display font-bold uppercase tracking-[0.2em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60',
  sizeClasses[props.size],
  variantClasses[props.variant],
])
</script>

<style scoped>
.neon-sweep::before {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 500ms ease;
}

.neon-sweep:hover::before {
  left: 120%;
}
</style>
