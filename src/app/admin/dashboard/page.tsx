import type { Metadata } from 'next'
import AdminDashboardScreen from '../../../views/screens/adminDashboardScreen.tsx'

export const metadata: Metadata = {
    title: 'Dashboard',
}

export default function DashboardPage() {
    return <AdminDashboardScreen />
}
