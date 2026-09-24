'use client'

import ErrorScreen from '../../views/components/feedback/errorScreen.tsx'

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    return <ErrorScreen error={error} retry={retry} />
}
