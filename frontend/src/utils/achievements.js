// ── Achievement Definitions ──────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // ── INTERVIEW ──────────────────────────────────────────────────────────────
  {
    id: 'first_interview',
    category: 'INTERVIEW',
    icon: '🎤',
    title: '첫 면접 완료',
    description: 'AI 모의 면접을 처음으로 완료했어요',
    tier: 'bronze',
    condition: (s) => s.totalInterviews >= 1,
    hint: '면접을 1회 완료하세요',
  },
  {
    id: 'interview_3',
    category: 'INTERVIEW',
    icon: '🎤',
    title: '열정 면접러',
    description: '면접을 3회 완료했어요',
    tier: 'bronze',
    condition: (s) => s.totalInterviews >= 3,
    hint: '면접을 3회 완료하세요',
  },
  {
    id: 'interview_5',
    category: 'INTERVIEW',
    icon: '🎤',
    title: '면접 마라토너',
    description: '면접을 5회 완료했어요',
    tier: 'silver',
    condition: (s) => s.totalInterviews >= 5,
    hint: '면접을 5회 완료하세요',
  },
  {
    id: 'interview_10',
    category: 'INTERVIEW',
    icon: '🎤',
    title: '면접 고수',
    description: '면접을 10회 완료했어요',
    tier: 'gold',
    condition: (s) => s.totalInterviews >= 10,
    hint: '면접을 10회 완료하세요',
  },
  {
    id: 'interview_20',
    category: 'INTERVIEW',
    icon: '🎤',
    title: '면접 달인',
    description: '면접을 20회 완료했어요',
    tier: 'gold',
    condition: (s) => s.totalInterviews >= 20,
    hint: '면접을 20회 완료하세요',
  },
  {
    id: 'interview_30',
    category: 'INTERVIEW',
    icon: '🎤',
    title: '면접 레전드',
    description: '면접을 30회 완료했어요',
    tier: 'diamond',
    condition: (s) => s.totalInterviews >= 30,
    hint: '면접을 30회 완료하세요',
  },
  {
    id: 'score_70',
    category: 'INTERVIEW',
    icon: '🎯',
    title: '합격 가능성',
    description: '면접 점수 70점 이상 달성',
    tier: 'bronze',
    condition: (s) => s.bestScore >= 70,
    hint: '면접 점수 70점 이상을 달성하세요',
  },
  {
    id: 'score_80',
    category: 'INTERVIEW',
    icon: '🎯',
    title: '우수 답변자',
    description: '면접 점수 80점 이상 달성',
    tier: 'silver',
    condition: (s) => s.bestScore >= 80,
    hint: '면접 점수 80점 이상을 달성하세요',
  },
  {
    id: 'score_90',
    category: 'INTERVIEW',
    icon: '🎯',
    title: '우수 응시자',
    description: '면접 점수 90점 이상 달성',
    tier: 'gold',
    condition: (s) => s.bestScore >= 90,
    hint: '면접 점수 90점 이상을 달성하세요',
  },
  {
    id: 'score_100',
    category: 'INTERVIEW',
    icon: '🏆',
    title: '완벽한 면접',
    description: '면접 만점을 달성했어요!',
    tier: 'diamond',
    condition: (s) => s.bestScore >= 100,
    hint: '면접에서 100점 만점을 달성하세요',
  },

  // ── STUDY ──────────────────────────────────────────────────────────────────
  {
    id: 'first_study',
    category: 'STUDY',
    icon: '📚',
    title: '학습 시작',
    description: 'AI 학습을 처음 완료했어요',
    tier: 'bronze',
    condition: (s) => s.totalStudyProblems >= 1,
    hint: '학습 문제를 1개 이상 풀어보세요',
  },
  {
    id: 'study_10',
    category: 'STUDY',
    icon: '📚',
    title: '열공 중',
    description: '학습 문제를 10개 풀었어요',
    tier: 'bronze',
    condition: (s) => s.totalStudyProblems >= 10,
    hint: '학습 문제를 10개 풀어보세요',
  },
  {
    id: 'study_30',
    category: 'STUDY',
    icon: '📚',
    title: '꾸준한 학습자',
    description: '학습 문제를 30개 풀었어요',
    tier: 'bronze',
    condition: (s) => s.totalStudyProblems >= 30,
    hint: '학습 문제를 30개 풀어보세요',
  },
  {
    id: 'study_50',
    category: 'STUDY',
    icon: '📚',
    title: '학습 전문가',
    description: '학습 문제를 50개 풀었어요',
    tier: 'silver',
    condition: (s) => s.totalStudyProblems >= 50,
    hint: '학습 문제를 50개 풀어보세요',
  },
  {
    id: 'study_100',
    category: 'STUDY',
    icon: '📚',
    title: '지식의 달인',
    description: '학습 문제를 100개 풀었어요',
    tier: 'gold',
    condition: (s) => s.totalStudyProblems >= 100,
    hint: '학습 문제를 100개 풀어보세요',
  },
  {
    id: 'study_200',
    category: 'STUDY',
    icon: '📚',
    title: '지식 탐험가',
    description: '학습 문제를 200개 풀었어요',
    tier: 'gold',
    condition: (s) => s.totalStudyProblems >= 200,
    hint: '학습 문제를 200개 풀어보세요',
  },
  {
    id: 'study_300',
    category: 'STUDY',
    icon: '📚',
    title: '학습 마스터',
    description: '학습 문제를 300개 풀었어요',
    tier: 'diamond',
    condition: (s) => s.totalStudyProblems >= 300,
    hint: '학습 문제를 300개 풀어보세요',
  },
  {
    id: 'perfect_study',
    category: 'STUDY',
    icon: '✨',
    title: '퍼펙트 학습',
    description: '한 세션에서 전문제 정답!',
    tier: 'gold',
    condition: (s) => s.hadPerfectStudy,
    hint: '한 세션에서 모든 문제를 맞혀보세요',
  },
  {
    id: 'multi_subject_3',
    category: 'STUDY',
    icon: '🗂️',
    title: '다양한 학습',
    description: '3개 과목 이상을 학습했어요',
    tier: 'bronze',
    condition: (s) => (s.subjectsStudied || []).length >= 3,
    hint: '3개 이상의 과목을 학습해보세요',
  },
  {
    id: 'multi_subject',
    category: 'STUDY',
    icon: '🗂️',
    title: '팔방미인',
    description: '5개 과목 이상을 학습했어요',
    tier: 'silver',
    condition: (s) => (s.subjectsStudied || []).length >= 5,
    hint: '5개 이상의 과목을 학습해보세요',
  },
  {
    id: 'multi_subject_7',
    category: 'STUDY',
    icon: '🗂️',
    title: '백과사전',
    description: '7개 과목 이상을 학습했어요',
    tier: 'gold',
    condition: (s) => (s.subjectsStudied || []).length >= 7,
    hint: '7개 이상의 과목을 학습해보세요',
  },

  // ── STREAK ─────────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    category: 'STREAK',
    icon: '🔥',
    title: '불씨 점화',
    description: '3일 연속으로 학습했어요',
    tier: 'bronze',
    condition: (s) => s.longestStreak >= 3,
    hint: '3일 연속으로 학습해보세요',
  },
  {
    id: 'streak_7',
    category: 'STREAK',
    icon: '🔥',
    title: '일주일 전사',
    description: '7일 연속으로 학습했어요',
    tier: 'silver',
    condition: (s) => s.longestStreak >= 7,
    hint: '7일 연속으로 학습해보세요',
  },
  {
    id: 'streak_14',
    category: 'STREAK',
    icon: '🔥',
    title: '2주 챌린지',
    description: '14일 연속으로 학습했어요',
    tier: 'silver',
    condition: (s) => s.longestStreak >= 14,
    hint: '14일 연속으로 학습해보세요',
  },
  {
    id: 'streak_30',
    category: 'STREAK',
    icon: '🔥',
    title: '한 달 챔피언',
    description: '30일 연속으로 학습했어요',
    tier: 'gold',
    condition: (s) => s.longestStreak >= 30,
    hint: '30일 연속으로 학습해보세요',
  },
  {
    id: 'streak_60',
    category: 'STREAK',
    icon: '🔥',
    title: '두 달 집중',
    description: '60일 연속으로 학습했어요',
    tier: 'gold',
    condition: (s) => s.longestStreak >= 60,
    hint: '60일 연속으로 학습해보세요',
  },
  {
    id: 'streak_100',
    category: 'STREAK',
    icon: '💎',
    title: '100일의 기적',
    description: '100일 연속으로 학습했어요',
    tier: 'diamond',
    condition: (s) => s.longestStreak >= 100,
    hint: '100일 연속으로 학습해보세요',
  },

  // ── BOOKMARK ───────────────────────────────────────────────────────────────
  {
    id: 'first_bookmark',
    category: 'BOOKMARK',
    icon: '📌',
    title: '첫 북마크',
    description: '면접 질문을 처음 저장했어요',
    tier: 'bronze',
    condition: (s) => s.totalBookmarks >= 1,
    hint: '면접 질문을 1개 북마크해보세요',
  },
  {
    id: 'bookmark_5',
    category: 'BOOKMARK',
    icon: '📌',
    title: '복습 준비',
    description: '면접 질문을 5개 저장했어요',
    tier: 'bronze',
    condition: (s) => s.totalBookmarks >= 5,
    hint: '면접 질문을 5개 북마크해보세요',
  },
  {
    id: 'bookmark_10',
    category: 'BOOKMARK',
    icon: '📌',
    title: '질문 수집가',
    description: '면접 질문을 10개 저장했어요',
    tier: 'silver',
    condition: (s) => s.totalBookmarks >= 10,
    hint: '면접 질문을 10개 북마크해보세요',
  },
  {
    id: 'bookmark_20',
    category: 'BOOKMARK',
    icon: '📌',
    title: '복습의 달인',
    description: '면접 질문을 20개 저장했어요',
    tier: 'gold',
    condition: (s) => s.totalBookmarks >= 20,
    hint: '면접 질문을 20개 북마크해보세요',
  },

  // ── SPECIAL ────────────────────────────────────────────────────────────────
  {
    id: 'early_bird',
    category: 'SPECIAL',
    icon: '🌅',
    title: '얼리버드',
    description: '오전 6시 이전에 학습을 완료했어요',
    tier: 'gold',
    condition: (s) => s.studiedEarlyMorning,
    hint: '오전 6시 이전에 학습을 완료해보세요',
  },
  {
    id: 'morning_routine',
    category: 'SPECIAL',
    icon: '☀️',
    title: '모닝 루틴',
    description: '오전 6~9시 사이에 학습을 완료했어요',
    tier: 'silver',
    condition: (s) => s.morningStudy,
    hint: '오전 6~9시 사이에 학습을 완료해보세요',
  },
  {
    id: 'night_owl',
    category: 'SPECIAL',
    icon: '🦉',
    title: '야행성 학습자',
    description: '자정 이후에 학습을 완료했어요',
    tier: 'silver',
    condition: (s) => s.studiedLateNight,
    hint: '자정 이후에 학습을 완료해보세요',
  },
  {
    id: 'all_rounder',
    category: 'SPECIAL',
    icon: '⚡',
    title: '올라운더',
    description: '면접과 학습을 같은 날 모두 했어요',
    tier: 'gold',
    condition: (s) => s.didBothSameDay,
    hint: '같은 날 면접과 학습을 모두 해보세요',
  },
  {
    id: 'weekend_warrior',
    category: 'SPECIAL',
    icon: '🗓️',
    title: '주말 전사',
    description: '주말에도 꾸준히 활동했어요',
    tier: 'silver',
    condition: (s) => s.weekendActivity,
    hint: '주말(토/일)에 면접 또는 학습을 완료해보세요',
  },
  {
    id: 'comeback',
    category: 'SPECIAL',
    icon: '🔄',
    title: '돌아온 전사',
    description: '7일 이상 쉬고 다시 돌아왔어요',
    tier: 'bronze',
    condition: (s) => s.cameBack,
    hint: '한동안 쉬다가 다시 학습이나 면접을 해보세요',
  },
  {
    id: 'score_improver',
    category: 'SPECIAL',
    icon: '📈',
    title: '끊임없는 성장',
    description: '면접 점수를 3번 이상 갱신했어요',
    tier: 'gold',
    condition: (s) => (s.scoreImprovement || 0) >= 3,
    hint: '면접에서 이전 최고 점수를 3번 경신해보세요',
  },
]

// ── Tier Colors ───────────────────────────────────────────────────────────────
export const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#9ea8b3',
  gold: '#f5c518',
  diamond: '#9d8df8',
}

// ── Default Stats ─────────────────────────────────────────────────────────────
const DEFAULT_STATS = {
  totalInterviews: 0,
  bestScore: 0,
  scoreImprovement: 0,
  totalStudyProblems: 0,
  hadPerfectStudy: false,
  longestStreak: 0,
  currentStreak: 0,
  lastActivityDate: null,
  totalBookmarks: 0,
  subjectsStudied: [],
  studiedEarlyMorning: false,
  morningStudy: false,
  studiedLateNight: false,
  didBothSameDay: false,
  weekendActivity: false,
  cameBack: false,
  lastInterviewDate: null,
  lastStudyDate: null,
  unlockedAt: {},
}

const STATS_KEY = 'achievementStats'

// ── Stats Helpers ─────────────────────────────────────────────────────────────
export function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATS, ...parsed }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {
    // ignore storage errors
  }
}

// ── Streak Update ─────────────────────────────────────────────────────────────
export function updateStreak(stats) {
  const today = new Date().toISOString().slice(0, 10)
  const last = stats.lastActivityDate

  let currentStreak = stats.currentStreak || 0
  let cameBack = stats.cameBack || false

  if (!last) {
    currentStreak = 1
  } else if (last === today) {
    // Already counted today
  } else {
    const lastDate = new Date(last)
    const todayDate = new Date(today)
    const diffDays = Math.round((todayDate - lastDate) / 86400000)

    if (diffDays === 1) {
      currentStreak = currentStreak + 1
    } else {
      if (diffDays >= 7) cameBack = true
      currentStreak = 1
    }
  }

  const longestStreak = Math.max(stats.longestStreak || 0, currentStreak)

  return {
    ...stats,
    currentStreak,
    longestStreak,
    cameBack,
    lastActivityDate: today,
  }
}

// ── Check & Unlock ─────────────────────────────────────────────────────────────
export function checkAndUnlock(stats) {
  const newlyUnlocked = []
  const now = new Date().toISOString()
  const unlockedAt = { ...(stats.unlockedAt || {}) }

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAt[achievement.id]) continue
    try {
      if (achievement.condition(stats)) {
        unlockedAt[achievement.id] = now
        newlyUnlocked.push({ ...achievement, unlockedAt: now })
      }
    } catch {
      // ignore condition errors
    }
  }

  if (newlyUnlocked.length > 0) {
    const updatedStats = { ...stats, unlockedAt }
    saveStats(updatedStats)

    for (const achievement of newlyUnlocked) {
      window.dispatchEvent(
        new CustomEvent('achievement-unlocked', { detail: achievement })
      )
    }
  }

  return newlyUnlocked
}

// ── Bookmark Helpers ──────────────────────────────────────────────────────────
const BOOKMARKS_KEY = 'interviewBookmarks'

export function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addBookmark({ id, questionText, answerText, sessionId, date }) {
  const bookmarks = getBookmarks()
  if (bookmarks.find((b) => b.id === id)) return bookmarks

  const newBookmark = { id, questionText, answerText, sessionId, date }
  const updated = [newBookmark, ...bookmarks]
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
  return updated
}

export function removeBookmark(id) {
  const bookmarks = getBookmarks().filter((b) => b.id !== id)
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
  } catch {
    // ignore
  }
  return bookmarks
}

export function isBookmarked(id) {
  return getBookmarks().some((b) => b.id === id)
}
