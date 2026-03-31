import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as inquiryApi from '../api/inquiry'

const STATUS_LABELS = {
  PENDING: '답변 대기',
  ANSWERED: '답변 완료',
}

const STATUS_STYLES = {
  PENDING: { background: 'var(--bg-warning)', color: 'var(--warning)' },
  ANSWERED: { background: 'var(--bg-success)', color: 'var(--success)' },
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { background: 'var(--bg)', color: 'var(--text-secondary)' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: style.background,
      color: style.color,
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        style={{
          padding: '7px 14px',
          borderRadius: 7,
          border: '1.5px solid var(--border-indigo)',
          background: 'transparent',
          color: 'var(--primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: page === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: page === 0 ? 0.5 : 1,
        }}
      >
        {'<'}
      </button>
      <span style={{ lineHeight: '34px', fontSize: 14, color: 'var(--text-secondary)' }}>
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        style={{
          padding: '7px 14px',
          borderRadius: 7,
          border: '1.5px solid var(--border-indigo)',
          background: 'transparent',
          color: 'var(--primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: page >= totalPages - 1 ? 0.5 : 1,
        }}
      >
        {'>'}
      </button>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  )
}

function MyInquiriesPage() {
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState([])
  const [summary, setSummary] = useState({ total: 0, answered: 0, pending: 0 })
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async (nextPage = 0) => {
    setLoading(true)
    setLoadError('')

    try {
      const [pageResponse, answeredResponse, pendingResponse] = await Promise.all([
        inquiryApi.getMyInquiries(nextPage, 5),
        inquiryApi.getMyInquiries(0, 1, 'ANSWERED'),
        inquiryApi.getMyInquiries(0, 1, 'PENDING'),
      ])

      const pageData = pageResponse.data.data
      setInquiries(pageData.items || [])
      setPage(pageData.page || 0)
      setTotalPages(pageData.totalPages || 0)
      setSummary({
        total: pageData.totalElements || 0,
        answered: answeredResponse.data.data.totalElements || 0,
        pending: pendingResponse.data.data.totalElements || 0,
      })
    } catch (error) {
      setLoadError(
        error?.response?.data?.error?.message
          || error?.response?.data?.message
          || '문의 내역을 불러오지 못했습니다.'
      )
      setInquiries([])
      setSummary({ total: 0, answered: 0, pending: 0 })
      setPage(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0)
  }, [load])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>내 문의</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            제출한 문의 내역과 관리자 답변을 확인할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/inquiry')}
          style={{
            padding: '11px 18px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          새 문의 작성
        </button>
      </div>

      {loadError && (
        <div style={{
          background: 'var(--bg-error)',
          border: '1px solid var(--border-error)',
          color: 'var(--danger)',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 13,
        }}>
          {loadError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: '전체 문의', value: summary.total, color: 'var(--primary)' },
          { label: '답변 완료', value: summary.answered, color: 'var(--success)' },
          { label: '답변 대기', value: summary.pending, color: 'var(--warning)' },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border-light)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{item.label}</p>
            <p style={{ fontSize: 28, color: item.color, fontWeight: 900, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border-light)',
          borderRadius: 18,
          padding: '42px 28px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          문의 내역을 불러오는 중입니다.
        </div>
      ) : summary.total === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '1.5px dashed var(--border)',
          borderRadius: 18,
          padding: '42px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>💬</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>아직 등록한 문의가 없습니다</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
            서비스 이용 중 궁금한 점이나 불편한 사항이 있다면 문의를 남겨주세요.
          </p>
          <button
            onClick={() => navigate('/inquiry')}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: '#7c6af0',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            문의하러 가기
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 18,
                padding: '22px 24px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={inquiry.status} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inquiry.category}</span>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{inquiry.subject}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>접수일</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
                      {(inquiry.createdAt || '').slice(0, 16).replace('T', ' ')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <InfoRow label="문의자" value={inquiry.name} />
                  <InfoRow label="답변 담당" value={inquiry.answeredBy || '-'} />
                  <InfoRow label="답변일" value={inquiry.answeredAt ? inquiry.answeredAt.slice(0, 16).replace('T', ' ') : '-'} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>문의 내용</p>
                  <div style={{
                    background: 'var(--bg)',
                    borderRadius: 14,
                    border: '1px solid var(--border-light)',
                    padding: '16px 18px',
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {inquiry.message}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>관리자 답변</p>
                  <div style={{
                    background: inquiry.adminAnswer ? 'var(--bg-success)' : 'var(--bg)',
                    borderRadius: 14,
                    border: `1px solid ${inquiry.adminAnswer ? 'var(--border-success)' : 'var(--border-light)'}`,
                    padding: '16px 18px',
                    fontSize: 14,
                    color: inquiry.adminAnswer ? 'var(--success)' : 'var(--text-muted)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {inquiry.adminAnswer || '아직 답변이 등록되지 않았습니다.'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={load} />
        </>
      )}
    </div>
  )
}

export default MyInquiriesPage
