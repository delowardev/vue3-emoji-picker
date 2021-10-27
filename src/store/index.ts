import { reactive } from "vue";
import { EmojiRecord, Group, State } from "../types";

import groups from "../data/groups.json"
import emojis from "../data/emojis.json"

import { DEFAULT_EMOJI } from "../constant";


export default reactive<State>({
  groups: groups as Group[],
  emojis: emojis as EmojiRecord,
  search: "",
  emoji: DEFAULT_EMOJI,
  activeGroup: ""
})
