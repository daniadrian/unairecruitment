import { defineConfig } from 'vitest/config'

// Unit tests: do not load .env and never touch the database.
// Integration tests (*.integration.test.ts) run separately through `npm run test:integration`
// because they empty the tables of the database that DATABASE_URL points to.
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
    },
})
