import { SKIN_TONE_NEUTRAL } from "../constant";
import { Emoji } from "../types";
import state from "./index";

function updateSearch(value: string) {
  state.search = value
}

function updateEmoji( value: Emoji ) {
  state.emoji = value;
}

function updateActiveGroup( group: string ) {
  state.activeGroup = group;
}

function updateSkinTone( tone = SKIN_TONE_NEUTRAL ) {
  state.skinTone = tone;
}

function updateOptions( options: Record<string, any>) {
  state.options = Object.assign(state.options, options);
}


export { updateSearch, updateEmoji, updateActiveGroup, updateSkinTone, updateOptions };

