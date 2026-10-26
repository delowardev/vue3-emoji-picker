# What to borrow from emoji-mart

**Reference:** [missive/emoji-mart](https://github.com/missive/emoji-mart) — MIT, 9,405★, ~12.9M downloads/month, last release `5.6.0` (2024-04-25), last push 2024-08-12, **221 open issues**.
**Companion to:** [MODERNIZATION-REVIEW.md](MODERNIZATION-REVIEW.md)

## Verdict

**Yes — borrow the architecture, not the implementation, and not the dependency.** Seven concepts map cleanly onto defects already identified in our review. Two are near-free and disproportionately valuable; three are medium-effort; two should be explicitly rejected.

Importantly, emoji-mart is a **design donor, not a maintenance substitute**: it is itself dormant (no release in ~2.5 years, 221 open issues), its data stops at Emoji 15, and its own helper tests are literally `test.skip('', () => {})`. Copy the ideas, not the codebase, and don't swap one unmaintained engine for another.

| #   | Concept                                       | Our current state                                   | Effort | Value        |
| --- | --------------------------------------------- | --------------------------------------------------- | ------ | ------------ |
| 1   | **Precomputed search token index**            | Only `n[0]` searched; 84.6% of aliases unsearchable | Low    | 🔴 Very high |
| 2   | **localStorage frecency** (counts + defaults) | IndexedDB, MRU-only, tone loss, SSR crash           | Low    | 🔴 Very high |
| 3   | **Roving grid keyboard nav + live region**    | Zero keyboard support, 1,563 tab stops              | Medium | 🔴 Very high |
| 4   | **IntersectionObserver row rendering**        | All 1,563 buttons rendered eagerly                  | Medium | 🟠 High      |
| 5   | **IntersectionObserver scroll-spy**           | Manual `offsetTop` math + `querySelector('#'+id)`   | Medium | 🟠 High      |
| 6   | **Spritesheet + injectable asset URL**        | Per-emoji CDN hotlink, ~3,800 requests, stale pin   | Medium | 🟠 High      |
| 7   | **Pluggable async data prop**                 | 153 KB dataset inlined in the bundle                | Medium | 🟠 High      |
| 8   | Canvas-based native-support detection         | `isMac()` heuristic, throws on Node 18/20           | Low    | 🟡 Medium    |
| 9   | i18n locale files                             | `staticTexts` + `groupNames` only                   | Medium | 🟡 Medium    |
| —   | Preact / custom-element architecture          | Vue SFC + `provide/inject`                          | —      | ❌ Reject    |
| —   | Global mutable `Data`/`I18n` singleton        | Per-instance store                                  | —      | ❌ Reject    |
| —   | Their test suite / data pipeline freshness    | 3 real assertions; Emoji 15                         | —      | ❌ Reject    |

---

## 1. Precomputed search token index — the single best borrow

**What they do** (`helpers/search-index.ts` + `config.ts:201-247`): at data-init time each emoji gets a comma-prefixed string of lowercased tokens built from its id, name (split on `[-|_|\s]+`), keywords, emoticons, and every skin's native character:

```ts
emoji.search =
  ',' +
  [emoji.id, emoji.name, emoji.keywords, emoji.emoticons, ...natives]
    .flat()
    .map((s) => s.toLowerCase())
    .join(',')
```

Search is then a substring test against that string, with position-based scoring, multi-word AND narrowing, and a 90-result cap:

```ts
const score = emoji.search.indexOf(',' + value) // O(1)-ish, no per-emoji array scan
```

**Why it matters here:** our `helpers.ts:51` only inspects index `0` of the name array. I simulated this borrowed approach against **our own dataset** — no data change needed, because the aliases are already there:

```text
query                     current   token-index
thumbsup                        0             1   -> thumbs up sign (1f44d)
+1                              0             1   -> thumbs up sign (1f44d)
joy_cat                         0             1   -> cat face with tears of joy (1f639)
smile                           1             6
face                          151            90   (capped)
+1 thumbsup                     0             1
```

Five of the queries that return **nothing today** work immediately. The data already contains `thumbsup`, `+1`, `joy_cat` as aliases — we simply never look at them.

**But improve their ranking.** Their position score is naive; it ranks `joy` → _joystick_ and `grinning` → _grinning cat_. I tested a tiered score instead — exact alias `0` < alias prefix `10` < word match `20` < substring `40`, summed across words — which fixes it:

```text
joy        -> face with tears of joy / cat face with tears of joy / joystick
grinning   -> grinning face / grinning cat face...
smile      -> smiling face with open mouth and smiling eyes / ...
uk flag    -> united kingdom flag / ukraine flag
```

**Port:** rewrite `filterEmojis` to (a) build the index once per dataset (memoised by dataset identity, not per keystroke), (b) normalise with `.normalize('NFD').replace(/\p{Diacritic}/gu,'')` and strip `:`/`_`, (c) score in tiers, (d) hoist `toLowerCase()` out of the loop and debounce ~150 ms. Fixes **P1-5**. Cost: one helper, no API change.

**Residual gap:** `red heart` still returns 0 because our data calls it _"heavy black heart"_ (Emoji 13-era naming). No search algorithm fixes stale names — this reinforces that the data regeneration (Emoji 17 from emojibase) is still required, and that it also **replaces the need to hand-build keywords**.

---

## 2. localStorage frecency instead of IndexedDB

**What they do** (`helpers/store.ts`, `helpers/frequently-used.ts`):

```ts
function set(key, value) {
  try {
    window.localStorage[`emoji-mart.${key}`] = JSON.stringify(value)
  } catch (e) {}
}
```

- Stores a **frequency counter**, not an ordered list: `Index[emojiId] += 1`, sorted by count desc with alphabetical tie-break.
- Seeds curated `DEFAULTS` for first-time users (so the "frequently used" row is never empty — we ship an empty _Recently used_ group instead).
- Caps at `maxFrequentRows * perLine`, pins the `last`-used emoji so it can't be evicted.
- Persists after mutating, in `try/catch`, so private mode / quota / disabled storage degrade silently.

**Why it matters here — this is the biggest two-for-one in the codebase.** Everything our IndexedDB layer does is store **at most 24 emoji ids**, and it costs us the entire SSR break (#63), an unhandled rejection on import, a leaked connection per call, an un-migrated `DB_VERSION = 3`, and a read-modify-write race. Replacing `store/db.ts` + `openDB`/`idb` with a ~15-line localStorage helper:

- **fixes P0-2 / #63 outright** — `window` access inside `try/catch` is SSR-safe by construction (a `ReferenceError` is caught);
- **removes the `idb` runtime dependency** entirely;
- lets us drop the `upgrade()`/object-store/index schema that never migrated;
- and storing **counts keyed by emoji id** (rather than `{u, n}` objects) fixes our tone-loss bug (P1-9) as a side effect, because the rendered variant is resolved from the live dataset at render time — stale ids are simply dropped when the dataset updates.

Frecency also gives a better answer than pure MRU to **issue #75** (recents "change places every time you click"): frequency ordering is stable under repeated clicks on the same emoji, whereas MRU reorders on every interaction. That turns a UX complaint into a non-issue.

**Caveat:** localStorage is synchronous and shared per origin, so namespace it (`v3ep.`) and guard JSON parsing.

---

## 3. Roving grid keyboard navigation + live region

**What they do** (`Picker.tsx:474-553`, `751-805`, `1004-1013`):

- The grid is modelled as `grid[row][col]` of emoji; arrow keys move a `[p1, p2]` cursor with wraparound, Enter selects, Escape clears/blurs.
- Buttons get `tabindex="-1"`, `aria-label={native}`, `aria-selected`, `aria-posinset`, `aria-setsize`.
- One `aria-live="polite"` `sr-only` region announces the focused emoji's name as the cursor moves.
- Typing in search reflows results into a new grid, and `ArrowDown` moves focus from the input into the grid.
- Search input is `type="search"` with a labelled **Clear** button.

**Why it matters here:** our review measured **zero** `aria-*`/`role=`/`tabindex`/`keydown` in all of `src/`, and every emoji is a plain button — up to 1,563 tab stops between search and footer. This is the highest-value a11y borrow, and it's a well-trodden pattern that ports directly to Vue (`ref` grid, `@keydown` on the container, `computed` positions, `nextTick` for scroll).

**Port target:** `Body.vue` (grid + roving tabindex + live region), `Header.vue` (search semantics + Clear), `Footer.vue` (their radiogroup pattern for skin tones at `Picker.tsx:1038-1089` is directly reusable — `role="radiogroup"`, real radio inputs, visually-hidden labels).

---

## 4. IntersectionObserver-deferred row rendering

**What they do** (`Picker.tsx:152-196`, `326-360`): build the full grid, but render only every `Performance.rowsPerRender = 10`th row initially (`rowRef = rowIndex % 10 ? {} : createRef()`), then an `IntersectionObserver` with a `rootMargin` buffer of `emojiButtonSize * (rowsPerRender + 5)` marks rows visible as they approach the viewport. Plus `PureInlineComponent` as a memo boundary and `deepEqual` on the cursor position so only the two affected buttons re-render.

**Why it matters here:** `Body.vue` renders all 1,563 buttons eagerly, and because `updateSelect` replaces `state.recent` on every click, the `emojis` computed re-runs over the entire dataset and re-patches the whole list per click (P1-8). A 10-row-window + buffer is far simpler than full virtualization and eliminates both symptoms. Vue equivalent: a `Set` of visible row indices in `shallowRef`, `v-for` filtered by it, `v-memo` or child components keyed on `emoji.u`.

---

## 5. IntersectionObserver scroll-spy for the category nav

**What they do** (`Picker.tsx:288-324`): observe each category root with `threshold: [0, 1]` relative to the scroll container; whichever category has the highest intersection ratio becomes the active nav item. `scrollTo()` computes row offsets from grid indices (`rowIndex * emojiButtonSize`) rather than DOM measurement.

**Why it matters here:** `Body.vue:129-140` does `bodyInner.value?.querySelector('#' + state.activeGroup)` and then manually subtracts `offsetTop`/`parentNode.offsetTop`. That approach (a) throws `DOMException` for group keys containing CSS-special characters, (b) depends on `:id="key"` producing **duplicate DOM ids** whenever two pickers share a page, and (c) fights scroll-snap/sticky headers. An observer-based approach removes all three, and is a prerequisite for the per-instance id prefixing we need anyway.

---

## 6. Spritesheet rendering with an injectable URL

**What they do** (`components/Emoji/Emoji.tsx:32-73`): a single `<span>` with `background-image: url(sheets-256/64.png)` and per-emoji `background-position` computed from `sheet.cols/rows` and the emoji's `x`,`y`. Both `getImageURL` and `getSpritesheetURL` are props, so consumers can self-host or swap to Twemoji/Noto.

**Why it matters here:** our default issues up to ~3,800 individual CDN requests per session and hotlinks Apple artwork whose upstream licence explicitly excludes commercial use. A sheet is **one request**, and the injectable URL turns the licensing decision into a _consumer_ configuration rather than a hardcoded choice. `emoji-datasource-apple@16.0.0` ships `sheets-256/64.png` (4.31 MiB) — or point `getSpritesheetURL` at a Twemoji/Noto sheet instead.

**Caveat:** 4.31 MiB is a big single asset; pair it with the native-render path (§8) so the sheet is opt-in.

---

## 7. Data as a pluggable async prop

**What they do** (`config.ts:57-62`): `data` accepts an object **or an async function**, and with neither it falls back to fetching a per-version set from jsDelivr. `set: 'native' | 'apple' | …` selects the artwork; `categories` filters; `custom` injects user categories; `exceptEmojis` excludes ids.

**Why it matters here:** 153 KB of dataset is inlined into our bundle and is not tree-shakeable — every consumer pays for all 1,563 emoji on first paint. Adding an optional `data?: EmojiRecord | (() => Promise<EmojiRecord>)` prop, defaulting to today's bundled JSON, is **backwards compatible** and lets size-sensitive consumers lazy-load. Their `custom` + `categories` + `exceptEmojis` trio is also a cleaner model than our overlapping `additionalGroups` / `disabledGroups` / `groupOrder` props, and `exceptEmojis` directly answers open **PR #78** ("disable emojis by unicode").

---

## 8. Canvas-based native-support detection

**What they do** (`helpers/native-support.ts`): draw a probe emoji in two colours on a canvas, compare pixels to detect missing glyphs; probe a descending list of version-marker emoji to return `latestVersion()`; also `noCountryFlags()` to fall back to a safe flag subset on Windows.

**Why it matters here:** our `native` prop is all-or-nothing and `isMac()` is a bad proxy that **throws on Node 18/20** (P0-2). Support detection would let us default to native where it works and images where it doesn't, and fix the "missing emoji on Windows" class of report (#20, #66). Their `!ctx` fallback (`() => false`) is also correctly Node-safe — unlike ours.

---

## 9. i18n as data files

**What they do:** 22 locale JSON files (`packages/emoji-mart-data/i18n/*.json`) containing category names, `search`, `skins.*`, `clear`; selected with a `locale` prop and lazy-fetched.

**Why it matters here:** our UI strings are split awkwardly between `staticTexts` (placeholder, skin tone) and `groupNames` (categories), and there is no way to localize "No emoji has been found". A single `i18n` prop with a bundled `en` default is the cleaner API.

---

## What _not_ to borrow

| Don't                                                 | Why                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preact + custom-element core**                      | We're a Vue component. Their architecture exists to be framework-agnostic; ours should optimise for Vue's reactivity (`computed`/`watch`) instead.                                                                                                                                                                                 |
| **Global mutable `Data` / `I18n` + `init()` promise** | This is exactly the anti-pattern that causes multi-instance interference. Their global singleton means **two pickers can't have different data sets**. Our per-instance `provide`/`inject` store is genuinely better — keep it and fix its reactivity instead. Their `init()` warn-and-pend behaviour is a symptom of this design. |
| **Their test suite**                                  | `src/helpers/__tests__/search-index.test.js` and `frequently-used.test.js` are both `test.skip('', () => {})`. There is no coverage to emulate; write the tone-index-0 / caret-0 / SSR smoke tests from our own review.                                                                                                            |
| **Their data pipeline output as-is**                  | `@emoji-mart/data` stops at **Emoji 15** (built from `emoji-datasource@15.0.1`, last published 2024-04), and their sets ship 6 artwork variants. We should generate from `emojibase-data@17` instead and borrow only the _search-token + sheet-coords_ shape.                                                                      |
| **`dangerouslySetInnerHTML` for category icons**      | They render category icon SVG via `dangerouslySetInnerHTML` (`Navigation.tsx:32`); we already have an equivalent `innerHTML` XSS sink in `Body.vue:125`. Don't add a second one.                                                                                                                                                   |
| **Swapping the dependency**                           | Adopting emoji-mart as the engine would replace one dormant, 221-issue project with another, and forfeit the 254k-download API surface.                                                                                                                                                                                            |

---

## Suggested adoption order

Mapped onto the release plan in the main review:

**1.1.9 (patch, low risk)**

- §1 search token index — pure helper rewrite, no API change, fixes 84.6% alias miss **and** the `joy`/`grinning` ranking with tiered scoring.
- §2 store → localStorage frecency — fixes SSR/`#63`, drops `idb`, fixes tone loss, improves `#75`.
- §8 guard + `typeof navigator` check — mirrors their `!ctx` fallback.

**1.2 (infrastructure)**

- §3 keyboard nav + live region + radiogroup skin tones.
- §4 row-boundary rendering and §5 scroll-spy (both unlock the duplicate-id fix).
- Add the packed-tarball SSR smoke test that would have caught `indexedDB` — note their CI has the same blind spot, so this is a place to be _better_ than the reference, not equal to it.

**2.0 (breaking, with compat shim)**

- §6 spritesheet + injectable URL (after the artwork-licensing decision).
- §7 pluggable async `data`, `exceptEmojis`, `custom` categories — deprecate `additionalGroups`/`disabledGroups`/`groupOrder` in favour of their cleaner model.
- §9 i18n prop.

**Licensing:** emoji-mart is MIT, so the _design_ is free to reimplement. If any code is copied verbatim (e.g. the canvas support probe, which is itself derived from `koala-interactive/is-emoji-supported`), retain the MIT notice and original attribution in a `NOTICE`/file header.

---

_All measurements above were produced by downloading emoji-mart's source, and by simulating its search index and a tiered-scoring variant against this repo's `src/data/emojis.json` (1,563 emoji). No source files were modified._
