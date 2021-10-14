import { reactive } from "vue";

import groups from "../data/groups.json"
import emojis from "../data/emojis.json"
import { Group } from "../types";

interface State {
  groups: Group[],
  emojis: any;
}

export default reactive<State>({
  groups: groups as Group[],
  emojis
})
