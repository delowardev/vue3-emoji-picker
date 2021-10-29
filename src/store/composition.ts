import state from "./index"
import { Emoji } from "../types";
import {SKIN_TONE_NEUTRAL} from "../constant";

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


export { updateSearch, updateEmoji, updateActiveGroup, updateSkinTone }
