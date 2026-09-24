import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client/client.ts'
import { getDatabaseEnv } from './env.ts'

// L-1: one data client configuration for the whole application.
// KS-04: Prisma 7 with the `pg` driver adapter; DATABASE_URL uses the transaction pooler.
// The client is created on first use so importing the module does not require .env.

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient }

export function getPrismaClient(): PrismaClient {
    if (!globalForPrisma.prismaClient) {
        const adapter = new PrismaPg({ connectionString: getDatabaseEnv().DATABASE_URL })
        globalForPrisma.prismaClient = new PrismaClient({ adapter })
    }
    return globalForPrisma.prismaClient
}
