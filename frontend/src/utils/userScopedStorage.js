const STORAGE_NAMESPACE = 'aimentor'
const LEGACY_STATIC_KEYS = ['wrongNotes', 'achievementStats', 'interviewBookmarks', 'placementDifficulty', 'placementDone']
const LEGACY_PREFIXES = ['learningProgress_', 'learningDaily_']

export const AUTH_CHANGED_EVENT = 'auth:changed'
export const AUTH_CLEARED_EVENT = 'auth:cleared'
const LEGACY_MIGRATION_MARKER_KEY = 'backendMigrationV1'

function cloneFallback(fallback) {
  if (Array.isArray(fallback)) return [...fallback]
  if (fallback && typeof fallback === 'object') return { ...fallback }
  return fallback
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export function getCurrentUserId() {
  return getStoredUser()?.id ?? null
}

export function getStorageScope(userId = getCurrentUserId()) {
  return userId == null ? 'guest' : `user:${userId}`
}

export function getScopedStoragePrefix(userId = getCurrentUserId()) {
  return `${STORAGE_NAMESPACE}:${getStorageScope(userId)}:`
}

export function getScopedStorageKey(baseKey, userId = getCurrentUserId()) {
  return `${getScopedStoragePrefix(userId)}${baseKey}`
}

export function readScopedJson(baseKey, fallback, userId = getCurrentUserId()) {
  try {
    const raw = localStorage.getItem(getScopedStorageKey(baseKey, userId))
    if (!raw) return cloneFallback(fallback)
    return JSON.parse(raw)
  } catch {
    return cloneFallback(fallback)
  }
}

export function writeScopedJson(baseKey, value, userId = getCurrentUserId()) {
  localStorage.setItem(getScopedStorageKey(baseKey, userId), JSON.stringify(value))
}

export function readScopedString(baseKey, fallback = '', userId = getCurrentUserId()) {
  try {
    return localStorage.getItem(getScopedStorageKey(baseKey, userId)) ?? fallback
  } catch {
    return fallback
  }
}

export function writeScopedString(baseKey, value, userId = getCurrentUserId()) {
  localStorage.setItem(getScopedStorageKey(baseKey, userId), String(value))
}

export function removeScopedItem(baseKey, userId = getCurrentUserId()) {
  localStorage.removeItem(getScopedStorageKey(baseKey, userId))
}

export function listScopedJsonEntries(baseKeyPrefix, userId = getCurrentUserId()) {
  const prefix = getScopedStorageKey(baseKeyPrefix, userId)
  const scopePrefix = getScopedStoragePrefix(userId)
  const entries = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index)
    if (!storageKey?.startsWith(prefix)) continue

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) continue
      entries.push({
        storageKey,
        key: storageKey.slice(scopePrefix.length),
        value: JSON.parse(raw),
      })
    } catch {
      // Ignore malformed entries.
    }
  }

  return entries
}

export function readLegacyJson(baseKey, fallback) {
  try {
    const raw = localStorage.getItem(baseKey)
    if (!raw) return cloneFallback(fallback)
    return JSON.parse(raw)
  } catch {
    return cloneFallback(fallback)
  }
}

export function readLegacyString(baseKey, fallback = '') {
  try {
    return localStorage.getItem(baseKey) ?? fallback
  } catch {
    return fallback
  }
}

export function listLegacyJsonEntries(baseKeyPrefix) {
  const entries = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index)
    if (!storageKey?.startsWith(baseKeyPrefix)) continue

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) continue
      entries.push({
        storageKey,
        key: storageKey,
        value: JSON.parse(raw),
      })
    } catch {
      // Ignore malformed entries.
    }
  }

  return entries
}

export function listLegacyStringEntries(baseKeyPrefix) {
  const entries = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index)
    if (!storageKey?.startsWith(baseKeyPrefix)) continue
    entries.push({
      storageKey,
      key: storageKey,
      value: localStorage.getItem(storageKey),
    })
  }

  return entries
}

export function hasScopedMigrationMarker(userId = getCurrentUserId()) {
  return readScopedString(LEGACY_MIGRATION_MARKER_KEY, '', userId) === 'done'
}

export function setScopedMigrationMarker(userId = getCurrentUserId()) {
  writeScopedString(LEGACY_MIGRATION_MARKER_KEY, 'done', userId)
}

export function clearLegacyLearningStorage() {
  const keysToRemove = []

  for (const key of LEGACY_STATIC_KEYS) {
    keysToRemove.push(key)
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index)
    if (!storageKey) continue
    if (LEGACY_PREFIXES.some((prefix) => storageKey.startsWith(prefix))) {
      keysToRemove.push(storageKey)
    }
  }

  for (const key of new Set(keysToRemove)) {
    localStorage.removeItem(key)
  }
}

export function dispatchAuthChanged(user) {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { user } }))
}

export function dispatchAuthCleared() {
  window.dispatchEvent(new CustomEvent(AUTH_CLEARED_EVENT))
}
