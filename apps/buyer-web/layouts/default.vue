<template>
  <div class="min-h-screen bg-black text-text-primary">
    <header class="sticky top-0 z-50 border-b border-neon-cyan/20 bg-black/80 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <NuxtLink
          to="/"
          class="font-display text-xl tracking-[0.2em] text-neon-cyan neon-text"
          @click="closeMenu"
        >
          CARD ERP
        </NuxtLink>

        <nav class="hidden items-center gap-8 md:flex" aria-label="Primary">
          <NuxtLink
            to="/marketplace"
            class="text-sm uppercase tracking-[0.18em] text-text-secondary transition-colors hover:text-neon-cyan"
          >
            商城
          </NuxtLink>
          <NuxtLink
            to="/auctions"
            class="text-sm uppercase tracking-[0.18em] text-text-secondary transition-colors hover:text-neon-cyan"
          >
            競標
          </NuxtLink>
          <NuxtLink
            to="/orders"
            class="text-sm uppercase tracking-[0.18em] text-text-secondary transition-colors hover:text-neon-cyan"
          >
            我的訂單
          </NuxtLink>
          <NuxtLink
            to="/cart"
            class="relative rounded-full border border-neon-cyan/30 p-2 text-neon-cyan transition-colors hover:bg-neon-cyan/10"
            aria-label="Shopping cart"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="9" cy="20" r="1.8" />
              <circle cx="18" cy="20" r="1.8" />
              <path d="M2.5 3h3l2.4 11h10.7l2-8H6.2" />
            </svg>
            <span
              class="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon-magenta px-1 text-[10px] font-bold text-black"
            >
              2
            </span>
          </NuxtLink>
        </nav>

        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded border border-neon-cyan/30 text-neon-cyan transition-colors hover:bg-neon-cyan/10 md:hidden"
          aria-label="Toggle menu"
          @click="toggleMenu"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </div>

      <div
        v-if="isMenuOpen"
        class="fixed inset-0 z-50 border-t border-neon-cyan/30 bg-black/95 px-6 py-20 md:hidden"
      >
        <div class="mx-auto flex max-w-md flex-col gap-8">
          <NuxtLink
            to="/marketplace"
            class="font-display text-2xl uppercase tracking-[0.2em] text-neon-cyan"
            @click="closeMenu"
          >
            商城
          </NuxtLink>
          <NuxtLink
            to="/auctions"
            class="font-display text-2xl uppercase tracking-[0.2em] text-neon-cyan"
            @click="closeMenu"
          >
            競標
          </NuxtLink>
          <NuxtLink
            to="/orders"
            class="font-display text-2xl uppercase tracking-[0.2em] text-neon-cyan"
            @click="closeMenu"
          >
            我的訂單
          </NuxtLink>
          <NuxtLink
            to="/cart"
            class="font-display text-2xl uppercase tracking-[0.2em] text-neon-magenta"
            @click="closeMenu"
          >
            購物車 (2)
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="border-t border-neon-cyan/20 bg-black">
      <div
        class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center md:flex-row md:px-6 md:text-left"
      >
        <p class="font-display text-sm tracking-[0.2em] text-neon-cyan">CARD ERP</p>
        <p class="text-xs text-text-secondary">2026 Card ERP. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const isMenuOpen = ref(false)
const route = useRoute()

const closeMenu = (): void => {
  isMenuOpen.value = false
}

const toggleMenu = (): void => {
  isMenuOpen.value = !isMenuOpen.value
}

const onEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

watch(() => route.fullPath, closeMenu)

onMounted(() => {
  window.addEventListener('keydown', onEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape)
})
</script>
