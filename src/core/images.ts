import type { Emoji, EmojiSet } from './types'

/** emoji-datasource version used for the image sets. */
export const EMOJI_DATASOURCE_VERSION = '15.1.2'

export const EMOJI_SETS: EmojiSet[] = [
  'native',
  'apple',
  'google',
  'twitter',
  'facebook',
]

/**
 * CDN URL for an emoji image from one of the emoji-datasource sets.
 *
 * Licensing differs per set: Twitter (Twemoji, CC-BY 4.0) and Google
 * (Noto, Apache 2.0) can be used commercially; check Apple and Facebook
 * artwork terms before shipping them in a product.
 */
export function getEmojiImageUrl(
  unicode: string,
  set: Exclude<EmojiSet, 'native'> = 'apple'
): string {
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-${set}@${EMOJI_DATASOURCE_VERSION}/img/${set}/64/${unicode}.png`
}

export interface ImageResolverOptions {
  set?: EmojiSet
  /** Overrides `set`, e.g. to self-host: `(u) => '/emoji/' + u + '.png'`. */
  imageUrl?: ((unicode: string) => string) | null
}

/**
 * Resolve the image for an emoji, or `null` to render the native glyph.
 * A custom emoji's own `src` always wins.
 */
export function resolveEmojiImage(
  emoji: Emoji,
  unicode: string,
  { set = 'apple', imageUrl }: ImageResolverOptions = {}
): string | null {
  if (emoji.src) return emoji.src
  if (typeof imageUrl === 'function') return imageUrl(unicode)
  if (set === 'native') return null
  return getEmojiImageUrl(unicode, set)
}
