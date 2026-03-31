const SEED_REVIEWS = {
  1: [
    { id: 's1', author: '김개발', rating: 5, text: '변수명 하나도 허투루 짓지 않게 됐어요. 코드 리뷰할 때마다 다시 읽게 되는 책입니다.', date: '2024-11-03' },
    { id: 's2', author: '박준호', rating: 4, text: '실무에 바로 적용할 수 있는 내용이 많아요. 특히 함수 단일 책임 원칙 파트가 인상적이었습니다.', date: '2024-12-18' },
    { id: 's3', author: '이수진', rating: 5, text: '면접에서 클린 코드 원칙 물어볼 때 이 책 덕분에 자신 있게 답변했어요!', date: '2025-01-07' },
  ],
  2: [
    { id: 's1', author: '최현우', rating: 5, text: 'CS 전반을 빠르게 훑을 수 있어서 면접 직전에 정말 도움됐어요.', date: '2024-10-22' },
    { id: 's2', author: '강민지', rating: 4, text: '깊이보다는 폭이 넓은 책이라 개념 정리용으로 최고입니다.', date: '2025-01-15' },
  ],
  3: [
    { id: 's1', author: 'David K.', rating: 5, text: 'JavaScript의 거의 모든 것이 담겨 있어요. 곁에 두고 필요할 때마다 찾아보는 레퍼런스 북입니다.', date: '2024-09-30' },
    { id: 's2', author: '임태양', rating: 4, text: '두껍지만 그만큼 내용이 알차요. 제너레이터, 프록시 챕터가 특히 좋았습니다.', date: '2024-12-01' },
  ],
  4: [
    { id: 's1', author: '정하은', rating: 5, text: '실전 프로젝트 위주라 따라 하다 보면 자연스럽게 실력이 늘어요.', date: '2025-01-20' },
    { id: 's2', author: '오세훈', rating: 4, text: 'JPA 연관관계 파트가 가장 유익했어요. N+1 문제 해결법도 잘 나와 있습니다.', date: '2025-02-10' },
  ],
  5: [
    { id: 's1', author: '한지민', rating: 5, text: '코딩 테스트 준비하면서 제일 많이 펼쳐봤어요. 동적 계획법 챕터가 탁월합니다.', date: '2024-08-14' },
    { id: 's2', author: '류승민', rating: 5, text: '문제 접근 방식을 체계적으로 잡아주는 책. 취업 준비생 필독서입니다.', date: '2024-11-28' },
    { id: 's3', author: '서지원', rating: 4, text: '난이도가 있지만 끝까지 보면 확실히 실력이 올라가요.', date: '2025-01-02' },
  ],
  6: [
    { id: 's1', author: '윤채은', rating: 5, text: '면접 준비 2주 만에 이 책으로 CS 전체를 정리했어요. 강추합니다!', date: '2024-10-05' },
    { id: 's2', author: '장민석', rating: 4, text: '디자인 패턴 파트는 예제가 조금 더 있었으면 했지만 전체적으로 만족스러워요.', date: '2024-12-23' },
  ],
}

const KEY = (id) => `bookReviews_${id}`

export function getBookReviews(bookId) {
  try {
    const raw = localStorage.getItem(KEY(bookId))
    if (raw) return JSON.parse(raw)
    const seed = SEED_REVIEWS[bookId] || []
    localStorage.setItem(KEY(bookId), JSON.stringify(seed))
    return seed
  } catch {
    return SEED_REVIEWS[bookId] || []
  }
}

export function saveBookReviews(bookId, reviews) {
  try { localStorage.setItem(KEY(bookId), JSON.stringify(reviews)) } catch {}
}

export function getBookRatingSummary(bookId) {
  const reviews = getBookReviews(bookId)
  if (reviews.length === 0) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { avg: avg.toFixed(1), count: reviews.length }
}
