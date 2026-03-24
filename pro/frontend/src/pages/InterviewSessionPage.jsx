import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as interviewApi from '../api/interview'
import Button from '../components/Button'

function RecordButton({ recording, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: recording ? '#ef4444' : '#4f46e5',
        border: 'none', cursor: 'pointer', color: '#fff',
        fontSize: '28px', boxShadow: recording ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none',
        transition: 'all 0.2s',
        animation: recording ? 'pulse 1s infinite' : 'none',
      }}
    >
      {recording ? '⏹' : '🎤'}
    </button>
  )
}

function InterviewSessionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const sessionId = state?.sessionId

  const [question, setQuestion] = useState('')
  const [questionNum, setQuestionNum] = useState(1)
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [done, setDone] = useState(false)
  const [inputMode, setInputMode] = useState('voice') // 'voice' | 'text'
  const [textAnswer, setTextAnswer] = useState('')

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (!sessionId) { navigate('/interview/setup'); return }
    loadNextQuestion()
  }, [])

  useEffect(() => {
    if (question) speakQuestion(question)
  }, [question])

  const loadNextQuestion = async () => {
    try {
      const { data } = await interviewApi.getSession(sessionId)
      const qa = data.data?.qaList || []
      const pending = qa.find((q) => !q.answerText)
      if (pending) {
        setQuestion(pending.question)
        setQuestionNum(qa.length)
      } else {
        // 새 질문 요청은 백엔드가 처리
        setQuestion(data.data?.currentQuestion || '면접을 시작하겠습니다. 자기소개 부탁드립니다.')
      }
    } catch {
      setQuestion('자기소개 부탁드립니다.')
    }
  }

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    window.speechSynthesis.speak(utterance)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch {
      alert('마이크 접근 권한이 필요합니다.')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }

  const handleRecordToggle = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (inputMode === 'text') {
        if (!textAnswer.trim()) { alert('답변을 입력하세요.'); return }
        await interviewApi.submitTextAnswer(sessionId, textAnswer.trim())
        setTextAnswer('')
      } else {
        if (!recordedBlob) { alert('먼저 답변을 녹음하세요.'); return }
        const formData = new FormData()
        formData.append('audio', recordedBlob, 'answer.webm')
        await interviewApi.submitAnswer(sessionId, formData)
        setRecordedBlob(null)
      }
      setQuestionNum((n) => n + 1)

      if (questionNum >= 5) {
        await interviewApi.endSession(sessionId)
        setDone(true)
      } else {
        await loadNextQuestion()
      }
    } catch {
      alert('답변 제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>면접이 완료되었습니다!</h2>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>AI가 피드백을 분석 중입니다...</p>
        <Button onClick={() => navigate(`/interview/result/${sessionId}`)}>피드백 보기</Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>AI 모의 면접</h1>
        <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
          {questionNum} / 5 질문
        </span>
      </div>

      {/* 질문 카드 */}
      <div style={{ background: '#4f46e5', borderRadius: '16px', padding: '32px', marginBottom: '32px', color: '#fff' }}>
        <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px', letterSpacing: '1px' }}>QUESTION {questionNum}</p>
        <p style={{ fontSize: '20px', lineHeight: '1.7', fontWeight: '500' }}>{question || '질문을 불러오는 중...'}</p>
      </div>

      {/* 입력 모드 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['voice', 'text'].map((mode) => (
          <button key={mode} onClick={() => setInputMode(mode)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
            background: inputMode === mode ? '#4f46e5' : '#e5e7eb',
            color: inputMode === mode ? '#fff' : '#374151',
          }}>
            {mode === 'voice' ? '🎤 음성 답변' : '⌨️ 텍스트 답변'}
          </button>
        ))}
      </div>

      {/* 답변 영역 */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        {inputMode === 'voice' ? (
          <>
            <RecordButton recording={recording} onClick={handleRecordToggle} />
            <p style={{ marginTop: '16px', fontSize: '14px', color: recording ? '#ef4444' : '#6b7280', fontWeight: recording ? '600' : '400' }}>
              {recording ? `녹음 중... ${recordingTime}초` : recordedBlob ? '녹음 완료 ✓' : '버튼을 눌러 답변을 녹음하세요'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              {recordedBlob && !recording && (
                <Button variant="outline" onClick={() => setRecordedBlob(null)}>다시 녹음</Button>
              )}
              <Button loading={submitting} onClick={handleSubmit} disabled={!recordedBlob || recording}>
                답변 제출
              </Button>
            </div>
          </>
        ) : (
          <>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="답변을 입력하세요..."
              style={{
                width: '100%', minHeight: '160px', padding: '14px', fontSize: '15px',
                border: '1px solid #d1d5db', borderRadius: '10px', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <div style={{ marginTop: '16px' }}>
              <Button loading={submitting} onClick={handleSubmit} disabled={!textAnswer.trim()}>
                답변 제출
              </Button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 8px rgba(239,68,68,0.2)} 50%{box-shadow:0 0 0 14px rgba(239,68,68,0.1)} }`}</style>
    </div>
  )
}

export default InterviewSessionPage
