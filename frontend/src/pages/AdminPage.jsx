import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import * as adminApi from '../api/admin'

// ── 공통 UI ────────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: 'var(--surface)', borderRadius: 14, padding: 24,
    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
  },
  input: {
    padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)',
  },
  btn: (color = 'var(--primary)', text = '#fff') => ({
    padding: '7px 14px', background: color, color: text, border: 'none',
    borderRadius: 7, fontSize: 13, cursor: 'pointer', fontWeight: 600,
    fontFamily: 'inherit',
  }),
  btnOutline: {
    padding: '7px 14px', background: 'transparent', color: 'var(--primary)',
    border: '1.5px solid var(--border-indigo)', borderRadius: 7, fontSize: 13,
    cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700,
    color: 'var(--text-muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)',
  },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' },
}

function Badge({ label, type }) {
  const colors = {
    ADMIN: ['var(--bg-warning)', 'var(--warning)'], USER: ['var(--bg-indigo)', 'var(--accent)'],
    IN_PROGRESS: ['var(--bg-success)', 'var(--success)'], COMPLETED: ['var(--bg-warm)', 'var(--text-secondary)'],
    FREE: ['var(--bg-warm)', 'var(--text-secondary)'], STANDARD: ['var(--bg-indigo)', 'var(--primary)'],
    PRO: ['var(--bg-purple)', 'var(--primary)'], PREMIUM: ['var(--bg-warning)', 'var(--warning)'],
  }
  const [bg, fg] = colors[type] || ['var(--bg-warm)', 'var(--text)']
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, background: bg, color: fg,
    }}>{label}</span>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
      <button style={S.btnOutline} disabled={page === 0} onClick={() => onChange(page - 1)}>{'<'}</button>
      <span style={{ lineHeight: '34px', fontSize: 14, color: 'var(--text-secondary)' }}>
        {page + 1} / {totalPages}
      </span>
      <button style={S.btnOutline} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>{'>'}</button>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ ...S.card, width: 360, textAlign: 'center' }}>
        <p style={{ marginBottom: 20, fontSize: 15 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button style={S.btn('#ef4444')} onClick={onConfirm}>삭제</button>
          <button style={S.btn('var(--text-secondary)')} onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 대시보드 ────────────────────────────────────────────────────────────────────
const PIE_COLORS = ['var(--primary)', 'var(--border-light)']

function DashboardTab() {
  const [data, setData] = useState(null)

  useEffect(() => {
    adminApi.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => setData({
        totalUsers: 0, newUsersToday: 0, totalSessions: 0,
        activeSessions: 0, totalBooks: 0, dailySignups: [],
      }))
  }, [])

  if (!data) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>불러오는 중...</p>

  const sessionPieData = [
    { name: '진행 중', value: data.activeSessions },
    { name: '완료', value: data.totalSessions - data.activeSessions },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          { title: '총 회원', value: data.totalUsers, icon: '👥', color: 'var(--primary)' },
          { title: '오늘 신규 가입', value: data.newUsersToday, icon: '✨', color: 'var(--success)' },
          { title: '전체 면접 세션', value: data.totalSessions, icon: '🎤', color: 'var(--primary)' },
          { title: '진행 중 면접', value: data.activeSessions, icon: '▶', color: 'var(--warning)' },
          { title: '등록 도서', value: data.totalBooks, icon: '📚', color: '#ef4444' },
        ].map(({ title, value, icon, color }) => (
          <div key={title} style={S.card}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color }}>{value}</span>
              <span style={{ fontSize: 26 }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={S.card}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>최근 7일 신규 가입자</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailySignups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="가입자" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>면접 세션 현황</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sessionPieData} cx="50%" cy="50%" outerRadius={80}
                dataKey="value" label={({ name, value }) => `${name} ${value}`} labelLine={false}>
                {sessionPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ── 구독 변경 모달 ──────────────────────────────────────────────────────────────
const TIER_OPTIONS = [
  { value: 'FREE',     label: '무료 (FREE)',          color: 'var(--text-secondary)' },
  { value: 'STANDARD', label: 'Standard',             color: 'var(--primary)' },
  { value: 'PRO',      label: 'Pro',                  color: 'var(--primary)' },
  { value: 'PREMIUM',  label: 'Premium',              color: 'var(--warning)' },
]
const MONTH_OPTIONS = [1, 3, 6, 12]

function SubscriptionModal({ user, onSave, onClose }) {
  const [tier, setTier] = useState(user.subscriptionTier || 'FREE')
  const [months, setMonths] = useState(1)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(tier, tier === 'FREE' ? 0 : months)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ ...S.card, width: 360 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>구독 플랜 변경</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {user.name} ({user.email})
        </p>

        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
          플랜 선택
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {TIER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTier(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                border: `2px solid ${tier === opt.value ? opt.color : 'var(--border)'}`,
                background: tier === opt.value ? opt.color + '12' : 'var(--surface)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${tier === opt.value ? opt.color : 'var(--border)'}`,
                background: tier === opt.value ? opt.color : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tier === opt.value && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--surface)' }} />}
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: tier === opt.value ? opt.color : 'var(--text)' }}>
                {opt.label}
              </span>
              {opt.value === user.subscriptionTier && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>현재</span>
              )}
            </button>
          ))}
        </div>

        {tier !== 'FREE' && (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              구독 기간
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {MONTH_OPTIONS.map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
                    border: `2px solid ${months === m ? 'var(--primary)' : 'var(--border)'}`,
                    background: months === m ? 'var(--primary)' : 'var(--surface)',
                    color: months === m ? '#fff' : 'var(--text)',
                    transition: 'all 0.15s',
                  }}
                >
                  {m}개월
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...S.btn('var(--text-secondary)'), flex: 1 }} onClick={onClose}>취소</button>
          <button style={{ ...S.btn(), flex: 2, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? '변경 중...' : '변경하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 회원 관리 ───────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [subModal, setSubModal] = useState(null) // user object

  const load = useCallback((p = 0, q = search) => {
    adminApi.getUsers(p, 10, q)
      .then(r => {
        const d = r.data.data
        setUsers(d.items)
        setPage(d.page)
        setTotalPages(d.totalPages)
      })
      .catch(() => {})
  }, [search])

  useEffect(() => { load(0) }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    load(0, searchInput)
  }

  const handleRoleToggle = async (user) => {
    const next = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    try {
      await adminApi.changeUserRole(user.id, next)
      load(page)
    } catch {}
  }

  const handleSubscriptionSave = async (tier, months) => {
    try {
      await adminApi.changeUserSubscription(subModal.id, tier, months)
      setSubModal(null)
      load(page)
    } catch { alert('변경 실패') }
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(confirm)
      setConfirm(null)
      load(page)
    } catch {}
  }

  return (
    <div style={S.card}>
      {confirm && (
        <ConfirmModal
          message="이 회원을 삭제하시겠습니까? 관련 데이터도 함께 삭제됩니다."
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {subModal && (
        <SubscriptionModal
          user={subModal}
          onSave={handleSubscriptionSave}
          onClose={() => setSubModal(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700 }}>회원 관리</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...S.input, width: 220 }} placeholder="이름 또는 이메일 검색"
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <button type="submit" style={S.btn()}>검색</button>
        </form>
      </div>
      <table style={S.table}>
        <thead>
          <tr>
            {['ID', '이름', '이메일', '역할', '구독', '가입일', '관리'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>회원 없음</td></tr>
          )}
          {users.map(u => (
            <tr key={u.id}>
              <td style={S.td}>{u.id}</td>
              <td style={S.td}>{u.name}</td>
              <td style={S.td}>{u.email}</td>
              <td style={S.td}><Badge label={u.role} type={u.role} /></td>
              <td style={S.td}>
                <Badge label={u.subscriptionTier || 'FREE'} type={u.subscriptionTier} />
              </td>
              <td style={S.td}>{u.createdAt?.slice(0, 10)}</td>
              <td style={{ ...S.td, display: 'flex', gap: 6 }}>
                <button style={S.btn(u.role === 'ADMIN' ? 'var(--text-secondary)' : 'var(--primary)')}
                  onClick={() => handleRoleToggle(u)}>
                  {u.role === 'ADMIN' ? 'USER로 변경' : 'ADMIN 지정'}
                </button>
                <button style={S.btn('var(--primary)')} onClick={() => setSubModal(u)}>구독변경</button>
                <button style={S.btn('#ef4444')} onClick={() => setConfirm(u.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); load(p) }} />
    </div>
  )
}

// ── 면접 세션 현황 ──────────────────────────────────────────────────────────────
function SessionsTab() {
  const [sessions, setSessions] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [status, setStatus] = useState('')
  const [confirm, setConfirm] = useState(null)

  const load = useCallback((p = 0, s = status) => {
    adminApi.getSessions(p, 10, s)
      .then(r => {
        const d = r.data.data
        setSessions(d.items)
        setPage(d.page)
        setTotalPages(d.totalPages)
      })
      .catch(() => {})
  }, [status])

  useEffect(() => { load(0) }, [load])

  const handleStatusChange = (val) => {
    setStatus(val)
    load(0, val)
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteSession(confirm)
      setConfirm(null)
      load(page)
    } catch {}
  }

  const statusLabel = { IN_PROGRESS: '진행 중', COMPLETED: '완료' }

  return (
    <div style={S.card}>
      {confirm && (
        <ConfirmModal
          message="이 면접 세션을 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700 }}>면접 세션 현황</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'IN_PROGRESS', 'COMPLETED'].map(s => (
            <button key={s}
              style={status === s ? S.btn() : S.btnOutline}
              onClick={() => handleStatusChange(s)}>
              {s === '' ? '전체' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
      <table style={S.table}>
        <thead>
          <tr>
            {['ID', '회원', '이메일', '직무', '상태', '시작일', '종료일', '관리'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 && (
            <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>세션 없음</td></tr>
          )}
          {sessions.map(s => (
            <tr key={s.id}>
              <td style={S.td}>{s.id}</td>
              <td style={S.td}>{s.userName}</td>
              <td style={S.td}>{s.userEmail}</td>
              <td style={S.td}>{s.positionTitle}</td>
              <td style={S.td}><Badge label={statusLabel[s.status] || s.status} type={s.status} /></td>
              <td style={S.td}>{s.startedAt?.slice(0, 16).replace('T', ' ')}</td>
              <td style={S.td}>{s.endedAt ? s.endedAt.slice(0, 16).replace('T', ' ') : '-'}</td>
              <td style={S.td}>
                <button style={S.btn('#ef4444')} onClick={() => setConfirm(s.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); load(p) }} />
    </div>
  )
}

// ── 도서 관리 ───────────────────────────────────────────────────────────────────
const EMPTY_BOOK = { title: '', author: '', publisher: '', price: '', stock: '', coverUrl: '', description: '' }

function BookModal({ book, onSave, onClose }) {
  const [form, setForm] = useState(book ? {
    title: book.title, author: book.author, publisher: book.publisher || '',
    price: book.price, stock: book.stock, coverUrl: book.coverUrl || '',
    description: book.description || '',
  } : EMPTY_BOOK)

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ ...S.card, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{book ? '도서 수정' : '도서 등록'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'title', label: '제목', required: true },
            { key: 'author', label: '저자', required: true },
            { key: 'publisher', label: '출판사' },
            { key: 'price', label: '가격', type: 'number', required: true },
            { key: 'stock', label: '재고', type: 'number', required: true },
            { key: 'coverUrl', label: '표지 URL' },
          ].map(({ key, label, type = 'text', required }) => (
            <div key={key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              <input style={S.input} type={type} required={required}
                value={form[key]} onChange={e => handleChange(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              설명
            </label>
            <textarea style={{ ...S.input, height: 80, resize: 'vertical' }}
              value={form.description} onChange={e => handleChange('description', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" style={S.btn('var(--text-secondary)')} onClick={onClose}>취소</button>
            <button type="submit" style={S.btn()}>저장</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BooksTab() {
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | book object
  const [confirm, setConfirm] = useState(null)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback((p = 0, q = search) => {
    setLoadError(false)
    adminApi.getBooks(p, 10, q)
      .then(r => {
        const d = r.data.data
        setBooks(d.items)
        setPage(d.page)
        setTotalPages(d.totalPages)
      })
      .catch((err) => {
        setLoadError(true)
        console.error('도서 목록 로드 실패:', err?.response?.status, err?.response?.data)
      })
  }, [search])

  useEffect(() => { load(0) }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    load(0, searchInput)
  }

  const handleSave = async (data) => {
    try {
      if (modal === 'create') {
        await adminApi.createBook(data)
      } else {
        await adminApi.updateBook(modal.id, data)
      }
      setModal(null)
      load(page)
    } catch (err) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message || err?.response?.data?.error || '알 수 없는 오류'
      if (status === 403) {
        alert('권한이 없습니다. ADMIN 계정으로 로그인되어 있는지 확인하세요.')
      } else if (status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
      } else {
        alert(`저장에 실패했습니다. (${status || '네트워크 오류'}: ${msg})`)
      }
    }
  }

  const handleDelete = async () => {
    try {
      await adminApi.deleteBook(confirm)
      setConfirm(null)
      load(page)
    } catch (err) {
      alert(`삭제에 실패했습니다. (${err?.response?.status || '오류'})`)
    }
  }

  return (
    <div style={S.card}>
      {modal && (
        <BookModal
          book={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {confirm && (
        <ConfirmModal
          message="이 도서를 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700 }}>도서 관리</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...S.input, width: 200 }} placeholder="제목 또는 저자 검색"
              value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" style={S.btn()}>검색</button>
          </form>
          <button style={S.btn('var(--success)')} onClick={() => setModal('create')}>+ 도서 등록</button>
        </div>
      </div>
      {loadError && (
        <div style={{ padding: '12px 16px', background: 'var(--bg-error)', border: '1px solid var(--border-error)', borderRadius: 8, marginBottom: 12, color: 'var(--danger)', fontSize: 13 }}>
          ⚠️ 도서 목록을 불러오지 못했습니다. 서버 상태 또는 권한을 확인하세요. (콘솔에서 상세 오류 확인 가능)
        </div>
      )}
      <table style={S.table}>
        <thead>
          <tr>
            {['ID', '표지', '제목', '저자', '출판사', '가격', '재고', '관리'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {books.length === 0 && !loadError && (
            <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>등록된 도서 없음</td></tr>
          )}
          {books.map(b => (
            <tr key={b.id}>
              <td style={S.td}>{b.id}</td>
              <td style={S.td}>
                {b.coverUrl
                  ? <img src={b.coverUrl} alt={b.title} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                  : <div style={{ width: 36, height: 48, background: 'var(--bg-warm)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📖</div>}
              </td>
              <td style={{ ...S.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</td>
              <td style={S.td}>{b.author}</td>
              <td style={S.td}>{b.publisher || '-'}</td>
              <td style={S.td}>{b.price?.toLocaleString()}원</td>
              <td style={S.td}>
                <span style={{ color: b.stock === 0 ? '#ef4444' : 'var(--text)', fontWeight: b.stock === 0 ? 700 : 400 }}>
                  {b.stock === 0 ? '품절' : b.stock}
                </span>
              </td>
              <td style={{ ...S.td, display: 'flex', gap: 6 }}>
                <button style={S.btn('var(--warning)')} onClick={() => setModal(b)}>수정</button>
                <button style={S.btn('#ef4444')} onClick={() => setConfirm(b.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); load(p) }} />
    </div>
  )
}

// ── 결제 관리 ───────────────────────────────────────────────────────────────────
const PAYMENT_STATUS_LABELS = { PENDING: '결제 대기', PAID: '결제 완료', CANCELLED: '취소', REFUNDED: '환불' }
const PAYMENT_STATUS_COLORS = {
  PENDING:   ['var(--bg-warning)', 'var(--warning)'],
  PAID:      ['var(--bg-success)', 'var(--success)'],
  CANCELLED: ['var(--bg-warm)', 'var(--text-secondary)'],
  REFUNDED:  ['var(--bg-error)', 'var(--danger)'],
}

function PaymentStatusBadge({ status }) {
  const [bg, fg] = PAYMENT_STATUS_COLORS[status] || ['var(--bg-warm)', 'var(--text)']
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color: fg }}>
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  )
}

function PaymentsTab() {
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [newStatus, setNewStatus] = useState('')

  const load = useCallback((p = 0, s = filterStatus) => {
    adminApi.getAdminOrders(p, 10, s)
      .then(r => {
        const d = r.data.data
        setOrders(d.items)
        setPage(d.page)
        setTotalPages(d.totalPages)
      })
      .catch(() => {})
  }, [filterStatus])

  useEffect(() => { load(0) }, [load])

  const handleStatusChange = (val) => { setFilterStatus(val); load(0, val) }

  const handleSaveStatus = async (id) => {
    if (!newStatus) return
    try {
      await adminApi.updatePaymentStatus(id, newStatus)
      setEditingId(null)
      load(page)
    } catch { alert('변경 실패') }
  }

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700 }}>결제 관리</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['', '전체'], ['PENDING', '결제 대기'], ['PAID', '완료'], ['CANCELLED', '취소'], ['REFUNDED', '환불']].map(([v, l]) => (
            <button key={v} style={filterStatus === v ? S.btn() : S.btnOutline} onClick={() => handleStatusChange(v)}>{l}</button>
          ))}
        </div>
      </div>
      <table style={S.table}>
        <thead>
          <tr>
            {['주문번호', '회원', '이메일', '유형', '금액', '결제수단', '결제상태', '주문일', '관리'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>주문 없음</td></tr>
          )}
          {orders.map(o => (
            <tr key={o.id}>
              <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace' }}>{o.orderNumber}</td>
              <td style={S.td}>{o.userName}</td>
              <td style={S.td}>{o.userEmail}</td>
              <td style={S.td}>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: o.orderType === 'BOOK' ? 'var(--bg-indigo)' : 'var(--bg-purple)', color: o.orderType === 'BOOK' ? 'var(--accent)' : 'var(--primary)', fontWeight: 600 }}>
                  {o.orderType === 'BOOK' ? '도서' : '구독'}
                </span>
              </td>
              <td style={S.td}>{o.totalAmount?.toLocaleString()}원</td>
              <td style={S.td}>{o.paymentMethod || '-'}</td>
              <td style={S.td}>
                {editingId === o.id ? (
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    style={{ ...S.input, width: 110, padding: '4px 8px' }}>
                    {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <PaymentStatusBadge status={o.paymentStatus} />
                )}
              </td>
              <td style={S.td}>{o.createdAt?.slice(0, 10)}</td>
              <td style={{ ...S.td, display: 'flex', gap: 6 }}>
                {editingId === o.id ? (
                  <>
                    <button style={S.btn('var(--success)')} onClick={() => handleSaveStatus(o.id)}>저장</button>
                    <button style={S.btn('var(--text-secondary)')} onClick={() => setEditingId(null)}>취소</button>
                  </>
                ) : (
                  <button style={S.btn('var(--warning)')} onClick={() => { setEditingId(o.id); setNewStatus(o.paymentStatus) }}>변경</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); load(p) }} />
    </div>
  )
}

// ── 배송 관리 ───────────────────────────────────────────────────────────────────
const DELIVERY_STATUS_LABELS = { PENDING: '배송 준비', PREPARING: '상품 준비 중', SHIPPING: '배송 중', DELIVERED: '배송 완료' }
const DELIVERY_STATUS_COLORS = {
  PENDING:   ['var(--bg-warm)', 'var(--text-secondary)'],
  PREPARING: ['var(--bg-warning)', 'var(--warning)'],
  SHIPPING:  ['var(--bg-indigo)', 'var(--accent)'],
  DELIVERED: ['var(--bg-success)', 'var(--success)'],
}

function DeliveryStatusBadge({ status }) {
  const [bg, fg] = DELIVERY_STATUS_COLORS[status] || ['var(--bg-warm)', 'var(--text)']
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color: fg }}>
      {DELIVERY_STATUS_LABELS[status] || status}
    </span>
  )
}

function DeliveryModal({ order, onSave, onClose }) {
  const [deliveryStatus, setDeliveryStatus] = useState(order.deliveryStatus || 'PENDING')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(deliveryStatus, trackingNumber) }
    finally { setSaving(false) }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ ...S.card, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>배송 정보 수정</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>주문번호 {order.orderNumber}</p>

        {order.deliveryAddress && (
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>배송지</p>
            <p style={{ color: 'var(--text-secondary)' }}>{order.recipientName} / {order.recipientPhone}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{order.deliveryAddress}</p>
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>배송 상태</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {Object.entries(DELIVERY_STATUS_LABELS).map(([v, l]) => (
            <button key={v} onClick={() => setDeliveryStatus(v)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${deliveryStatus === v ? 'var(--primary)' : 'var(--border)'}`, background: deliveryStatus === v ? 'var(--bg-indigo)' : 'var(--surface)', transition: 'all 0.15s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${deliveryStatus === v ? 'var(--primary)' : 'var(--border)'}`, background: deliveryStatus === v ? 'var(--primary)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {deliveryStatus === v && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--surface)' }} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: deliveryStatus === v ? 'var(--primary)' : 'var(--text)' }}>{l}</span>
            </button>
          ))}
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>운송장 번호 (선택)</label>
        <input style={{ ...S.input, marginBottom: 20 }} placeholder="운송장 번호 입력"
          value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...S.btn('var(--text-secondary)'), flex: 1 }} onClick={onClose}>취소</button>
          <button style={{ ...S.btn(), flex: 2, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DeliveryTab() {
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [editingOrder, setEditingOrder] = useState(null)

  const load = useCallback((p = 0, s = filterStatus) => {
    adminApi.getAdminDeliveries(p, 10, s)
      .then(r => {
        const d = r.data.data
        setOrders(d.items)
        setPage(d.page)
        setTotalPages(d.totalPages)
      })
      .catch(() => {})
  }, [filterStatus])

  useEffect(() => { load(0) }, [load])

  const handleStatusChange = (val) => { setFilterStatus(val); load(0, val) }

  const handleSaveDelivery = async (deliveryStatus, trackingNumber) => {
    try {
      await adminApi.updateDelivery(editingOrder.id, deliveryStatus, trackingNumber)
      setEditingOrder(null)
      load(page)
    } catch { alert('변경 실패') }
  }

  return (
    <>
      {editingOrder && (
        <DeliveryModal
          order={editingOrder}
          onSave={handleSaveDelivery}
          onClose={() => setEditingOrder(null)}
        />
      )}
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700 }}>배송 관리</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['', '전체'], ['PENDING', '배송 준비'], ['PREPARING', '상품 준비 중'], ['SHIPPING', '배송 중'], ['DELIVERED', '완료']].map(([v, l]) => (
            <button key={v} style={filterStatus === v ? S.btn() : S.btnOutline} onClick={() => handleStatusChange(v)}>{l}</button>
          ))}
        </div>
      </div>
      <table style={S.table}>
        <thead>
          <tr>
            {['주문번호', '회원', '수령인', '주소', '상품', '배송상태', '운송장번호', '주문일', '관리'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>배송 주문 없음</td></tr>
          )}
          {orders.map(o => (
            <tr key={o.id}>
              <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace' }}>{o.orderNumber}</td>
              <td style={S.td}>{o.userName}</td>
              <td style={S.td}>{o.recipientName || '-'}</td>
              <td style={{ ...S.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.deliveryAddress || '-'}</td>
              <td style={S.td}>
                {o.items?.length > 0
                  ? `${o.items[0].bookTitle}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ''}`
                  : '-'}
              </td>
              <td style={S.td}><DeliveryStatusBadge status={o.deliveryStatus} /></td>
              <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace' }}>{o.trackingNumber || '-'}</td>
              <td style={S.td}>{o.createdAt?.slice(0, 10)}</td>
              <td style={S.td}>
                <button style={S.btn('var(--primary)')} onClick={() => setEditingOrder(o)}>관리</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); load(p) }} />
    </div>
    </>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────────
const TABS = [
  { label: '대시보드', icon: '📊' },
  { label: '회원 관리', icon: '👥' },
  { label: '면접 세션', icon: '🎤' },
  { label: '도서 관리', icon: '📚' },
  { label: '결제 관리', icon: '💳' },
  { label: '배송 관리', icon: '🚚' },
]

function AdminPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>관리자 패널</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>플랫폼 운영 및 콘텐츠를 관리합니다.</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
            color: activeTab === i ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === i ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, transition: 'color 0.15s',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 0 && <DashboardTab />}
      {activeTab === 1 && <UsersTab />}
      {activeTab === 2 && <SessionsTab />}
      {activeTab === 3 && <BooksTab />}
      {activeTab === 4 && <PaymentsTab />}
      {activeTab === 5 && <DeliveryTab />}
    </div>
  )
}

export default AdminPage
