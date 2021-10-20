import {EmojiRecord, GroupKeys} from "./types";

export function unicodeToEmoji(unicode: string) {
  return unicode.split("-").map(hex => parseInt(hex, 16)).map(hex => String.fromCodePoint(hex)).join('')
}

export function filterEmojis(emojis: EmojiRecord, keyword: string) {
  const _emojiData = {} as EmojiRecord;
  Object.keys(emojis).forEach((key) => {
    const _emojis = emojis[key as GroupKeys].filter(emoji => {
      return emoji.n[0].includes(keyword.toLocaleLowerCase())
    })
    if (_emojis.length) {
      _emojiData[key as GroupKeys] = _emojis;
    }
  })
  return _emojiData
}
