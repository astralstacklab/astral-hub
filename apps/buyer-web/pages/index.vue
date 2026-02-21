<template>
  <div>
    <section
      data-testid="hero-section"
      class="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-24 md:px-6"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-25 animate-grid-scroll"
      ></div>
      <div
        class="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-neon-cyan/20 blur-3xl animate-float"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-neon-magenta/20 blur-3xl animate-float [animation-delay:1.5s]"
      ></div>

      <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10">
        <div class="max-w-4xl space-y-6">
          <h1
            class="font-display text-5xl uppercase leading-none tracking-[0.08em] sm:text-6xl md:text-7xl lg:text-8xl"
          >
            <span class="block animate-glitch bg-gradient-triple bg-clip-text text-transparent"
              >COLLECT</span
            >
            <span
              class="block animate-glitch bg-gradient-triple bg-clip-text text-transparent [animation-delay:0.25s]"
              >TRADE</span
            >
            <span
              class="block animate-glitch bg-gradient-triple bg-clip-text text-transparent [animation-delay:0.5s]"
              >WIN</span
            >
          </h1>
          <p class="max-w-2xl text-base text-text-secondary sm:text-lg md:text-xl">
            The Future of Card Trading is Here
          </p>

          <div class="flex flex-col gap-4 sm:flex-row">
            <NeonButton href="/marketplace" size="lg" variant="cyan"> START TRADING </NeonButton>
            <NeonButton href="/marketplace" size="lg" variant="ghost">
              EXPLORE MARKETPLACE
            </NeonButton>
          </div>
        </div>

        <div
          data-testid="stats-bar"
          class="grid grid-cols-1 gap-4 rounded-lg border border-neon-cyan/20 bg-dark/50 p-4 backdrop-blur-sm sm:grid-cols-3"
        >
          <div class="text-center sm:text-left">
            <p class="font-mono text-2xl text-neon-cyan [text-shadow:0_0_14px_rgba(0,240,255,0.7)]">
              10K+
            </p>
            <p class="mt-1 text-xs uppercase tracking-[0.18em] text-text-secondary">Cards</p>
          </div>
          <div class="text-center sm:text-left">
            <p class="font-mono text-2xl text-neon-cyan [text-shadow:0_0_14px_rgba(0,240,255,0.7)]">
              2.5K+
            </p>
            <p class="mt-1 text-xs uppercase tracking-[0.18em] text-text-secondary">Traders</p>
          </div>
          <div class="text-center sm:text-left">
            <p class="font-mono text-2xl text-neon-cyan [text-shadow:0_0_14px_rgba(0,240,255,0.7)]">
              NT$ 5M+
            </p>
            <p class="mt-1 text-xs uppercase tracking-[0.18em] text-text-secondary">Volume</p>
          </div>
        </div>
      </div>
    </section>

    <section class="px-4 py-20 md:px-6">
      <div class="mx-auto max-w-7xl space-y-10">
        <h2
          class="font-display text-3xl uppercase tracking-[0.2em] text-neon-cyan neon-text sm:text-4xl"
        >
          WHY CHOOSE US
        </h2>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="feature in features"
            :key="feature.title"
            class="group rounded-xl border border-neon-cyan/20 bg-dark/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-neon-cyan/60 hover:shadow-neon-cyan"
          >
            <p class="text-3xl">{{ feature.icon }}</p>
            <h3 class="mt-4 text-lg font-display uppercase tracking-[0.12em] text-text-primary">
              {{ feature.title }}
            </h3>
            <p class="mt-2 text-sm leading-6 text-text-secondary">{{ feature.description }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '⚡',
    title: 'Real-Time Auctions',
    description:
      'Live bid updates and instant price movements keep every auction competitive and transparent.',
  },
  {
    icon: '🔐',
    title: 'Secure Payments',
    description:
      'Protected checkout flow with trusted payment gateways for every online and offline order.',
  },
  {
    icon: '📊',
    title: 'Market Insights',
    description:
      'Track volume, trends, and demand to make better decisions before listing or buying cards.',
  },
  {
    icon: '🏪',
    title: 'OMO Experience',
    description:
      'Seamless bridge between physical storefront and online marketplace using one card inventory.',
  },
] as const
</script>
