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
  n: string[];
  u: string
}

export type EmojiRecord = Record<GroupKeys, Emoji[]>;

export interface State {
  groups: Group[];
  emojis: EmojiRecord;
  search: string;
  emoji: Emoji
}
