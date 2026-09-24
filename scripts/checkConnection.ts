import 'dotenv/config'
import { getPrismaClient } from '../src/libs/prisma.ts'

// READ-ONLY check against the database that DATABASE_URL points to. Safe to run against
// production because it writes nothing. It uses the same runtime client as the application
// (Prisma 7 + the `pg` adapter), so it also proves the connection through the Supabase
// transaction pooler (06 section 10).
//
// The output only contains the host and counts; it never prints credentials or emails.

const EXPECTED_TABLES = [
    'application_answers',
    'applications',
    'password_reset_otps',
    'recruitment_fields',
    'recruitments',
    'sessions',
    'stored_files',
    'users',
]

type Check = { name: string; passed: boolean; detail: string }

const checks: Check[] = []

function record(name: string, passed: boolean, detail: string): void {
    checks.push({ name, passed, detail })
    console.info(`${passed ? 'OK  ' : 'FAIL'}  ${name}: ${detail}`)
}

function describeTarget(): string {
    try {
        const url = new URL(process.env.DATABASE_URL ?? '')
        return `${url.hostname}:${url.port || '5432'}`
    } catch {
        return '(DATABASE_URL cannot be parsed)'
    }
}

async function main(): Promise<void> {
    console.info(`Target: ${describeTarget()}`)
    const prisma = getPrismaClient()

    try {
        const ping = await prisma.$queryRawUnsafe<Array<{ ok: number }>>('SELECT 1 AS ok')
        record('runtime connection (pg adapter)', ping[0]?.ok === 1, 'SELECT 1 succeeded')

        const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
        )
        const found = tables.map((row) => row.tablename)
        const missing = EXPECTED_TABLES.filter((name) => !found.includes(name))
        record(
            'eight application tables',
            missing.length === 0,
            missing.length === 0 ? `${found.length} tables present` : `missing: ${missing.join(', ')}`,
        )

        const rls = await prisma.$queryRawUnsafe<Array<{ relname: string; relrowsecurity: boolean }>>(
            "SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> '_prisma_migrations'",
        )
        const withoutRls = rls.filter((row) => !row.relrowsecurity).map((row) => row.relname)
        record(
            'Row Level Security enabled',
            rls.length > 0 && withoutRls.length === 0,
            withoutRls.length === 0 ? `${rls.length} tables` : `not enabled: ${withoutRls.join(', ')}`,
        )

        const migrations = await prisma.$queryRawUnsafe<
            Array<{ migration_name: string; finished_at: Date | null }>
        >('SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at')
        const unfinished = migrations.filter((row) => row.finished_at === null)
        record(
            'migrations applied',
            migrations.length > 0 && unfinished.length === 0,
            `${migrations.length} migrations finished${unfinished.length > 0 ? `, ${unfinished.length} unfinished` : ''}`,
        )

        const admins = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
            "SELECT COUNT(*)::int AS total FROM users WHERE role = 'ADMIN'",
        )
        console.info(`INFO  admin accounts: ${admins[0]?.total ?? 0}`)
    } finally {
        await prisma.$disconnect()
    }

    if (checks.some((check) => !check.passed)) {
        process.exitCode = 1
    }
}

main().catch((error) => {
    console.error('Connection check failed:', error)
    process.exit(1)
})
