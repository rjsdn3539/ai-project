import { useState } from 'react'

const FAQ_DATA = [
  {
    category: '서비스 이용',
    icon: '🧭',
    items: [
      {
        q: 'AI 면접 플랫폼은 어떻게 이용하나요?',
        a: '회원가입 후 로그인하면 [면접 시작] 메뉴에서 직종과 채용공고를 선택해 면접을 시작할 수 있습니다. AI가 실시간으로 질문을 생성하고 답변에 대한 피드백을 제공합니다.',
      },
      {
        q: '면접은 어떤 방식으로 진행되나요?',
        a: '텍스트 입력 방식으로 진행됩니다. AI가 직종과 채용공고를 분석하여 맞춤형 질문을 생성하고, 답변을 입력하면 관련성·논리성·구체성 등 다각도로 피드백을 제공합니다.',
      },
      {
        q: '면접 결과는 어디서 확인하나요?',
        a: '[면접 기록] 메뉴에서 지금까지 진행한 모든 면접 결과를 확인할 수 있습니다. 각 세션을 클릭하면 질문별 상세 피드백과 약점 분석을 볼 수 있습니다.',
      },
      {
        q: 'AI 학습 기능은 무엇인가요?',
        a: 'AI 학습은 면접 관련 이론과 실무 지식을 퀴즈 형태로 학습하는 기능입니다. 배치고사를 통해 현재 수준을 진단하고 맞춤 학습 경로를 제공합니다. 틀린 문제는 오답노트에 자동 저장됩니다.',
      },
    ],
  },
  {
    category: '구독 및 결제',
    icon: '💳',
    items: [
      {
        q: '무료 플랜에서는 무엇을 이용할 수 있나요?',
        a: '무료 플랜에서는 월 1회 면접, 일 20문제 학습 퀴즈, 피드백 요약, 프로필 문서 각 1개 등록, 도서 구매가 가능합니다.',
      },
      {
        q: '구독 플랜은 어떻게 변경하나요?',
        a: '[구독 플랜] 메뉴에서 원하는 플랜의 버튼을 클릭하면 업그레이드 또는 다운그레이드가 가능합니다. 업그레이드는 결제 후 즉시 적용되며, 다운그레이드는 확인 후 즉시 적용됩니다.',
      },
      {
        q: '결제 수단은 어떤 것이 지원되나요?',
        a: '카카오페이, 토스페이, 토스페이먼츠를 통해 결제할 수 있습니다. 신용카드, 체크카드, 계좌이체 등이 지원됩니다.',
      },
      {
        q: '연간 구독의 혜택은 무엇인가요?',
        a: '연간 구독 선택 시 월간 결제 대비 최대 17% 할인된 가격으로 이용 가능합니다. 결제 시점부터 1년간 유효합니다.',
      },
      {
        q: '환불 정책은 어떻게 되나요?',
        a: '결제일로부터 7일 이내, 서비스를 이용하지 않은 경우 전액 환불이 가능합니다. 이용 이력이 있거나 7일이 경과한 경우 잔여 기간에 대한 일할 계산 환불이 적용됩니다. 자세한 사항은 문의하기를 통해 문의해주세요.',
      },
    ],
  },
  {
    category: '면접 기능',
    icon: '🎤',
    items: [
      {
        q: '면접 질문은 어떻게 생성되나요?',
        a: '채용공고 URL 또는 직접 입력한 공고 내용을 AI가 분석하여 해당 직무에 맞는 질문을 생성합니다. 이력서와 자기소개서를 등록하면 더욱 개인화된 질문을 받을 수 있습니다.',
      },
      {
        q: '질문 개수는 몇 개까지 설정할 수 있나요?',
        a: '플랜에 따라 질문 수가 다릅니다. 무료 플랜은 기본 5개이며, STANDARD는 최대 3개, PRO/PREMIUM은 최대 10개까지 설정 가능합니다.',
      },
      {
        q: '면접 도중 나갈 수 있나요?',
        a: '면접 도중 페이지를 이탈하면 세션이 종료될 수 있습니다. 작성 중인 답변은 저장되지 않으니 답변 제출 후 이탈하시기 바랍니다.',
      },
      {
        q: '면접 기록은 얼마나 보관되나요?',
        a: '무료 플랜은 최근 기록만 확인 가능하며, STANDARD는 3개월, PRO·PREMIUM은 무기한 보관됩니다.',
      },
    ],
  },
  {
    category: '계정 관련',
    icon: '👤',
    items: [
      {
        q: '비밀번호를 변경하려면 어떻게 하나요?',
        a: '[내 프로필] → [내 정보 수정] 탭에서 현재 비밀번호 확인 후 새 비밀번호로 변경할 수 있습니다. 새 비밀번호는 8자 이상이어야 합니다.',
      },
      {
        q: '이름(닉네임)을 변경할 수 있나요?',
        a: '[내 프로필] → [내 정보 수정] 탭에서 이름을 변경할 수 있습니다. 변경 후 사이드바와 화면 곳곳에 즉시 반영됩니다.',
      },
      {
        q: '회원 탈퇴는 어떻게 하나요?',
        a: '현재 앱 내 직접 탈퇴 기능은 준비 중입니다. 탈퇴를 원하시면 문의하기를 통해 요청해주시면 처리해드립니다.',
      },
      {
        q: '이메일(아이디)을 변경할 수 있나요?',
        a: '현재 이메일 변경은 지원하지 않습니다. 변경이 필요한 경우 문의하기를 통해 문의해주세요.',
      },
    ],
  },
]

function FaqPage() {
  const [openKey, setOpenKey] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  const toggle = (key) => setOpenKey(openKey === key ? null : key)

  const filtered = activeCategory
    ? FAQ_DATA.filter((c) => c.category === activeCategory)
    : FAQ_DATA

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>자주 묻는 질문</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>찾으시는 답변이 없으면 문의하기를 이용해주세요.</p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
            background: !activeCategory ? '#7c6af0' : 'var(--bg)',
            color: !activeCategory ? '#fff' : 'var(--text-secondary)',
            border: !activeCategory ? 'none' : '1px solid var(--border)',
          }}
        >
          전체
        </button>
        {FAQ_DATA.map(({ category, icon }) => (
          <button
            key={category}
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            style={{
              padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
              background: activeCategory === category ? '#7c6af0' : 'var(--bg)',
              color: activeCategory === category ? '#fff' : 'var(--text-secondary)',
              border: activeCategory === category ? 'none' : '1px solid var(--border)',
            }}
          >
            {icon} {category}
          </button>
        ))}
      </div>

      {/* FAQ items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filtered.map(({ category, icon, items }) => (
          <div key={category}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7c6af0', letterSpacing: '0.05em' }}>
                {category.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map((item, i) => {
                const key = `${category}-${i}`
                const isOpen = openKey === key
                return (
                  <div
                    key={key}
                    style={{
                      background: 'var(--surface)', borderRadius: 12,
                      border: isOpen ? '1px solid rgba(124,106,240,0.3)' : '1px solid var(--border-light)',
                      overflow: 'hidden', transition: 'all 0.2s',
                      boxShadow: isOpen ? '0 4px 16px rgba(124,106,240,0.1)' : 'var(--shadow-sm)',
                    }}
                  >
                    <button
                      onClick={() => toggle(key)}
                      style={{
                        width: '100%', padding: '16px 18px', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                        Q. {item.q}
                      </span>
                      <span style={{
                        fontSize: 18, color: isOpen ? '#7c6af0' : 'var(--text-muted)',
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'transform 0.2s', flexShrink: 0,
                      }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 18px 16px',
                        borderTop: '1px solid rgba(124,106,240,0.1)',
                        paddingTop: 14,
                      }}>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        marginTop: 36, background: 'linear-gradient(135deg, rgba(124,106,240,0.08), rgba(14,165,233,0.06))',
        border: '1px solid rgba(124,106,240,0.15)', borderRadius: 14,
        padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>원하는 답변을 찾지 못하셨나요?</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>문의하기를 통해 직접 질문을 남겨주세요.</p>
        </div>
        <a
          href="/inquiry"
          style={{
            padding: '10px 22px', borderRadius: 10, background: '#7c6af0',
            color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            whiteSpace: 'nowrap', transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          문의하기 →
        </a>
      </div>
    </div>
  )
}

export default FaqPage
