import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    include: ['tests/**/*.test.ts'],
    // In tests: clear DATABASE_URL and REDIS_URL so the in-memory fallback is used.
    // No PostgreSQL or Redis is required to run the full test suite.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: '',
      REDIS_URL: '',
      GOOGLE_API_KEY: 'mock',
      GITHUB_WEBHOOK_SECRET: 'test-webhook-secret',
    },
  },
});
