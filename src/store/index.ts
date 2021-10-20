import { reactive } from "vue";

import groups from "../data/groups.json"
import emojis from "../data/emojis.json"

import {EmojiRecord, Group, GroupKeys, State} from "../types";

export default reactive<State>({
  groups: groups as Group[],
  emojis: emojis as EmojiRecord,
  search: "",
  get filteredEmojis () {
    const _emojiData = {} as EmojiRecord;
    Object.keys(this.emojis).forEach((key) => {
      const _emojis = this.emojis[key as GroupKeys].filter(emoji => {
        return emoji.n[0].includes(this.search?.toLocaleLowerCase())
      })
      if (_emojis.length) {
        _emojiData[key as GroupKeys] = _emojis;
      }
    })
    return _emojiData
  }
})
