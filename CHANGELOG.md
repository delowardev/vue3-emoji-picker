v1.2.0 (unreleased)

- Update: Recent emoji are stored in `localStorage` instead of IndexedDB.
  The `idb` dependency is gone and the store no longer touches a browser
  API until it is actually used.
- Fix: Recently used emoji keep the selected skin tone. Selections are
  persisted as unicode ids and resolved against the current dataset, so
  a recent "thumbs up" no longer renders in the neutral tone.
- Update: Selection counts are persisted, preparing a frequently-used
  ordering for a later release.

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
