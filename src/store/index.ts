import { reactive } from "vue";

import groups from "../data/groups.json"
import emojis from "../data/emojis.json"

import { EmojiRecord, Group, State} from "../types";

export default reactive<State>({
  groups: groups as Group[],
  emojis: emojis as EmojiRecord
})
