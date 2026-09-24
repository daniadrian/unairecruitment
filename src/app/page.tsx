import { redirect } from 'next/navigation'
import { getViewer } from '../views/components/guards/getViewer.ts'
import { homePathFor } from '../views/components/guards/homePath.ts'

// Home page per role (F_UNAIREC_02_03): the dashboard for admins, open roles for everyone else.
export default async function HomePage() {
    const viewer = await getViewer()
    redirect(homePathFor(viewer?.role ?? null))
}
