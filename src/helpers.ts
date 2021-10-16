export function unicodeToEmoji(unicode: string) {
  return unicode.split("-").map(hex => parseInt(hex, 16)).map(hex => String.fromCodePoint(hex)).join('')
}
