import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/webroot/js/**/*.test.ts'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/webroot/js/**/*.ts'],
      exclude: ['src/webroot/js/**/*.test.ts', 'src/webroot/js/i18n.ts'],
    },
  },
})
