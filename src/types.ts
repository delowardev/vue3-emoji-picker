export type GroupKeys = "smileys_people" | "animals_nature" | "food_drink" | "activities" | "travel_places" | "symbols" | "flags"

export interface Group {
  key: GroupKeys,
  title: string;
  u: string;
}
