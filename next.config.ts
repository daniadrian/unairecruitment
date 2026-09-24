import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // The native Argon2 module must not be bundled (06 section 10).
    serverExternalPackages: ['@node-rs/argon2'],
    experimental: {
        // radix-ui re-exports every primitive from one entry; load only the ones imported.
        // (lucide-react and recharts are on Next's default list.)
        optimizePackageImports: ['radix-ui'],
        // 06 section 4: the Server Action body limit is raised but stays below
        // Vercel's 4.5 MB per-request limit. File uploads themselves use the
        // POST /api/uploads Route Handler (one request per file, KA-06).
        serverActions: {
            bodySizeLimit: '4mb',
        },
    },
}

export default nextConfig
