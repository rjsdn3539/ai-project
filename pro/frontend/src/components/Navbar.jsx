import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

function Navbar() {
  const { user, logout } = useAuthStore()
  const { items } = useCartStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: '56px', background: '#4f46e5', color: '#fff',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link to="/dashboard" style={{ color: '#fff', fontWeight: '700', fontSize: '18px', textDecoration: 'none' }}>
        AI 면접 플랫폼
      </Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px' }}>
        <Link to="/interview/setup" style={{ color: '#e0e7ff', textDecoration: 'none' }}>면접</Link>
        <Link to="/learning" style={{ color: '#e0e7ff', textDecoration: 'none' }}>학습</Link>
        <Link to="/books" style={{ color: '#e0e7ff', textDecoration: 'none' }}>도서</Link>
        <Link to="/cart" style={{ color: '#e0e7ff', textDecoration: 'none', position: 'relative' }}>
          🛒
          {items.length > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-10px',
              background: '#ef4444', borderRadius: '50%', padding: '1px 5px', fontSize: '11px',
            }}>
              {items.length}
            </span>
          )}
        </Link>
        {user?.role === 'ADMIN' && (
          <Link to="/admin" style={{ color: '#fde68a', textDecoration: 'none' }}>관리자</Link>
        )}
        <span style={{ color: '#c7d2fe' }}>{user?.name || '사용자'}</span>
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #a5b4fc', borderRadius: '6px', color: '#e0e7ff', padding: '4px 12px', cursor: 'pointer', fontSize: '13px' }}>
          로그아웃
        </button>
      </div>
    </nav>
  )
}

export default Navbar
