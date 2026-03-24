import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import { requestPayment, PAYMENT_METHODS } from '../utils/payment'
import { upgradeSubscription } from '../api/subscription'
import { createOrder } from '../api/order'

function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { clearCart } = useCartStore()

  const state = location.state || {}
  // state fields: orderName, totalAmount, type ('subscription'|'cart'), items[], planName, billing, backTo
  const { orderName, totalAmount, type, items = [], planName, billing, backTo = '/', deliveryAddress } = state

  const [selectedMethod, setSelectedMethod] = useState(null)
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [nameFocused, setNameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [done, setDone] = useState(false)
  const [resultId, setResultId] = useState('')

  if (!orderName || !totalAmount) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>결제 정보가 없습니다</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>올바른 경로로 접근해주세요.</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: '#4f46e5', color: '#fff', fontWeight: 700,
            fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >뒤로 가기</button>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 24, padding: '56px 40px',
          boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>결제 완료!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>{orderName}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginBottom: 24 }}>
            {totalAmount.toLocaleString()}원
          </p>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: '14px 18px',
            border: '1px solid var(--border-indigo)', marginBottom: 32, textAlign: 'left',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>주문번호</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>{resultId}</p>
          </div>
          <button
            onClick={() => navigate(type === 'subscription' ? '/subscription' : '/home')}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {type === 'subscription' ? '구독 현황 보기 →' : '홈으로 →'}
          </button>
        </div>
      </div>
    )
  }

  const handlePay = async () => {
    if (!selectedMethod) { setPayError('결제 수단을 선택해주세요.'); return }
    if (!customerName.trim()) { setPayError('이름을 입력해주세요.'); return }
    if (!customerEmail.trim()) { setPayError('이메일을 입력해주세요.'); return }
    setPaying(true)
    setPayError('')
    const method = PAYMENT_METHODS.find(m => m.key === selectedMethod)
    const result = await requestPayment({
      orderName,
      totalAmount,
      channelKey: method.channelKey,
      payMethod: method.payMethod,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
    })
    setPaying(false)
    if (result.success) {
      if (type === 'cart') {
        try {
          await createOrder({
            orderType: 'BOOK',
            totalAmount,
            paymentMethod: method.label,
            paymentId: result.paymentId,
            orderName,
            items: items.map((item) => ({
              bookId: item.bookId,
              bookTitle: item.title || item.bookTitle || '도서',
              quantity: item.quantity,
              unitPrice: item.price || item.unitPrice || 0,
            })),
            deliveryAddress: deliveryAddress || null,
            recipientName: customerName.trim() || null,
          })
        } catch (err) {
          console.error('[createOrder] 주문 생성 실패:', err?.response?.data || err)
        }
        clearCart()
      }
      if (type === 'subscription' && state.planTier) {
        try {
          await createOrder({
            orderType: 'SUBSCRIPTION',
            totalAmount,
            paymentMethod: method.label,
            paymentId: result.paymentId,
            orderName,
          })
        } catch (err) {
          console.error('[createOrder] 구독 주문 생성 실패:', err?.response?.data || err)
        }
        try {
          await upgradeSubscription(state.planTier, billing)
        } catch {}
      }
      setResultId(result.paymentId)
      setDone(true)
    } else {
      setPayError(result.error || '결제에 실패했습니다.')
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate(backTo)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, color: 'var(--text-muted)', padding: 0, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >← 뒤로</button>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>결제</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>안전하게 결제를 진행합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* Left: Payment method + Customer info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Customer info */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '28px',
            boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 20 }}>구매자 정보</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>이름</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="홍길동"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  style={{
                    width: '100%', padding: '11px 13px', boxSizing: 'border-box',
                    border: `1.5px solid ${nameFocused ? '#4f46e5' : 'var(--border)'}`,
                    borderRadius: 9, fontSize: 14, color: 'var(--text)', background: 'var(--surface)',
                    outline: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
                    boxShadow: nameFocused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 7 }}>이메일</label>
                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="example@email.com"
                  type="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={{
                    width: '100%', padding: '11px 13px', boxSizing: 'border-box',
                    border: `1.5px solid ${emailFocused ? '#4f46e5' : 'var(--border)'}`,
                    borderRadius: 9, fontSize: 14, color: 'var(--text)', background: 'var(--surface)',
                    outline: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '28px',
            boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 20 }}>결제 수단</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAYMENT_METHODS.map((m) => {
                const selected = selectedMethod === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => { setSelectedMethod(m.key); setPayError('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
                      borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                      border: `2px solid ${selected ? '#4f46e5' : 'var(--border)'}`,
                      background: selected ? 'var(--bg-indigo)' : 'var(--surface)',
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: selected ? '#4f46e5' : 'var(--text)', margin: 0 }}>{m.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {m.payMethod === 'EASY_PAY' ? '간편결제' : '신용/체크카드'}
                      </p>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${selected ? '#4f46e5' : 'var(--border)'}`,
                      background: selected ? '#4f46e5' : 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--surface)' }} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Order summary + Pay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Order summary */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '28px',
            boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 20 }}>주문 요약</h2>

            {type === 'subscription' && (
              <div style={{
                background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)',
                borderRadius: 12, padding: '16px', marginBottom: 20,
                border: '1px solid var(--border-indigo)',
              }}>
                <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>
                  {planName} 플랜
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {billing === 'monthly' ? '월간 구독' : '연간 구독'}
                </p>
              </div>
            )}

            {type === 'cart' && items.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {items.map((item, idx) => (
                  <div key={item.bookId || idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: idx < items.length - 1 ? 12 : 0,
                    marginBottom: idx < items.length - 1 ? 12 : 0,
                    borderBottom: idx < items.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{item.title || '도서'}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>수량 {item.quantity}권</p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      {((item.price || 0) * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>총 결제금액</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                  {totalAmount.toLocaleString()}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>원</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pay button */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '24px',
            boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
          }}>
            {payError && (
              <div style={{
                background: 'var(--bg-error)', border: '1px solid var(--border-error)', borderRadius: 10,
                padding: '11px 14px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{payError}</p>
              </div>
            )}
            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                width: '100%', padding: '16px',
                background: paying
                  ? 'var(--border)'
                  : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: paying ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 12,
                fontWeight: 800, fontSize: 16, cursor: paying ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                boxShadow: paying ? 'none' : '0 6px 22px rgba(79,70,229,0.38)',
              }}
              onMouseEnter={(e) => { if (!paying) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
            >
              {paying ? '결제 처리 중...' : `${totalAmount.toLocaleString()}원 결제하기`}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
              포트원 V2를 통해 안전하게 처리됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
