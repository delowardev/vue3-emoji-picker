import { reactive } from "vue";
import { EmojiRecord, Group, State } from "../types";

import groups from "../data/groups.json"
import emojis from "../data/emojis.json"

import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL } from "../constant";


// @warning: don't update state directly, use ./composition instead
// @todo: protect store from direct update
export default reactive<State>({
  groups: groups as Group[],
  emojis: emojis as EmojiRecord,
  search: "",
  emoji: DEFAULT_EMOJI,
  activeGroup: "",
  skinTone: SKIN_TONE_NEUTRAL
})
