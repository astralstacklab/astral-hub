<template>
  <div class="space-y-3">
    <div
      class="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-neon-cyan/20 bg-dark/50 p-2"
      @click="openLightbox"
    >
      <img
        v-if="activeImage"
        :src="activeImage"
        alt="Product image"
        class="h-full w-full object-contain"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-text-secondary/60"
        aria-label="No image available"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="h-14 w-14"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <path d="M21 15 16 10 5 21" />
        </svg>
      </div>
    </div>

    <div v-if="images.length > 1" class="grid grid-cols-4 gap-2">
      <button
        v-for="(image, index) in images"
        :key="`image-${index}`"
        type="button"
        class="relative aspect-square overflow-hidden rounded border bg-dark/40 p-1 transition-all duration-300"
        :class="
          index === activeIndex
            ? 'border-neon-cyan shadow-neon-cyan'
            : 'border-neon-cyan/20 hover:border-neon-cyan/60'
        "
        @click="activeIndex = index"
      >
        <img :src="image" :alt="`Thumbnail ${index + 1}`" class="h-full w-full object-cover" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen && activeImage"
        data-testid="lightbox"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
        @click.self="closeLightbox"
      >
        <button
          data-testid="lightbox-close"
          type="button"
          class="absolute right-4 top-4 rounded border border-neon-cyan/30 px-3 py-2 text-xs font-display uppercase tracking-[0.12em] text-text-primary transition-all duration-300 hover:border-neon-cyan hover:text-neon-cyan hover:shadow-neon-cyan"
          @click="closeLightbox"
        >
          X
        </button>
        <img
          :src="activeImage"
          alt="Lightbox image"
          class="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  images: string[]
}

const props = defineProps<Props>()

const activeIndex = ref(0)
const lightboxOpen = ref(false)

const activeImage = computed(() => props.images[activeIndex.value] ?? null)

const closeLightbox = () => {
  lightboxOpen.value = false
}

const openLightbox = () => {
  if (!activeImage.value) {
    return
  }

  lightboxOpen.value = true
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeLightbox()
  }
}

watch(
  () => props.images,
  (nextImages) => {
    if (nextImages.length === 0) {
      activeIndex.value = 0
      closeLightbox()
      return
    }

    if (activeIndex.value >= nextImages.length) {
      activeIndex.value = 0
    }
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>
