// Loads .env for integration tests (vitest.integration.config.mts) so they use the same
// configuration as the application. Unit tests do not load this file.
import 'dotenv/config'

// Safeguard: integration tests TRUNCATE every application table, so they may only run
// against PostgreSQL on this machine. Remote databases (including production Supabase)
// are rejected without exception, so a mistake in .env cannot wipe real data.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

const databaseUrl = process.env.DATABASE_URL
if (databaseUrl) {
    let host: string
    try {
        host = new URL(databaseUrl).hostname
    } catch {
        throw new Error('Integration tests refused: DATABASE_URL cannot be parsed, so the host cannot be confirmed as local.')
    }

    if (!LOCAL_HOSTS.has(host)) {
        throw new Error(
            `Integration tests refused: database host "${host}" is not local. ` +
                'These tests empty every table and may only run against local PostgreSQL.',
        )
    }
}
