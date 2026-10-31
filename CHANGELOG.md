v2.0.0 (unreleased)

Breaking: props are standardized. Every 1.x prop keeps working with a
one-time console warning until 3.0 — see [UPGRADE.md](UPGRADE.md).

- Update: toolchain — Vite 8, Vitest 5, TypeScript 6, vue-tsc 3, ESLint 10
  (flat config), Prettier 3, husky 9, Sass modules (`@use`); Vue 3.5 for
  development. The published build keeps the 1.x browser targets
  (Chrome 87, Firefox 78, Safari 14, Edge 88) and gets smaller (ESM 63.7 →
  57.3 kB gzipped)
- Add: `EmojiPickerProps` type. The component is typed so its declarations
  work with every Vue 3 version (3.2–3.5), not only the one used to build it

- Breaking: new prop names. `native` → `set="native"`; `hide-search`,
  `hide-group-icons`, `disable-skin-tones` → `search-position`,
  `nav-position`, `skin-tone-position` (`'none'` hides); `hide-group-names`
  and `disable-sticky-group-names` → `category-headers`
  (`sticky`/`static`/`none`); `static-texts` and `group-names` → `i18n`;
  `group-order` and `disabled-groups` → `categories`; `additional-groups` →
  `custom-categories`; `group-icons` → `category-icons`; `display-recent` →
  `recent`; `picker-type` → `type`; `mode` → `insert-mode`; `v-model:text`
  → `v-model`
- Add: `i18n` covers every string, including screen-reader labels and the
  six skin tone names; `EN_I18N` is exported from the core
- Add: `custom-categories` take a name, icon and readable emoji
  (`name`, `shortcodes`, `unicode`, `skins`, `src`)
- Add: the `select` payload has readable fields — `native`, `unicode`,
  `baseUnicode`, `name`, `shortcodes`, `skinTone`. The 1.x keys (`i`, `r`,
  `u`, `n`, `t`) remain until 3.0
- Update: default strings fixed ("Smileys & People", "Travel & Places",
  "No emoji found")
- Add: 1.x CDN file names (`emoji-picker.umd.js`, `emoji-picker.es.js`)
  are still shipped, and recents saved by 1.x in IndexedDB are migrated to
  localStorage automatically
- Update: emoji data regenerated from emoji-datasource 16.0.0 (Emoji 16.0):
  1906 emoji, up from 1563, including the Emoji 14–16 additions (🫠 melting
  face, 🫨 shaking face, 🪿 goose, 🫩 face with bags under eyes…). Names are
  now the CLDR short names, so "red heart" finds ❤️ (was "heavy black heart")
  and 👍 is "thumbs up". Gender-neutral emoji (👮 police officer, 🏃 person
  running, 👪 family…) are kept and listed before their man/woman variants,
  as in emoji-mart and emojibase, so `:cop:` still inserts 👮. More emoji
  support skin tones (323, up from 212). See #70, #58, #66, #46
- Add: `npm run data:update` regenerates the emoji data from a given
  emoji-datasource release, and a weekly workflow opens a PR when a new
  release is out
- Add: `vue3-emoji-picker/core` — a framework-agnostic entry point with
  `createPicker`, search, skin tones and recent storage. It has no Vue
  import, so it can back a picker in another view layer.
- Add: keyboard navigation — one tab stop, arrow keys across the grid,
  ArrowDown/Enter from search, Escape closes popups — plus ARIA labels
  for emoji, groups, the category bar and skin tones
- Add: `set` (`native`, `apple`, `google`, `twitter`, `facebook`) and
  `image-url` props; custom emoji render their own `src`. Image sets come
  from emoji-datasource 16.0.0 (the default Apple set moves from 6.0.1)
- Add: `per-line`, `emoji-size` and `auto-focus` props; picker size and
  focus colour are CSS variables (`--v3-picker-width`, `--v3-picker-height`,
  `--v3-picker-focus`)
- Add: `recent="frequent"` ordering and `max-recent`
- Fix: searches with no match now show the no-results message (it only
  appeared when every group was disabled)
- Fix: jumping to a category no longer uses `#id` selectors, which broke
  with two pickers on a page or non-CSS-safe group keys
- Update: the playground has presets, every new option, localization and
  custom emoji examples, and a shortcode converter
- Add: `exclude-emojis` prop to hide individual emoji by unicode.
  See #77, #78
- Add: `preview-position="none"` hides the preview. See #73
- Add: `placement` prop for input/textarea popups; `offset` and
  `placement` now update after mount, and the Popper instance is destroyed
  on unmount. See #71
- Add: `input-attrs` prop, bound to the input/textarea (placeholder,
  class, name, rows, ...). See #54, #64
- Add: `replaceShortcodes` / `shortcodeToEmoji` in the core entry,
  including Slack-style `:skin-tone-N:` suffixes. See #82
- Fix: picking from the "Recently used" group no longer reshuffles it
  under the pointer; the new order shows on next open/mount. See #75
- Update: emoji images use `loading="lazy"`. See #17, #55
- Add: an interactive playground (`npm run dev`) with live prop controls,
  generated usage code and a vanilla-core demo. `npm run demo:build`
  produces a deployable static build.
- Update: the Vue store is now a thin bridge over the core; `vue` is an
  optional peer dependency so core-only consumers do not need it.
- Update: Recent emoji are stored in `localStorage` instead of IndexedDB.
  The `idb` dependency is gone and the store no longer touches a browser
  API until it is actually used.
- Fix: Recently used emoji keep the selected skin tone. Selections are
  persisted as unicode ids and resolved against the current dataset, so
  a recent "thumbs up" no longer renders in the neutral tone.
- Update: Selection counts are persisted, preparing a frequently-used
  ordering for a later release.
- Fix: Props are now reactive after mount. `native`, `theme`,
  `disabled-groups`, `group-order`, `group-names`, `group-icons`,
  `picker-type`, `hide-*` and the rest previously only took effect at
  mount time.
- Fix: `v-model` is controlled, so resetting the value from
  the parent updates the input. See #65
- Update: Group names resolve once in the store, so header tooltips and
  body headings agree. They previously disagreed on two categories
  ("Recently Used" vs "Recently used", "Travel & Places" vs "Travel places").

v1.1.9 (26/10/26)

- Fix: Every skin tone now applies, including the lightest one. The
  `findIndex(...) || -1` check treated index `0` as "not found" and silently
  dropped tone `1f3fb` for all 212 tone-capable emoji. See #76
- Fix: Importing the picker in Node/SSR no longer throws
  `ReferenceError: indexedDB is not defined`. Storage is initialised lazily and
  becomes a no-op when unavailable. See #63, #56
- Fix: `navigator` is no longer accessed unguarded, so the component does not
  throw on server runtimes or in workers
- Fix: `additionalGroups` images can no longer inject markup through
  `innerHTML`; a failed image now renders the native glyph reactively
- Fix: Search now matches every alias, so shortcodes such as `thumbsup`, `+1`
  and `joy_cat` are findable. Results are ranked (exact alias first) and
  memoised per emoji
- Fix: `unicodeToEmoji` returns an empty string instead of throwing on
  non-hex input; malformed `additionalGroups` entries are skipped
- Fix: `recent` group icon can be overridden through `group-icons`, as the
  README documents
- Update: `vue` is a peer dependency instead of a direct dependency
- Update: Dual ESM/CJS types (`.d.mts` / `.d.cts`) and `exports` conditions, so
  `require()` consumers get types. `Emoji` no longer requires the computed `r`
  key, making the documented `additionalGroups` shape valid
- Update: More public types are exported (`Group`, `GroupKeys`, `GroupNames`,
  `State`, `EmojiRecord`)
- Update: The published package is ESM-first (`"type": "module"`) and no longer
  ships the demo favicon
- Update: CI now runs type-check, lint, tests, build, `publint`, `attw`, an SSR
  import smoke test and a package-content check

v1.1.7 (11/11/22)

- Add: Dark mode support
- Update: Export CSS file

v1.1.5 (05/11/22)

- Add: Recently Added Emoji Group
- Add: Additional Group Support
- Add: Group Sort Support
- Add: Custom Group Icons Support
- Fix: Store Reactivity Issue

v1.1.4 (25/08/22)

- Fix: Unexpected whole page scroll. See #28

v1.1.3 (16/06/22)

- Fix: Unable to change group names #25

v1.1.0 (24/04/22)

- Fix: Missing emoji on Mac. See: #20
- Update: Fallback added for missing emoji images.

v1.0.2 ( 22/04/22 )

- Fix: Form gets submitted when clicking on any emoji.

v1.0.1 ( 06/12/21 )

- Update: New input picker component added.

v0.0.5 ( 02/12/21 )

- Update: Protect store accessing from outside.
- Fix: Store data gets mixed up when there are multiple picker. See: #14

v0.0.1

- Initial release.
