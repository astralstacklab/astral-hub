<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden"
  >
    <!-- Grid Background -->
    <div
      class="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-20 pointer-events-none"
    ></div>

    <!-- Content -->
    <div class="relative z-10 text-center space-y-12">
      <h1 class="text-6xl md:text-8xl font-display neon-text tracking-tighter">CARD ERP</h1>

      <p class="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto font-sans">
        這是專為收藏卡玩家設計的 OMO 交易平台。運用最新的 Nuxt 3 與 TailwindCSS
        技術，打造流暢且極具未來感的交易體驗。
      </p>

      <div class="flex flex-wrap gap-6 justify-center">
        <button class="neon-button">開始探索</button>

        <button
          class="px-8 py-4 border-2 border-neon-magenta text-neon-magenta font-display font-bold uppercase tracking-widest hover:bg-neon-magenta/10 transition-all duration-300"
        >
          查看競標
        </button>
      </div>

      <!-- Stats Example -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        <div class="p-6 border border-neon-cyan/20 bg-dark/50 backdrop-blur-sm">
          <div class="text-4xl font-mono text-neon-cyan mb-2">12,540</div>
          <div class="text-sm text-text-muted font-display uppercase tracking-widest">
            Active Listings
          </div>
        </div>
        <div class="p-6 border border-neon-magenta/20 bg-dark/50 backdrop-blur-sm">
          <div class="text-4xl font-mono text-neon-magenta mb-2">4,289</div>
          <div class="text-sm text-text-muted font-display uppercase tracking-widest">
            Traders Online
          </div>
        </div>
        <div class="p-6 border border-neon-lime/20 bg-dark/50 backdrop-blur-sm">
          <div class="text-4xl font-mono text-neon-lime mb-2">852</div>
          <div class="text-sm text-text-muted font-display uppercase tracking-widest">
            Auctions Ending
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No complex logic needed for setup mission
</script>

<style>
/* Any local overrides can go here, but most should be in tailwind.css */
</style>
