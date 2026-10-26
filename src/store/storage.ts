const PREFIX = 'vue3-emoji-picker'

/**
 * Minimal localStorage wrapper.
 *
 * Every access happens inside `try`, so a missing global (`window` in Node or
 * SSR), disabled storage or a quota error degrades to a no-op instead of
 * throwing. Persistence is a progressive enhancement, never a requirement.
 */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}.${key}`)
    if (raw === null) return fallback

    const parsed = JSON.parse(raw)
    return parsed === null || parsed === undefined ? fallback : (parsed as T)
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(`${PREFIX}.${key}`, JSON.stringify(value))
  } catch {
    // Storage unavailable: recents simply do not persist.
  }
}

export function removeJson(key: string): void {
  try {
    window.localStorage.removeItem(`${PREFIX}.${key}`)
  } catch {
    // Ignore.
  }
}
