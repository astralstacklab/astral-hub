import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CardErpUiComponents',
      fileName: 'ui-components',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@card-erp/shared-types'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
