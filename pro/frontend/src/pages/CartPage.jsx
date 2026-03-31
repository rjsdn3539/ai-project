import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCartStore from '../store/cartStore'
import * as bookApi from '../api/book'
import Button from '../components/Button'

function CartPage() {
  const { items, fetchCart, updateItem, removeItem } = useCartStore()
  const [address, setAddress] = useState('')
  const [ordering, setOrdering] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchCart().catch(() => {}) }, [])

  const total = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)

  const handleOrder = async () => {
    if (!address.trim()) { alert('배송지를 입력하세요.'); return }
    setOrdering(true)
    try {
      await bookApi.createOrder({ address })
      alert('주문이 완료되었습니다!')
      navigate('/orders')
    } catch {
      alert('주문 처리에 실패했습니다.')
    } finally {
      setOrdering(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
        <h2 style={{ fontWeight: '700', marginBottom: '8px' }}>장바구니가 비었습니다</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>도서 스토어에서 책을 담아보세요.</p>
        <Button onClick={() => navigate('/books')}>도서 스토어로</Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>장바구니</h1>

      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        {items.map((item, idx) => (
          <div key={item.bookId} style={{
            display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '16px',
            borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
          }}>
            <div style={{ fontSize: '32px' }}>📚</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '600', marginBottom: '2px' }}>{item.bookTitle || '도서'}</p>
              <p style={{ color: '#4f46e5', fontWeight: '700' }}>{((item.price || 0) * item.quantity).toLocaleString()}원</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => item.quantity > 1 && updateItem(item.bookId, item.quantity - 1)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontWeight: '700' }}>-</button>
              <span style={{ fontWeight: '600', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
              <button onClick={() => updateItem(item.bookId, item.quantity + 1)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontWeight: '700' }}>+</button>
            </div>
            <button onClick={() => removeItem(item.bookId)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontWeight: '600' }}>총 금액</span>
          <span style={{ fontWeight: '800', fontSize: '20px', color: '#4f46e5' }}>{total.toLocaleString()}원</span>
        </div>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="배송지를 입력하세요"
          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box', color: '#111', background: '#fff' }}
        />
        <Button fullWidth loading={ordering} onClick={handleOrder}>주문하기</Button>
      </div>
    </div>
  )
}

export default CartPage
