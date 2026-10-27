/**
 * Check if the current platform is macOS.
 *
 * `navigator` is not defined in Node or in some workers, and optional chaining
 * does not guard an undeclared global, so the reference itself is guarded.
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false

  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string }
  }
  const platform = nav.userAgentData?.platform || nav.platform || 'unknown'
  return platform.toUpperCase().indexOf('MAC') !== -1
}

/** True when the IndexedDB API is reachable. */
export function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined'
}
