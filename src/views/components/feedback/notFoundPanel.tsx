import Link from 'next/link'
import EmptyRegister from '../brand/emptyRegister.tsx'
import { buttonVariants } from '../ui/button.tsx'

// 404 content: the page or record does not exist (for example an unknown recruitment ID).
export default function NotFoundPanel({ area }: { area: 'public' | 'admin' }) {
    return (
        <div className="px-3 py-8 sm:px-6 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-[1104px]">
                <EmptyRegister
                    title="This page doesn't exist."
                    action={
                        area === 'admin' ? (
                            <Link href="/admin/dashboard" className={buttonVariants({ size: 'lg' })}>
                                Go to the dashboard
                            </Link>
                        ) : (
                            <Link href="/recruitments" className={buttonVariants({ size: 'lg' })}>
                                Browse open roles
                            </Link>
                        )
                    }
                >
                    <p>
                        The link may be mistyped, or the page may have moved. Check the address, or start
                        again from the {area === 'admin' ? 'dashboard' : 'list of open roles'}.
                    </p>
                </EmptyRegister>
            </div>
        </div>
    )
}
