import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import * as learningApi from './api/learning'
import router from './router'
import useAuthStore from './store/authStore'
import { ensureAchievementStateLoaded } from './utils/achievements'
import {
  clearLegacyLearningStorage,
  getCurrentUserId,
  hasScopedMigrationMarker,
  listLegacyJsonEntries,
  listLegacyStringEntries,
  listScopedJsonEntries,
  readLegacyJson,
  readLegacyString,
  readScopedJson,
  readScopedString,
  setScopedMigrationMarker,
} from './utils/userScopedStorage'

const migrationInFlight = new Set()

function normalizeCount(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mergeAchievementStats(serverStats = {}, localStats = {}) {
  if (!localStats || Object.keys(localStats).length === 0) return serverStats

  const merged = { ...serverStats, ...localStats }
  merged.totalInterviews = Math.max(serverStats.totalInterviews || 0, localStats.totalInterviews || 0)
  merged.bestScore = Math.max(serverStats.bestScore || 0, localStats.bestScore || 0)
  merged.scoreImprovement = Math.max(serverStats.scoreImprovement || 0, localStats.scoreImprovement || 0)
  merged.totalStudyProblems = Math.max(serverStats.totalStudyProblems || 0, localStats.totalStudyProblems || 0)
  merged.totalBookmarks = Math.max(serverStats.totalBookmarks || 0, localStats.totalBookmarks || 0)
  merged.longestStreak = Math.max(serverStats.longestStreak || 0, localStats.longestStreak || 0)
  merged.currentStreak = Math.max(serverStats.currentStreak || 0, localStats.currentStreak || 0)
  merged.hadPerfectStudy = Boolean(serverStats.hadPerfectStudy || localStats.hadPerfectStudy)
  merged.studiedEarlyMorning = Boolean(serverStats.studiedEarlyMorning || localStats.studiedEarlyMorning)
  merged.morningStudy = Boolean(serverStats.morningStudy || localStats.morningStudy)
  merged.studiedLateNight = Boolean(serverStats.studiedLateNight || localStats.studiedLateNight)
  merged.didBothSameDay = Boolean(serverStats.didBothSameDay || localStats.didBothSameDay)
  merged.weekendActivity = Boolean(serverStats.weekendActivity || localStats.weekendActivity)
  merged.cameBack = Boolean(serverStats.cameBack || localStats.cameBack)
  merged.subjectsStudied = Array.from(new Set([...(serverStats.subjectsStudied || []), ...(localStats.subjectsStudied || [])]))
  merged.unlockedAt = { ...(serverStats.unlockedAt || {}), ...(localStats.unlockedAt || {}) }

  const latestDate = (first, second) => {
    if (!first) return second || null
    if (!second) return first || null
    return first >= second ? first : second
  }

  merged.lastActivityDate = latestDate(serverStats.lastActivityDate, localStats.lastActivityDate)
  merged.lastInterviewDate = latestDate(serverStats.lastInterviewDate, localStats.lastInterviewDate)
  merged.lastStudyDate = latestDate(serverStats.lastStudyDate, localStats.lastStudyDate)
  return merged
}

function pickLocalDataset(scopedValue, legacyValue, isFilled) {
  return isFilled(scopedValue) ? scopedValue : legacyValue
}

function getLocalMigrationPayload(userId) {
  const todayKey = `learningDaily_${new Date().toISOString().slice(0, 10)}`

  const scopedProgresses = listScopedJsonEntries('learningProgress_', userId).map(({ value }) => value).filter(Boolean)
  const legacyProgresses = listLegacyJsonEntries('learningProgress_').map(({ value }) => value).filter(Boolean)
  const progresses = pickLocalDataset(scopedProgresses, legacyProgresses, (value) => Array.isArray(value) && value.length > 0)

  const scopedWrongNotes = readScopedJson('wrongNotes', [], userId)
  const legacyWrongNotes = readLegacyJson('wrongNotes', [])
  const wrongNotes = pickLocalDataset(scopedWrongNotes, legacyWrongNotes, (value) => Array.isArray(value) && value.length > 0)

  const scopedStats = readScopedJson('achievementStats', null, userId)
  const legacyStats = readLegacyJson('achievementStats', null)
  const achievementStats = pickLocalDataset(scopedStats, legacyStats, (value) => value && Object.keys(value).length > 0)

  const scopedBookmarks = readScopedJson('interviewBookmarks', [], userId)
  const legacyBookmarks = readLegacyJson('interviewBookmarks', [])
  const bookmarks = pickLocalDataset(scopedBookmarks, legacyBookmarks, (value) => Array.isArray(value) && value.length > 0)

  const scopedPlacementDifficulty = readScopedString('placementDifficulty', '', userId)
  const legacyPlacementDifficulty = readLegacyString('placementDifficulty', '')
  const placementDifficulty = scopedPlacementDifficulty || legacyPlacementDifficulty || ''

  const scopedPlacementDone = readScopedString('placementDone', '', userId)
  const legacyPlacementDone = readLegacyString('placementDone', '')
  const placementDone = scopedPlacementDone || legacyPlacementDone

  const scopedDailyUsed = normalizeCount(readScopedString(todayKey, '', userId), 0)
  const legacyDailyEntries = listLegacyStringEntries('learningDaily_')
  const legacyDailyToday = normalizeCount(
    legacyDailyEntries.find((entry) => entry.key === todayKey)?.value || readLegacyString(todayKey, '0'),
    0
  )
  const dailyUsed = scopedDailyUsed > 0 ? scopedDailyUsed : legacyDailyToday

  return {
    progresses,
    wrongNotes,
    achievementStats,
    bookmarks,
    placementDifficulty,
    placementDone,
    dailyUsed,
  }
}

function makeWrongNoteSignature(note) {
  return [
    note.date || '',
    note.subject || '',
    note.difficulty || '',
    note.question || '',
    note.userAnswer || '',
  ].join('::')
}

function App() {
  const { accessToken, user } = useAuthStore()

  useEffect(() => {
    const userId = user?.id || getCurrentUserId()
    if (!accessToken || !userId) return
    if (hasScopedMigrationMarker(userId)) return
    if (migrationInFlight.has(userId)) return

    let cancelled = false
    migrationInFlight.add(userId)

    const runMigration = async () => {
      try {
        const localData = getLocalMigrationPayload(userId)
        const hasAnyLocalData = (
          localData.progresses.length > 0 ||
          localData.wrongNotes.length > 0 ||
          localData.bookmarks.length > 0 ||
          (localData.achievementStats && Object.keys(localData.achievementStats).length > 0) ||
          localData.placementDifficulty ||
          localData.placementDone === 'true' ||
          localData.dailyUsed > 0
        )

        if (!hasAnyLocalData) {
          setScopedMigrationMarker(userId)
          return
        }

        const [
          { data: overviewResponse },
          { data: progressResponse },
          { data: achievementResponse },
          { data: wrongNotesResponse },
        ] = await Promise.all([
          learningApi.getLearningOverview(),
          learningApi.listLearningProgress(),
          learningApi.getAchievementState(),
          learningApi.listWrongNotes(),
        ])

        if (cancelled) return

        const overview = overviewResponse?.data || {}
        const serverProgresses = Array.isArray(progressResponse?.data) ? progressResponse.data : []
        const serverAchievement = achievementResponse?.data || {}
        const serverWrongNotes = Array.isArray(wrongNotesResponse?.data) ? wrongNotesResponse.data : []

        if (localData.placementDifficulty || localData.placementDone === 'true' || localData.dailyUsed > (overview.dailyUsed || 0)) {
          await learningApi.saveLearningPreferences({
            placementDifficulty: localData.placementDifficulty || overview.placementDifficulty || undefined,
            placementDone: localData.placementDone === 'true' ? true : overview.placementDone,
            dailyUsed: localData.dailyUsed > (overview.dailyUsed || 0) ? localData.dailyUsed : undefined,
          })
        }

        const serverProgressKeys = new Set(serverProgresses.map((item) => `${item.subject}::${item.difficulty}`))
        for (const progress of localData.progresses) {
          const key = `${progress.subject}::${progress.difficulty}`
          if (serverProgressKeys.has(key)) continue
          await learningApi.saveLearningProgress({
            subject: progress.subject,
            difficulty: progress.difficulty,
            count: progress.count,
            currentIdx: progress.currentIdx ?? progress.currentIndex ?? 0,
            problems: progress.problems || [],
            userAnswers: progress.userAnswers || {},
            results: progress.results || {},
          })
        }

        const serverWrongNoteKeys = new Set(serverWrongNotes.map(makeWrongNoteSignature))
        for (const note of localData.wrongNotes) {
          const signature = makeWrongNoteSignature(note)
          if (serverWrongNoteKeys.has(signature)) continue
          await learningApi.createWrongNote({
            date: note.date,
            subject: note.subject,
            difficulty: note.difficulty,
            question: note.question,
            type: note.type,
            choices: note.choices || [],
            answer: note.answer,
            userAnswer: note.userAnswer,
            aiFeedback: note.aiFeedback,
            explanation: note.explanation,
          })
          serverWrongNoteKeys.add(signature)
        }

        const serverBookmarkIds = new Set((serverAchievement.bookmarks || []).map((item) => String(item.id)))
        for (const bookmark of localData.bookmarks) {
          if (serverBookmarkIds.has(String(bookmark.id))) continue
          await learningApi.addInterviewBookmark({
            id: String(bookmark.id),
            questionText: bookmark.questionText,
            answerText: bookmark.answerText,
            sessionId: bookmark.sessionId,
            date: bookmark.date,
          })
          serverBookmarkIds.add(String(bookmark.id))
        }

        if (localData.achievementStats && Object.keys(localData.achievementStats).length > 0) {
          const mergedStats = mergeAchievementStats(serverAchievement.stats || {}, localData.achievementStats)
          await learningApi.saveAchievementState(mergedStats)
        }

        await ensureAchievementStateLoaded(true)
        clearLegacyLearningStorage()
        setScopedMigrationMarker(userId)
      } catch {
        // retry on next app load if migration fails
      } finally {
        migrationInFlight.delete(userId)
      }
    }

    runMigration()
    return () => {
      cancelled = true
    }
  }, [accessToken, user?.id])

  return <RouterProvider router={router} />
}

export default App
