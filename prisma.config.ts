import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7 moved the datasource URL from schema.prisma to this file.
// Migrate and seed use DIRECT_URL (session pooler, KS-04); the application runtime
// uses DATABASE_URL through the `pg` adapter in src/libs/prisma.ts.
export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
    },
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
})
