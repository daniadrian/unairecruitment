import { defineConfig } from 'vitest/config'

// Integration tests against a real database. WARNING: these tests TRUNCATE every
// application table, so DATABASE_URL in .env must only point to a development database.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.integration.test.ts'],
        setupFiles: ['./vitest.setup.ts'],
        // All files share one database, so they do not run in parallel.
        fileParallelism: false,
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
})
