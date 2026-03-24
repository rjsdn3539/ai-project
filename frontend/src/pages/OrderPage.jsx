import { useState, useEffect } from 'react'
import * as bookApi from '../api/book'

const STATUS_LABEL = { PENDING: '결제완료', PAID: '결제완료', SHIPPED: '배송중', DELIVERED: '배송완료', CANCELLED: '취소' }
const STATUS_COLOR = { PENDING: 'var(--warning)', PAID: 'var(--success)', SHIPPED: '#4f46e5', DELIVERED: 'var(--text-secondary)', CANCELLED: '#ef4444' }

const MOCK_ORDERS = [
  { id: 1, orderedAt: '2026-03-10', status: 'SHIPPED', totalPrice: 60000, address: '서울시 강남구', items: [{ bookTitle: '클린 코드', quantity: 1, price: 32000 }, { bookTitle: '개발자 면접 교과서', quantity: 1, price: 28000 }] },
  { id: 2, orderedAt: '2026-03-15', status: 'PAID', totalPrice: 38000, address: '서울시 마포구', items: [{ bookTitle: 'Spring Boot 실전', quantity: 1, price: 38000 }] },
]

function OrderPage() {
  const [orders, setOrders] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookApi.getOrders()
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setOrders(MOCK_ORDERS))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>불러오는 중...</div>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>주문 내역</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>주문 내역이 없습니다.</div>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{ background: 'var(--surface)', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <p style={{ fontWeight: '700', marginBottom: '4px' }}>주문 #{order.id}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.orderedAt}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: STATUS_COLOR[order.status] + '20', color: STATUS_COLOR[order.status], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  {STATUS_LABEL[order.status]}
                </span>
                <p style={{ fontWeight: '700', color: 'var(--primary)' }}>{order.totalPrice.toLocaleString()}원</p>
              </div>
            </div>
            {expanded === order.id && (
              <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', background: 'var(--bg)' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>배송지: {order.address}</p>
                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>{item.bookTitle} × {item.quantity}</span>
                    <span style={{ fontWeight: '600' }}>{(item.price * item.quantity).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default OrderPage
