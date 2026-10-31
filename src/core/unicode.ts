/**
 * Convert a hyphen-separated unicode sequence to the native character.
 *
 * Invalid input returns an empty string instead of throwing — the value can
 * come from user-supplied `additionalGroups`.
 */
export function unicodeToEmoji(unicode: string): string {
  if (typeof unicode !== 'string' || !unicode.trim()) return ''

  const codePoints = unicode
    .split('-')
    .map((hex) => parseInt(hex, 16))
    .filter(
      (codePoint) =>
        Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
    )

  if (codePoints.length === 0) return ''

  try {
    return codePoints
      .map((codePoint) => String.fromCodePoint(codePoint))
      .join('')
  } catch {
    return ''
  }
}
