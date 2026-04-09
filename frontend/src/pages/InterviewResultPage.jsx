import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as interviewApi from '../api/interview'
import Button from '../components/Button'
import useAuthStore from '../store/authStore'
import {
  checkAndUnlock,
  addBookmark,
  removeBookmark,
  isBookmarked,
  ensureAchievementStateLoaded,
} from '../utils/achievements'

const SUBJECT_ICON = {
  '자바': '☕', '스프링': '🍃', '데이터베이스': '🗄️',
  '자바스크립트': '🟨', '파이썬': '🐍', 'C++': '⚡',
  '네트워크': '🌐', '운영체제': '🖥️', '알고리즘': '🧮',
}

function ScoreRing({ label, score, size = 80 }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : '#ef4444'
  const bg = score >= 80 ? 'var(--bg-success)' : score >= 60 ? 'var(--bg-warning)' : 'var(--bg-error)'
  const deg = score * 3.6
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', margin: '0 auto 10px',
        background: `conic-gradient(${color} ${deg}deg, #e2e8f0 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 4px #fff, 0 0 0 5px ${color}20`,
      }}>
        <div style={{
          width: size - 18, height: size - 18, borderRadius: '50%',
          background: 'var(--surface)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column',
        }}>
          <span style={{ fontSize: size / 4.5, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

function FeedbackCard({ icon, title, content, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12, padding: '20px',
      border: `1px solid ${accent}30`, marginBottom: 12,
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{title}</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 14 }}>{content}</p>
    </div>
  )
}

const TIER_ORDER = { FREE: 0, STANDARD: 1, PRO: 2, PREMIUM: 3 }

function CoachChat({ sessionId, feedback, positionTitle }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 면접 코치 AI입니다. 면접 결과에 대해 궁금한 점을 자유롭게 질문해주세요. 예) "왜 점수가 낮게 나왔나요?", "더 좋은 답변을 알려주세요"' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const allMessages = [...messages, userMsg]
      const { data } = await interviewApi.chatWithCoach(sessionId, {
        messages: allMessages,
        weakPoints: feedback?.weakPoints || '',
        improvements: feedback?.improvements || '',
        recommendedAnswer: feedback?.recommendedAnswer || '',
        positionTitle: positionTitle || '',
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'AI 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px', borderRadius: 12,
          border: '1.5px solid var(--primary)', background: open ? 'var(--primary)' : 'var(--primary-light)',
          color: open ? '#fff' : 'var(--primary)', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span>🤖</span>
        {open ? 'AI 코치 닫기' : 'AI 코치에게 질문하기'}
      </button>

      {open && (
        <div style={{
          background: 'var(--surface)', borderRadius: 14, border: '1.5px solid var(--primary)',
          marginTop: 8, overflow: 'hidden',
        }}>
          {/* 메시지 영역 */}
          <div style={{ height: 320, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: 13, lineHeight: 1.7,
                  border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'var(--bg)', border: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text-muted)' }}>
                  답변 작성 중...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력 영역 */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="질문을 입력하세요..."
              disabled={sending}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: sending || !input.trim() ? 'var(--bg)' : 'var(--primary)',
                color: sending || !input.trim() ? 'var(--text-muted)' : '#fff',
                fontWeight: 700, fontSize: 13, cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >전송</button>
          </div>
        </div>
      )}
    </div>
  )
}

function InterviewResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [report, setReport] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewOpen, setReviewOpen] = useState(null)
  const [bookmarked, setBookmarked] = useState({})
  const [learningTopics, setLearningTopics] = useState(null)
  const [topicsLoading, setTopicsLoading] = useState(false)

  const tier = user?.subscriptionTier || 'FREE'
  const canReview = TIER_ORDER[tier] >= TIER_ORDER['STANDARD']
  const canSeeModelAnswer = tier === 'PREMIUM'

  useEffect(() => {
    Promise.all([
      interviewApi.getFeedback(id),
      ensureAchievementStateLoaded(true),
    ])
      .then(([{ data }]) => {
        const d = data.data
        setReport(d)
        const fb = d.feedback
        setFeedback(fb)

        // Initialize bookmarked state from localStorage
        if (d.questions?.length > 0) {
          const bm = {}
          d.questions.forEach((q) => {
            if (q.id) bm[q.id] = isBookmarked(String(q.id))
          })
          setBookmarked(bm)
        }

        // Fetch AI-based learning topic recommendations
        setTopicsLoading(true)
        interviewApi.getLearningTopics(id)
          .then(({ data: topicsData }) => setLearningTopics(topicsData.data?.topics || []))
          .catch(() => setLearningTopics([]))
          .finally(() => setTopicsLoading(false))
      })
      .catch(() => setFeedback({
        logicScore: 75, relevanceScore: 82, specificityScore: 68, overallScore: 75,
        weakPoints: '구체적인 수치나 사례가 부족했습니다.',
        improvements: '경험을 STAR 기법(상황-과제-행동-결과)으로 구체화해보세요.',
        recommendedAnswer: '저는 ~프로젝트에서 ~문제를 해결했습니다. 구체적으로는...',
      }))
      .finally(() => setLoading(false))
  }, [id])

  const handleBookmarkToggle = async (q) => {
    const qId = String(q.id || q.sequenceNumber)
    const currently = bookmarked[qId]
    if (currently) {
      await removeBookmark(qId)
      setBookmarked((prev) => ({ ...prev, [qId]: false }))
    } else {
      await addBookmark({
        id: qId,
        questionText: q.questionText,
        answerText: q.answer?.answerText || '',
        sessionId: id,
        date: new Date().toISOString(),
      })
      setBookmarked((prev) => ({ ...prev, [qId]: true }))
    }

    await checkAndUnlock()
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 15 }}>피드백을 불러오는 중...</p>
      </div>
    )
  }

  const overall = feedback.overallScore
  const overallColor = overall >= 80 ? 'var(--success)' : overall >= 60 ? 'var(--warning)' : '#ef4444'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>면접 결과</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>AI 면접관의 종합 피드백입니다.</p>
      </div>

      {/* Overall score */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        borderRadius: 16, padding: '36px', textAlign: 'center', marginBottom: 20,
        color: '#fff', boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.1em', fontWeight: 600 }}>OVERALL SCORE</p>
        <div style={{ fontSize: 72, fontWeight: 800, color: overallColor, lineHeight: 1, marginBottom: 6 }}>
          {overall}
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>/ 100</div>
        <div style={{
          display: 'inline-block', marginTop: 14,
          background: `${overallColor}20`, color: overallColor,
          borderRadius: 20, padding: '5px 16px', fontSize: 13, fontWeight: 700,
        }}>
          {overall >= 80 ? '우수한 답변' : overall >= 60 ? '양호한 답변' : '개선이 필요합니다'}
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: '28px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: 16,
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 24 }}>항목별 점수</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <ScoreRing label="논리성" score={feedback.logicScore} />
          <ScoreRing label="적절성" score={feedback.relevanceScore} />
          <ScoreRing label="구체성" score={feedback.specificityScore} />
        </div>
      </div>

      {/* Feedback details */}
      <FeedbackCard icon="⚠️" title="부족한 부분" content={feedback.weakPoints} accent="#f59e0b" />
      <FeedbackCard icon="💡" title="개선 방향" content={feedback.improvements} accent="#4f46e5" />

      {/* 모범 답안 — PREMIUM 전용 */}
      {canSeeModelAnswer ? (
        <FeedbackCard icon="✨" title="모범 답안" content={feedback.recommendedAnswer} accent="#22c55e" />
      ) : (
        <div style={{
          background: 'var(--surface)', borderRadius: 12, padding: '20px',
          border: '1px solid var(--border-light)', marginBottom: 12,
          borderLeft: '3px solid #22c55e',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 블러 처리된 미리보기 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>모범 답안</h3>
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: '#fff', borderRadius: 99, padding: '2px 8px',
            }}>PREMIUM</span>
          </div>
          <div style={{ position: 'relative' }}>
            <p style={{
              color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 14,
              filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none',
              margin: 0,
            }}>
              {feedback.recommendedAnswer || '저는 해당 상황에서 먼저 문제의 핵심을 파악하고, 팀원들과 명확한 역할 분담을 통해 체계적으로 접근했습니다. 구체적으로는 주간 스프린트를 도입하여 진행 상황을 가시화하고...'}
            </p>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Premium 플랜에서 이용 가능합니다
              </p>
              <button
                onClick={() => navigate('/subscription')}
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                플랜 업그레이드 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 질문 복기 */}
      <div style={{ marginTop: 16 }}>
        {canReview && report?.questions?.length > 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔁</span>
              <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: 0 }}>질문 복기</h2>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{report.questions.length}개 질문</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {report.questions.map((q, i) => {
                const qId = String(q.id || q.sequenceNumber || i)
                const isQBookmarked = bookmarked[qId] || false
                return (
                <div key={q.id || i} style={{ borderBottom: i < report.questions.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => setReviewOpen(reviewOpen === i ? null : i)}
                      style={{
                        flex: 1, padding: '16px 24px', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
                        textAlign: 'left', fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#7c6af0', background: 'rgba(124,106,240,0.1)', borderRadius: 6, padding: '3px 8px', flexShrink: 0, marginTop: 1 }}>
                        Q{q.sequenceNumber || i + 1}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>{q.questionText}</span>
                      <span style={{ fontSize: 16, color: reviewOpen === i ? '#7c6af0' : 'var(--text-muted)', transform: reviewOpen === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: 2 }}>▾</span>
                    </button>
                    {/* Bookmark button */}
                    <button
                      onClick={() => handleBookmarkToggle({ ...q, id: qId })}
                      title={isQBookmarked ? '북마크 제거' : '북마크 추가'}
                      style={{
                        flexShrink: 0,
                        margin: '12px 16px 12px 0',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: `1.5px solid ${isQBookmarked ? '#f59e0b' : 'var(--border)'}`,
                        background: isQBookmarked ? 'rgba(245,158,11,0.12)' : 'var(--bg)',
                        color: isQBookmarked ? '#f59e0b' : 'var(--text-muted)',
                        fontSize: 16,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        lineHeight: 1,
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => {
                        if (!isQBookmarked) {
                          e.currentTarget.style.borderColor = '#f59e0b'
                          e.currentTarget.style.color = '#f59e0b'
                          e.currentTarget.style.background = 'rgba(245,158,11,0.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isQBookmarked) {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.color = 'var(--text-muted)'
                          e.currentTarget.style.background = 'var(--bg)'
                        }
                      }}
                    >
                      📌
                    </button>
                  </div>
                  {reviewOpen === i && (
                    <div style={{ padding: '0 24px 16px', paddingLeft: 56 }}>
                      {q.answer?.answerText ? (
                        <div style={{ background: 'var(--bg-purple)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(124,106,240,0.15)' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#7c6af0', marginBottom: 8 }}>내 답변</p>
                          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{q.answer.answerText}</p>
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>답변이 저장되지 않았습니다.</p>
                      )}
                    </div>
                  )}
                </div>
              )
              })}
            </div>
          </div>
        ) : !canReview ? (
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1.5px dashed var(--border)', padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>질문 복기는 Standard 이상 플랜에서 이용 가능합니다</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>면접에서 나왔던 질문과 내 답변을 다시 확인하세요.</p>
            <button
              onClick={() => navigate('/subscription')}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c6af0, #0ea5e9)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              플랜 업그레이드 →
            </button>
          </div>
        ) : null}
      </div>

      {/* 추천 학습 섹션 */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: '24px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
        marginTop: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>📚</span>
          <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: 0 }}>AI 맞춤 학습 추천</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          면접 피드백을 AI가 분석해 부족한 개념을 콕 집어 추천합니다.
        </p>
        {topicsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
            🤖 AI가 학습 주제를 분석 중입니다...
          </div>
        ) : learningTopics && learningTopics.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {learningTopics.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate('/learning/session', {
                  state: { subject: item.subject, difficulty: 'MEDIUM', count: 10 }
                })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  border: '1.5px solid #4f46e520',
                  background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                  fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.2)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{SUBJECT_ICON[item.subject] || '📖'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5', margin: 0 }}>{item.topic}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.5 }}>{item.reason}</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.08)',
                  borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                }}>{item.subject}</span>
                <span style={{ fontSize: 12, color: '#7c3aed', flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
            추천 학습 주제를 불러올 수 없습니다.
          </p>
        )}
      </div>

      <CoachChat sessionId={id} feedback={feedback} positionTitle={report?.positionTitle} />

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Button variant="ghost" onClick={() => navigate('/interview/setup')}>다시 면접하기</Button>
        <Button onClick={() => navigate('/dashboard')}>대시보드로 →</Button>
      </div>
    </div>
  )
}

export default InterviewResultPage
