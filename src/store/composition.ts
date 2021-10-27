import state from "./index"
import { Emoji } from "../types";

function updateSearch(value: string) {
  state.search = value
}

function updateEmoji( value: Emoji ) {
  state.emoji = value;
}

function updateActiveGroup( group: string ) {
  state.activeGroup = group;
}


export { updateSearch, updateEmoji, updateActiveGroup }
