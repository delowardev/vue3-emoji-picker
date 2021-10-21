import { Emoji, GroupNames } from "./types";

const EMOJI_REMOTE_SRC = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@6.0.1/img/apple/64"

// ./data/groups.json
const GROUP_NAMES: GroupNames = {
  smileys_people: "Smiles & People",
  animals_nature: "Animals & Nature",
  food_drink: "Food & Drink",
  activities: "Activities",
  travel_places: "Travel places",
  objects: "Objects",
  symbols: "Symbols",
  flags: "Flags",
}



const DEFAULT_EMOJI: Emoji = {
  "n":[ "grinning face", "grinning" ],
  "u":"1f600"
}

export { EMOJI_REMOTE_SRC, GROUP_NAMES, DEFAULT_EMOJI }

