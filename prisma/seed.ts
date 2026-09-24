import 'dotenv/config'
import { hash } from '@node-rs/argon2'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/client/client.ts'

// AB-08: the admin account is provisioned by the seed; there is no admin registration.
// Values come from environment variables and are never written in any document (L-2).

function requireEnv(name: string): string {
    const value = process.env[name]
    if (!value || value.trim() === '') {
        throw new Error(`Missing environment variable: ${name}`)
    }
    return value
}

async function main(): Promise<void> {
    const connectionString = requireEnv('DIRECT_URL')
    const name = requireEnv('ADMIN_NAME')
    const email = requireEnv('ADMIN_EMAIL').trim().toLowerCase()
    const password = requireEnv('ADMIN_PASSWORD')

    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

    try {
        const passwordHash = await hash(password)
        const admin = await prisma.user.upsert({
            where: { email },
            update: { name, passwordHash, role: 'ADMIN' },
            create: { name, email, passwordHash, role: 'ADMIN' },
        })
        console.info(`Admin account ready: ${admin.email}`)
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
})
