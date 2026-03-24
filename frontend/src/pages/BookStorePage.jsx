import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as bookApi from '../api/book'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import Button from '../components/Button'
import { getBookRatingSummary } from '../utils/bookReviews'

const MOCK_BOOKS = [
  { id: 1, title: '클린 코드', author: '로버트 마틴', price: 32000, stock: 10, coverUrl: '' },
  { id: 2, title: '개발자를 위한 면접 교과서', author: '이동욱', price: 28000, stock: 5, coverUrl: '' },
  { id: 3, title: '자바스크립트 완벽 가이드', author: 'David Flanagan', price: 45000, stock: 8, coverUrl: '' },
  { id: 4, title: 'Spring Boot 실전', author: '김영한', price: 38000, stock: 3, coverUrl: '' },
  { id: 5, title: '알고리즘 문제 풀이 전략', author: '구종만', price: 40000, stock: 6, coverUrl: '' },
  { id: 6, title: '면접을 위한 CS 전공지식', author: '주홍철', price: 35000, stock: 0, coverUrl: '' },
]

const BOOK_COLORS = ['var(--bg-purple)', 'var(--bg-indigo)', 'var(--bg-success)', 'var(--border-warning)', 'var(--border-error)', 'var(--border-indigo)']

function BookCard({ book, onAddCart, onNavigate, onLoginRequired }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded]   = useState(false)
  const colorIdx = (book.id - 1) % BOOK_COLORS.length
  const bgColor  = BOOK_COLORS[colorIdx]
  const rating   = getBookRatingSummary(book.id)

  const handleAdd = (e) => {
    e.stopPropagation()
    if (onLoginRequired()) return
    try {
      onAddCart(book.id, 1, { title: book.title, author: book.author, price: book.price })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {
      alert('장바구니 추가에 실패했습니다.')
    }
  }

  return (
    <div
      onClick={() => onNavigate(book.id)}
      style={{
        background: 'var(--surface)', borderRadius: 16, overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
        transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      {/* Cover */}
      <div style={{
        height: 180, background: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 56, flexShrink: 0, position: 'relative',
      }}>
        📚
        {book.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: '#e05252', color: '#fff', borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 800 }}>품절</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>{book.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>{book.author}</p>
        {rating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#f5c518' }}>{'★'.repeat(Math.round(Number(rating.avg)))}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{rating.avg}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({rating.count})</span>
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>리뷰 없음</span>
          </div>
        )}
        <p style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 20, marginBottom: 14, marginTop: 'auto' }}>
          {book.price.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>원</span>
        </p>
        <button
          onClick={handleAdd}
          disabled={adding || book.stock === 0}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            background: added ? 'var(--success)' : book.stock === 0 ? 'var(--bg)' : 'var(--primary)',
            color: book.stock === 0 ? 'var(--text-muted)' : '#fff',
            cursor: book.stock === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          {adding ? '추가 중...' : added ? '✓ 담겼습니다' : book.stock === 0 ? '품절' : '🛒 장바구니 담기'}
        </button>
      </div>
    </div>
  )
}

function BookStorePage() {
  const [books, setBooks]   = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [focused, setFocused] = useState(false)
  const [loginToast, setLoginToast] = useState(false)
  const { addItem } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const requireLogin = () => {
    if (!user) {
      setLoginToast(true)
      setTimeout(() => setLoginToast(false), 3000)
      return true
    }
    return false
  }

  const fetchBooks = async (kw = '') => {
    setLoading(true)
    try {
      const { data } = await bookApi.getBooks(kw)
      setBooks(data.data?.content || data.data || [])
    } catch {
      setBooks(MOCK_BOOKS.filter((b) => !kw || b.title.includes(kw) || b.author.includes(kw)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchBooks(keyword)
  }

  return (
    <div>
      {/* 로그인 필요 토스트 */}
      {loginToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e2e', color: '#fff', borderRadius: 14,
          padding: '14px 24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          animation: 'fadeInUp 0.25s ease',
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>로그인 후 이용 가능합니다</span>
          <button
            onClick={() => navigate('/auth/login')}
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >로그인</button>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>도서 스토어</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>면접 준비에 도움이 되는 도서를 만나보세요.</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 28, maxWidth: 440 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>🔍</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="책 제목 또는 저자 검색"
            style={{
              width: '100%', padding: '10px 13px 10px 36px',
              border: `1.5px solid ${focused ? '#4f46e5' : 'var(--border)'}`,
              borderRadius: 9, fontSize: 14, color: 'var(--text)',
              background: 'var(--surface)', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', transition: 'all 0.15s',
              boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <Button type="submit">검색</Button>
      </form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <p>도서 목록을 불러오는 중...</p>
        </div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>😔</div>
          <p>검색 결과가 없습니다</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} onAddCart={addItem} onNavigate={(id) => navigate(`/books/${id}`)} onLoginRequired={requireLogin} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BookStorePage
