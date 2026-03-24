import { Outlet, Navigate } from 'react-router-dom'
import Navbar from './Navbar'
import useAuthStore from '../store/authStore'

function Layout() {
  const { accessToken } = useAuthStore()
  if (!accessToken) return <Navigate to="/auth/login" replace />
  return (
    <div>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
