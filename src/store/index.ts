import { reactive } from "vue";
import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL } from "../constant";
import emojis from "../data/emojis.json";
import _groups from "../data/groups.json";
import { EmojiRecord, Group, State } from "../types";


const defaultOptions: Record<string, any> = {
  native: false,
  hideSearch: true,
  hideGroupIcons: false,
  hideGroupNames: false,
  staticTexts: {},
  disabledGroups: []
}


// @warning: don't update state directly, use ./composition instead
// @todo: protect store from direct update
export default reactive<State>({
  emojis: emojis as EmojiRecord,
  search: "",
  emoji: DEFAULT_EMOJI,
  activeGroup: "",
  skinTone: SKIN_TONE_NEUTRAL,
  options: defaultOptions,
  get groups(): Group[] {
    const disabled = Array.isArray(this.options.disabledGroups) ? this.options.disabledGroups : [];
    return _groups.filter(group => !disabled.includes(group.key)) as Group[]
  }
})
