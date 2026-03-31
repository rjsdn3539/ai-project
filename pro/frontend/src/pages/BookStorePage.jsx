import { useState, useEffect } from 'react'
import * as bookApi from '../api/book'
import useCartStore from '../store/cartStore'
import Button from '../components/Button'

const MOCK_BOOKS = [
  { id: 1, title: '클린 코드', author: '로버트 마틴', price: 32000, stock: 10, coverUrl: '' },
  { id: 2, title: '개발자를 위한 면접 교과서', author: '이동욱', price: 28000, stock: 5, coverUrl: '' },
  { id: 3, title: '자바스크립트 완벽 가이드', author: 'David Flanagan', price: 45000, stock: 8, coverUrl: '' },
  { id: 4, title: 'Spring Boot 실전', author: '김영한', price: 38000, stock: 3, coverUrl: '' },
]

function BookCard({ book, onAddCart }) {
  const [adding, setAdding] = useState(false)
  const handleAdd = async () => {
    setAdding(true)
    await onAddCart(book.id)
    setAdding(false)
  }
  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <div style={{ height: '160px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
        📚
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontWeight: '700', marginBottom: '4px', fontSize: '15px' }}>{book.title}</h3>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>{book.author}</p>
        <p style={{ fontWeight: '700', color: '#4f46e5', fontSize: '16px', marginBottom: '12px' }}>
          {book.price.toLocaleString()}원
        </p>
        <Button fullWidth loading={adding} onClick={handleAdd} disabled={book.stock === 0}>
          {book.stock === 0 ? '품절' : '장바구니 담기'}
        </Button>
      </div>
    </div>
  )
}

function BookStorePage() {
  const [books, setBooks] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()

  const fetchBooks = async (kw = '') => {
    setLoading(true)
    try {
      const { data } = await bookApi.getBooks(kw)
      setBooks(data.data?.content || data.data || [])
    } catch {
      setBooks(MOCK_BOOKS.filter((b) => b.title.includes(kw) || b.author.includes(kw) || !kw))
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
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>도서 스토어</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>면접 준비에 도움이 되는 도서를 만나보세요.</p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '32px', maxWidth: '400px' }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="책 제목 또는 저자 검색"
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#111', background: '#fff' }}
        />
        <Button type="submit">검색</Button>
      </form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} onAddCart={addItem} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BookStorePage
