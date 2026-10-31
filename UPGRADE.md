# Upgrade guide

## 1.x → 2.0

**TL;DR:** update the package, open your browser console, and replace each
prop it warns about using the table below. Every 1.x prop still works in 2.x
(with a one-time warning in development); they are removed in 3.0.

```bash
npm install vue3-emoji-picker@2
```

### Props

| 1.x                                         | 2.0                                                                     |
| :------------------------------------------ | :---------------------------------------------------------------------- |
| `:native="true"`                            | `set="native"`                                                          |
| `:hide-search="true"`                       | `search-position="none"`                                                |
| `:hide-group-icons="true"`                  | `nav-position="none"`                                                   |
| `:hide-group-names="true"`                  | `category-headers="none"`                                               |
| `:disable-sticky-group-names="true"`        | `category-headers="static"`                                             |
| `:disable-skin-tones="true"`                | `skin-tone-position="none"`                                             |
| `:static-texts="{ placeholder, skinTone }"` | `:i18n="{ search, skinTone }"`                                          |
| `:group-names="{ flags: 'Flaggen' }"`       | `:i18n="{ categories: { flags: 'Flaggen' } }"`                          |
| `:group-order="['flags']"`                  | `:categories="['flags', …the rest]"`                                    |
| `:disabled-groups="['flags']"`              | `:categories` without `'flags'`                                         |
| `:additional-groups="{ team: [...] }"`      | `:custom-categories="[{ key: 'team', emojis: [...] }]"`                 |
| `:group-icons="{ team: '/t.svg' }"`         | `:category-icons="{ team: '/t.svg' }"` or `icon` on the custom category |
| `:display-recent="true"`                    | `recent="recent"` (or `"frequent"`)                                     |
| `picker-type="textarea"`                    | `type="textarea"` (`''` → `inline`)                                     |
| `mode="insert"`                             | `insert-mode="caret"` (`append`/`prepend` unchanged)                    |
| `v-model:text="text"` / `@update:text`      | `v-model="text"` / `@update:modelValue`                                 |
| `theme`, `offset`                           | unchanged                                                               |

`categories` replaces both `group-order` and `disabled-groups`: list the
categories you want, in the order you want. With neither prop, every category
is shown as before.

```vue
<!-- 1.x -->
<EmojiPicker
  :native="true"
  :hide-group-names="true"
  :display-recent="true"
  :group-order="['flags']"
  :disabled-groups="['symbols']"
  :static-texts="{ placeholder: 'Find an emoji' }"
  :group-names="{ flags: 'Countries' }"
  picker-type="textarea"
  v-model:text="message"
/>

<!-- 2.0 -->
<EmojiPicker
  set="native"
  category-headers="none"
  recent="recent"
  :categories="[
    'flags',
    'recent',
    'smileys_people',
    'animals_nature',
    'food_drink',
    'activities',
    'travel_places',
    'objects',
  ]"
  :i18n="{ search: 'Find an emoji', categories: { flags: 'Countries' } }"
  type="textarea"
  v-model="message"
/>
```

### Custom emoji

`additional-groups` took a record of compact emoji (`n`, `u`).
`custom-categories` takes a list of categories, each with its name and icon,
and emoji in a readable shape. The compact shape is still accepted.

```js
// 1.x
{
  team: [{ n: ['ship it', 'shipit'], u: 'x-shipit' }]
}

// 2.0
;[
  {
    key: 'team',
    name: 'Team',
    icon: '/icons/team.svg',
    emojis: [
      {
        name: 'ship it',
        shortcodes: ['shipit'],
        unicode: 'x-shipit',
        src: '/emoji/shipit.png',
      },
    ],
  },
]
```

### `@select` payload

The payload gains readable fields. The 1.x single-letter keys are still
included and will be removed in 3.0.

| 1.x          | 2.0           |
| :----------- | :------------ |
| `i`          | `native`      |
| `r`          | `unicode`     |
| `u`          | `baseUnicode` |
| `n[0]`       | `name`        |
| `n.slice(1)` | `shortcodes`  |
| `t`          | `skinTone`    |

### Other changes

- **Default strings:** "Smiles & People" is now "Smileys & People",
  "Travel places" is "Travel & Places", and "No emoji has been found!" is
  "No emoji found". Override them with `i18n` if you relied on the old text.
- **Emoji data:** updated to Emoji 16.0 (1,906 emoji). Names follow Unicode
  CLDR ("red heart", "thumbs up"), so code that matched on `name`/`n[0]` may
  need updating. Shortcodes are unchanged.
- **Recently used:** stored in `localStorage` instead of IndexedDB. Existing
  recents are moved over automatically the first time the picker loads.
- **Package:** `vue` is now a peer dependency (Vue ≥ 3.2.23) and Node ≥ 18 is
  required for SSR/tests. `dist/emoji-picker.umd.js` and `.es.js` still exist
  for CDN links; bundlers should import `vue3-emoji-picker` as before.
- **Types** ship with the package; remove any `declare module 'vue3-emoji-picker'` shim.

## Migrating from emoji-mart

Most options have a direct counterpart.

| emoji-mart                                                 | vue3-emoji-picker                                                                                                                                                             |
| :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onEmojiSelect`                                            | `@select` (`native`, `unicode`, `name`, `shortcodes`, `skinTone`)                                                                                                             |
| `set` (`native`, `apple`, `google`, `twitter`, `facebook`) | `set` (same values)                                                                                                                                                           |
| `getImageURL`                                              | `image-url`                                                                                                                                                                   |
| `theme`, `perLine`, `emojiSize`, `autoFocus`               | same names (kebab-case in templates)                                                                                                                                          |
| `categories`                                               | `categories` (`frequent` → `recent`, `people` → `smileys_people`, `nature` → `animals_nature`, `foods` → `food_drink`, `activity` → `activities`, `places` → `travel_places`) |
| `custom`                                                   | `custom-categories` (`id` → `key`, emoji `skins[0].src` → `src`)                                                                                                              |
| `categoryIcons`                                            | `category-icons` (URL per key)                                                                                                                                                |
| `exceptEmojis` (ids)                                       | `exclude-emojis` (unicode, e.g. `1f595`)                                                                                                                                      |
| `maxFrequentRows`                                          | `max-recent` (number of emoji)                                                                                                                                                |
| `i18n`, `locale`                                           | `i18n` (see README for keys)                                                                                                                                                  |
| `navPosition` (`top`/`none`)                               | `nav-position`                                                                                                                                                                |
| `previewPosition` (`bottom`/`none`)                        | `preview-position`                                                                                                                                                            |
| `searchPosition` (`sticky`/`none`)                         | `search-position` (`top`/`none`)                                                                                                                                              |
| `skinTonePosition` (`preview`/`none`)                      | `skin-tone-position`                                                                                                                                                          |

Not supported yet: bottom navigation, a top preview, skin tones next to
search, spritesheets and `emojiVersion` filtering.
