import {EMOJI_NAME_KEY, EMOJI_RESULT_KEY, EMOJI_UNICODE_KEY, EMOJI_VARIATIONS_KEY} from "./constant";

export type GroupKeys =
    | "smileys_people"
    | "animals_nature"
    | "food_drink"
    | "activities"
    | "travel_places"
    | "objects"
    | "symbols"
    | "flags";

export type GroupNames = Record<GroupKeys, string>;

export interface Group {
  key: GroupKeys;
  title: string;
  u: string;
}

export interface Emoji {
  [EMOJI_NAME_KEY]: string[];
  [EMOJI_UNICODE_KEY]: string;
  [EMOJI_VARIATIONS_KEY]?: string[];
  [EMOJI_RESULT_KEY]: string;
  src?: string;
}

export type EmojiRecord = Record<GroupKeys, Emoji[]>;

export interface State {
  groups: Group[];
  emojis: EmojiRecord;
  search: string;
  emoji: Emoji;
  activeGroup: string;
  skinTone: string;
  options: Record<string, any>;
}

export interface Store {
  state: State;
  updateSearch: ( v: string ) => void;
  updateEmoji: ( v: Emoji ) => void;
  updateActiveGroup: ( v: string ) => void;
  updateSkinTone: ( v: string ) => void;
  updateOptions: ( v: Record<string, any> ) => void;
}
