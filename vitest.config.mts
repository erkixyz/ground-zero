import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/**', '**/backend/**'],
    server: {
      deps: {
        // Force CJS resolution for packages that don't resolve well as ESM in jsdom
        inline: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
      },
    },
  },
})
