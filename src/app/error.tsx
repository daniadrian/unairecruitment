'use client'

import ErrorScreen from '../views/components/feedback/errorScreen.tsx'

// Last-resort boundary for errors outside the route groups (for example in a group layout).
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    return <ErrorScreen error={error} retry={retry} />
}
