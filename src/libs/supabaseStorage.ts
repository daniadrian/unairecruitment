import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getStorageEnv } from './env.ts'

// L-1 and KA-08: server-only Storage client using the service-role key.
// There is no browser-side Supabase client; the `cv` and `attachments` buckets are private (KS-06).

// Bucket names as the single source of truth for FileRepository and the Storage setup script.
export const CV_BUCKET_NAME = 'cv'
export const ATTACHMENTS_BUCKET_NAME = 'attachments'

let storageClient: SupabaseClient | null = null

export function getStorageClient(): SupabaseClient {
    if (!storageClient) {
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getStorageEnv()
        storageClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
        })
    }
    return storageClient
}
