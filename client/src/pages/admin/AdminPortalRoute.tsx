import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AdminDashboard from './Dashboard'

/**
 * Portal /admin chỉ mở cho role admin/staff.
 * Role được backend (/api/auth/exchange) quyết định — không phải client.
 */
export default function AdminPortalRoute() {
  const { user } = useAuth()

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return <Navigate to="/account" replace />
  }

  return <AdminDashboard />
}
