import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import * as subscriptionApi from '../api/subscription'
import { searchRoadAddresses } from '../api/address'
import Button from '../components/Button'

const BOOK_COLORS = ['var(--bg-purple)', 'var(--bg-indigo)', 'var(--bg-success)', 'var(--border-warning)', 'var(--border-error)', 'var(--border-indigo)']

function formatDeliveryAddress(selectedAddress, detailAddress = '') {
  if (!selectedAddress?.roadAddr) return ''
  return [
    selectedAddress.zipNo ? `(${selectedAddress.zipNo}) ${selectedAddress.roadAddr}` : selectedAddress.roadAddr,
    detailAddress.trim(),
  ].filter(Boolean).join(' ')
}

function AddressSearchModal({
  open,
  keyword,
  onKeywordChange,
  onClose,
  onSearch,
  results,
  searching,
  error,
  searched,
  onSelect,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, maxHeight: '80vh',
          background: 'var(--surface)', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>주소 검색</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>도로명, 건물명 또는 지번으로 전체 검색 결과를 확인하세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, padding: '18px 24px 12px' }}>
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="예: 테헤란로 152, 삼성동 25"
            style={{
              flex: 1, padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)',
              fontSize: 14, color: 'var(--text)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              padding: '0 20px', borderRadius: 10, border: 'none',
              background: searching ? 'var(--border)' : 'var(--primary)', color: searching ? 'var(--text-muted)' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {searching ? '검색 중...' : '검색'}
          </button>
        </form>

        <div style={{ padding: '0 24px 18px', overflowY: 'auto' }}>
          {error && (
            <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>
              ⚠ {error}
            </p>
          )}

          {searched && !error && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              검색 결과 {totalCount.toLocaleString()}건
            </p>
          )}

          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((result) => (
                <button
                  key={`${result.roadAddr}-${result.zipNo}-${result.bdMgtSn || ''}`}
                  type="button"
                  onClick={() => onSelect(result)}
                  style={{
                    textAlign: 'left', border: '1px solid var(--border-light)', borderRadius: 12,
                    background: 'var(--bg)', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      도로명
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{result.zipNo}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{result.roadAddr}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    지번 {result.jibunAddr || '-'}
                    {result.buildingName ? ` · ${result.buildingName}` : ''}
                  </p>
                </button>
              ))}
            </div>
          ) : searched && !searching && !error ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: 13 }}>검색 결과가 없습니다.</p>
            </div>
          ) : null}
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '14px 24px 18px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || searching}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text)',
                cursor: currentPage <= 1 || searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              이전
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || searching}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                cursor: currentPage >= totalPages || searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CartPage() {
  const { items, updateItem, removeItem } = useCartStore()
  const { user } = useAuthStore()
  const [addressKeyword, setAddressKeyword] = useState('')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [detailAddress, setDetailAddress] = useState('')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [modalKeyword, setModalKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotalCount, setSearchTotalCount] = useState(0)
  const [searchCountPerPage] = useState(10)
  const [detailFocused, setDetailFocused] = useState(false)
  const [addrError, setAddrError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searched, setSearched] = useState(false)
  const [addrSearching, setAddrSearching] = useState(false)
  const [bookDiscountRate, setBookDiscountRate] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      subscriptionApi.getMySubscription()
        .then(({ data }) => setBookDiscountRate(data.data?.bookDiscountRate || 0))
        .catch(() => {})
    }
  }, [user])

  const rawTotal = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)
  const discountAmount = bookDiscountRate > 0 ? Math.floor(rawTotal * bookDiscountRate / 100) : 0
  const total = rawTotal - discountAmount

  const totalSearchPages = Math.max(1, Math.ceil(searchTotalCount / searchCountPerPage))

  const runAddressSearch = async (keyword, page = 1) => {
    const trimmedKeyword = keyword.trim()
    setAddrSearching(true)
    setSearchError('')
    setAddrError('')
    setSearched(true)

    try {
      const { results, totalCount } = await searchRoadAddresses(trimmedKeyword, {
        currentPage: page,
        countPerPage: searchCountPerPage,
      })
      setSearchResults(results)
      setSearchPage(page)
      setSearchTotalCount(totalCount)
      if (results.length === 0) {
        setSearchError('검색 결과가 없습니다. 다른 키워드로 다시 시도해주세요.')
      }
    } catch (err) {
      setSearchResults([])
      setSearchTotalCount(0)
      setSearchError(err?.message || '주소 검색에 실패했습니다.')
    } finally {
      setAddrSearching(false)
    }
  }

  const handleSearchAddress = async (e) => {
    e.preventDefault()
    const keyword = modalKeyword.trim()
    if (keyword.length < 2) {
      setSearchError('도로명, 건물명 또는 지번을 2자 이상 입력해주세요.')
      setSearchResults([])
      setSearchTotalCount(0)
      setSearchPage(1)
      setSearched(false)
      return
    }

    await runAddressSearch(keyword, 1)
  }

  const handleOpenAddressModal = () => {
    setModalKeyword(addressKeyword || selectedAddress?.roadAddr || '')
    setSearchError('')
    setShowAddressModal(true)
  }

  const handleCloseAddressModal = () => {
    setShowAddressModal(false)
  }

  const handleChangeSearchPage = async (nextPage) => {
    if (nextPage < 1 || nextPage > totalSearchPages || addrSearching) return
    await runAddressSearch(modalKeyword, nextPage)
  }

  const handleSelectAddress = (result) => {
    setSelectedAddress(result)
    setAddressKeyword(result.roadAddr || '')
    setSearchError('')
    setAddrError('')
    setShowAddressModal(false)
  }

  const handleOrder = () => {
    const finalAddress = formatDeliveryAddress(selectedAddress, detailAddress)
    if (!selectedAddress) { setAddrError('주소 검색 후 배송지를 선택해주세요.'); return }
    if (finalAddress.length < 5) { setAddrError('주소를 다시 확인해주세요.'); return }
    setAddrError('')
    const orderName = items.length === 1
      ? (items[0].title || '도서')
      : `${items[0].title || '도서'} 외 ${items.length - 1}건`
    navigate('/payment', {
      state: {
        orderName,
        totalAmount: total,
        type: 'cart',
        items,
        deliveryAddress: finalAddress,
        backTo: '/cart',
      },
    })
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 18, padding: '52px 40px',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>장바구니가 비었습니다</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>도서 스토어에서 마음에 드는 책을 담아보세요.</p>
          <Button onClick={() => navigate('/books')}>도서 스토어 보기 →</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <AddressSearchModal
        open={showAddressModal}
        keyword={modalKeyword}
        onKeywordChange={setModalKeyword}
        onClose={handleCloseAddressModal}
        onSearch={handleSearchAddress}
        results={searchResults}
        searching={addrSearching}
        error={searchError}
        searched={searched}
        onSelect={handleSelectAddress}
        currentPage={searchPage}
        totalPages={totalSearchPages}
        totalCount={searchTotalCount}
        onPageChange={handleChangeSearchPage}
      />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>장바구니</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{items.length}개의 상품이 담겨있습니다.</p>
      </div>

      {/* Items */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: 16,
      }}>
        {items.map((item, idx) => (
          <div key={item.bookId} style={{
            display: 'flex', alignItems: 'center', padding: '18px 22px', gap: 16,
            borderBottom: idx < items.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{
              width: 52, height: 68, borderRadius: 8,
              background: 'var(--bg-purple)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 24, flexShrink: 0,
            }}>📚</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                {item.title || '도서'}
              </p>
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 16 }}>
                {((item.price || 0) * item.quantity).toLocaleString()}원
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
                  (1권 {(item.price || 0).toLocaleString()}원)
                </span>
              </p>
            </div>
            {/* Qty controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => item.quantity > 1 && updateItem(item.bookId, item.quantity - 1)}
                style={{
                  width: 30, height: 30, borderRadius: 7, border: '1.5px solid var(--border)',
                  background: 'var(--surface)', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 16, fontFamily: 'inherit', color: 'var(--text)',
                  opacity: item.quantity <= 1 ? 0.4 : 1,
                }}
              >−</button>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', minWidth: 22, textAlign: 'center' }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateItem(item.bookId, item.quantity + 1)}
                style={{
                  width: 30, height: 30, borderRadius: 7, border: '1.5px solid var(--border)',
                  background: 'var(--surface)', cursor: 'pointer',
                  fontWeight: 700, fontSize: 16, fontFamily: 'inherit', color: 'var(--text)',
                }}
              >+</button>
            </div>
            <button
              onClick={() => removeItem(item.bookId)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                color: 'var(--text-muted)', fontSize: 18,
                borderRadius: 6, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-error)'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Checkout card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: '24px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
      }}>
        {bookDiscountRate > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>상품 금액</span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{rawTotal.toLocaleString()}원</span>
          </div>
        )}
        {bookDiscountRate > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
              구독 혜택 할인 ({bookDiscountRate}%)
            </span>
            <span style={{ fontSize: 14, color: 'var(--success)', fontWeight: 700 }}>
              -{discountAmount.toLocaleString()}원
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderTop: bookDiscountRate > 0 ? '1px solid var(--border-light)' : 'none', paddingTop: bookDiscountRate > 0 ? 12 : 0 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>총 결제금액</span>
          <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--primary)' }}>
            {total.toLocaleString()}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>원</span>
          </span>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          배송지
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={selectedAddress ? `(${selectedAddress.zipNo}) ${selectedAddress.roadAddr}` : addressKeyword}
            readOnly
            placeholder="주소 찾기 버튼으로 배송지를 검색하세요"
            style={{
              flex: 1, padding: '11px 13px',
              border: `1.5px solid ${addrError ? '#ef4444' : 'var(--border)'}`,
              borderRadius: 9, fontSize: 14,
              boxSizing: 'border-box', color: selectedAddress ? 'var(--text)' : 'var(--text-muted)', background: 'var(--surface)',
              outline: 'none', fontFamily: 'inherit',
              boxShadow: addrError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
            }}
          />
          <button
            type="button"
            onClick={handleOpenAddressModal}
            style={{
              padding: '0 18px', borderRadius: 9, border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            주소 찾기
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          팝업에서 검색 결과 전체를 확인한 뒤 배송지를 선택해주세요.
        </p>

        {selectedAddress && (
          <div style={{
            background: 'var(--bg-indigo)', border: '1px solid var(--border-indigo)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 12,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>선택한 배송지</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              ({selectedAddress.zipNo}) {selectedAddress.roadAddr}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              지번 {selectedAddress.jibunAddr || '-'}
            </p>
          </div>
        )}

        <input
          value={detailAddress}
          onChange={(e) => { setDetailAddress(e.target.value); setAddrError('') }}
          placeholder="상세주소 입력 (동, 호수 등)"
          onFocus={() => setDetailFocused(true)}
          onBlur={() => setDetailFocused(false)}
          style={{
            width: '100%', padding: '11px 13px',
            border: `1.5px solid ${addrError ? '#ef4444' : detailFocused ? '#4f46e5' : 'var(--border)'}`,
            borderRadius: 9, marginBottom: searchError || addrError || selectedAddress || searched ? 6 : 16, fontSize: 14,
            boxSizing: 'border-box', color: 'var(--text)', background: 'var(--surface)',
            outline: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
            boxShadow: addrError ? '0 0 0 3px rgba(239,68,68,0.1)' : detailFocused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
          }}
        />
        {addrError && (
          <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 14 }}>
            ⚠ {addrError}
          </p>
        )}
        {!addrError && selectedAddress && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            최종 배송지: {formatDeliveryAddress(selectedAddress, detailAddress)}
          </p>
        )}
        <Button fullWidth size="lg" onClick={handleOrder}>
          결제하기 →
        </Button>
      </div>
    </div>
  )
}

export default CartPage
