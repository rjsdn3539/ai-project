import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import * as inquiryApi from '../api/inquiry'

const CATEGORIES = ['서비스 이용 문의', '구독/결제 문의', '오류/버그 신고', '기능 제안', '계정 관련', '기타']

function InquiryPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const createInitialForm = () => ({
    name: user?.name || '',
    email: user?.email || '',
    category: '',
    subject: '',
    message: '',
  })

  const [form, setForm] = useState(createInitialForm)
  const [submittedInquiry, setSubmittedInquiry] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = '이름을 입력해주세요.'
    if (!form.email.trim()) nextErrors.email = '이메일을 입력해주세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    if (!form.category) nextErrors.category = '문의 유형을 선택해주세요.'
    if (!form.subject.trim()) nextErrors.subject = '제목을 입력해주세요.'
    if (!form.message.trim()) nextErrors.message = '문의 내용을 입력해주세요.'
    else if (form.message.trim().length < 10) nextErrors.message = '내용을 10자 이상 입력해주세요.'

    return nextErrors
  }

  const resetForm = () => {
    setForm(createInitialForm())
    setSubmittedInquiry(null)
    setErrors({})
    setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await inquiryApi.createInquiry(form)
      setSubmittedInquiry(response.data.data)
    } catch (error) {
      setSubmitError(
        error?.response?.data?.error?.message
          || error?.response?.data?.message
          || '문의 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 900, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>로그인이 필요합니다</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
          문의하기는 로그인 후 이용할 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/auth/login', { state: { from: '/inquiry' } })}
          style={{
            padding: '12px 32px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          로그인하기
        </button>
      </div>
    )
  }

  if (submittedInquiry) {
    return (
      <div style={{ maxWidth: 900, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>문의가 저장되었습니다</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
          문의 번호는 <strong>{submittedInquiry.id}</strong> 입니다.
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
          관리자가 확인 후 답변을 등록하면 내 문의에서 바로 확인할 수 있습니다.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={resetForm}
            style={{
              padding: '11px 24px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            추가 문의하기
          </button>
          <button
            onClick={() => navigate('/my-inquiries')}
            style={{
              padding: '11px 24px',
              borderRadius: 10,
              border: 'none',
              background: '#7c6af0',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            내 문의 보기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>문의하기</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          궁금한 점이나 불편한 사항을 남겨주세요. 문의를 저장한 뒤 내 문의에서 진행 상태를 확인할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="이름" error={errors.name}>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="홍길동"
                style={inputStyle(Boolean(errors.name))}
              />
            </Field>
            <Field label="이메일" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="example@email.com"
                style={inputStyle(Boolean(errors.email))}
              />
            </Field>
          </div>

          <Field label="문의 유형" error={errors.category}>
            <select
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              style={{ ...inputStyle(Boolean(errors.category)), color: form.category ? 'var(--text)' : 'var(--text-muted)' }}
            >
              <option value="">문의 유형 선택</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>

          <Field label="제목" error={errors.subject}>
            <input
              value={form.subject}
              onChange={(event) => updateField('subject', event.target.value)}
              placeholder="문의 제목을 입력해주세요"
              style={inputStyle(Boolean(errors.subject))}
            />
          </Field>

          <Field label="문의 내용" error={errors.message}>
            <textarea
              value={form.message}
              onChange={(event) => updateField('message', event.target.value)}
              placeholder="문의하실 내용을 자세히 적어주세요. (10자 이상)"
              rows={7}
              style={{ ...inputStyle(Boolean(errors.message)), resize: 'vertical', minHeight: 140 }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {form.message.length}자
            </div>
          </Field>

          <div style={{
            background: 'var(--bg-purple)',
            border: '1px solid rgba(124,106,240,0.2)',
            borderRadius: 10,
            padding: '13px 16px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            오류/버그 신고의 경우, 발생 상황과 사용 중인 브라우저 정보를 함께 기재해주시면 빠른 처리에 도움이 됩니다.
          </div>

          {submitError && (
            <div style={{
              background: 'var(--bg-error)',
              border: '1px solid var(--border-error)',
              color: 'var(--danger)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
            }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #7c6af0, #0ea5e9)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '문의 저장 중...' : '문의 제출하기'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '10px 13px',
  borderRadius: 9,
  border: `1.5px solid ${hasError ? '#ef4444' : 'var(--border)'}`,
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
})

export default InquiryPage
