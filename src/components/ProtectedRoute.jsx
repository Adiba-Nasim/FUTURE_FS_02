import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'


/**
 * Wraps a route and redirects if the user is not authenticated
 * or doesn't have the required role.
 *
 * Usage:
 *   <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
 *   <Route path="/cook/dashboard" element={<ProtectedRoute allowedRoles={['cook']}><CookDashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading, restoreSession } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'serif',
        fontSize: '1.2rem',
        color: '#7c5c3e'
      }}>
        Checking access...
      </div>
    )
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Logged in but wrong role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}