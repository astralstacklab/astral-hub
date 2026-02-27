import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AstralHubUiComponents',
      fileName: 'ui-components',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@astral-hub/shared-types'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
