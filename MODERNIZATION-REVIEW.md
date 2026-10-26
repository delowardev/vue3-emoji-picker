# vue3-emoji-picker — Modernization & Maintenance Review

**Package:** `vue3-emoji-picker@1.1.8` · MIT · 241★ · **254,030 npm downloads/month**
**Repo state:** last commit `91ddba9` (2024-04-13), last npm publish **2023-10-11**, upstream `pushed_at` 2024-06-18
**Open backlog:** 23 issues + 6 open PRs, oldest unresolved report from 2021
**Review method:** every claim below was verified by running the code (build, type-check, SSR import, vitest probes against the real dataset), by querying the npm/GitHub/jsdelivr APIs, or by running the publish validators `publint@0.3.25` and `@arethetypeswrong/cli` against the packaged tarball. Items I could not execute are labelled _[not run]_.

**Verification status of the current build:** `npm install` ✅ · `vue-tsc --noEmit` ✅ · `vite build` ✅ · `vitest run` ✅ 3/3 tests · `npm audit` ❌ **40 vulnerabilities (3 critical, 17 high, 20 moderate)** · `publint` ❌ 7 errors/2 warnings · `attw` ❌ 3 of 4 resolution modes broken.

---

## Executive summary

The library is genuinely popular (254k downloads/month) but has been drifting for ~2 years while its toolchain rotted. Five things stand out:

1. **There is a signature bug in skin tones.** `findIndex(...) || -1` collapses index `0` to `-1`, so the **lightest skin tone is silently dropped for all 212 tone-capable emoji**. This is the maintainer-filed issue #76 — one character wide, and worth a release on its own.
2. **SSR/Node is broken at import time.** A module-scope `initialize()` touches `indexedDB`, producing an unhandled rejection on every cold start. This is issue #63 (9 comments, "blocking my deployments") and #56, with users forced into four different workarounds.
3. **The emoji dataset is frozen at Emoji 13.0 (2020)** while the world is on Emoji 17.0/18.0. The pinned image CDN also 404s for every emoji added since — so even adding data wouldn't render.
4. **`vue` is a runtime `dependency` instead of a `peerDependency`.** The build correctly externalizes Vue, so the manifest and the bundle disagree — the classic route to two Vue copies and broken reactivity on pnpm/Nuxt.
5. **CI has literally never run once** (`total_count: 0` workflow runs) — and if it did, it would fail on the first step, because it passes Yarn 2+ flags to a Yarn 1 lockfile. Nothing guards this package: no publish step, no artifact validation, 3 assertions of test coverage.

Additionally, `additionalGroups` is a **DOM-XSS sink** via `innerHTML` in `handleError`, search is broken for 85% of emoji aliases, and there is **zero accessibility markup** — no `aria-*`, `role`, `tabindex`, or keyboard handling anywhere in `src/`.

The highest-leverage framing: **fix the 6 critical/high defects for a 1.1.9 patch now, and plan the toolchain/a11y/data work as a 2.0.** There are 40 dependents-by-download-worth of users on a 2-year-old API, so backwards compatibility matters more than novelty.

---

## Priority 0 — ship a patch release for these

### P0-1. Skin-tone bug: lightest tone is dead for all 212 emoji 🔴

`src/helpers.ts:59-62`

```ts
const v_index =
  emoji[EMOJI_VARIATIONS_KEY]?.findIndex((v) => v.includes(skinTone)) || -1
```

`findIndex` returns `0` when the lightest tone (`1f3fb`) is first in the variations array — which it always is. `0 || -1` is `-1`, so the guard `v_index !== -1` fails and the tone is never applied. This is **not** an optional-tone gap; it's an operator-precedence bug.

Verified against the real dataset with a vitest probe:

```text
light          (1f3fb) -> baby.r = 1f476      <-- TONE LOST
medium-light   (1f3fc) -> baby.r = 1f476-1f3fc
medium         (1f3fd) -> baby.r = 1f476-1f3fd
medium-dark    (1f3fe) -> baby.r = 1f476-1f3fe
dark           (1f3ff) -> baby.r = 1f476-1f3ff

emoji with skin tones: 212; where light tone is dropped: 212
```

**Fix:**

```ts
const v_index =
  emoji[EMOJI_VARIATIONS_KEY]?.findIndex((v) => v.includes(skinTone)) ?? -1
```

Better still, match the tone directly instead of relying on array order:

```ts
const variation = emoji[EMOJI_VARIATIONS_KEY]?.find((v) =>
  v.split('-').includes(skinTone)
)
if (variation) result = variation
```

Closes **#76**. Add a regression test asserting tone index 0.

### P0-2. SSR / Node import crash 🔴

`src/store/index.ts:10` calls `initialize()` at module scope; `src/store/db.ts:8` then calls `openDB()` → `indexedDB`.

Verified with a real SSR render against the built ESM entry:

```text
1) import OK, default export: object
3) SSR RENDER OK, html length: 250792
>>> UNHANDLED REJECTION: ReferenceError: indexedDB is not defined
```

Two notable details:

- It fails **at import**, not at render — and it surfaces as an _unhandled rejection_, so the server-rendered page still succeeds. Apps leak a rejection on every cold start and never notice.
- `src/helpers.ts:88-93` `isMac()` reads bare `navigator`. On Node ≥21 a global stub exists (Node 24 reports `platform: MacIntel`, which masked this in my first test). With the global removed I reproduced `ReferenceError: navigator is not defined` — i.e. **it throws on Node 18/20, exactly the versions in the CI matrix**. `navigator?.` is not a guard for an undeclared global.

This is **#63** (users: "blocking my deployments", plus `fake-indexeddb`, `defineAsyncComponent`, `transpile`, and `<ClientOnly>` workarounds) and **#56**.

**Fix:** lazily initialise behind a browser check, never at module scope.

```ts
async function ensureDb() {
  if (typeof indexedDB === 'undefined') return null
  // ... open once, reuse
}
```

and `const nav = typeof navigator !== 'undefined' ? navigator : undefined`.
Also guard `filterEmojis` (`helpers.ts:49-51` assumes a non-empty `n`) and `unicodeToEmoji` (`helpers.ts:15-21` throws `RangeError` on non-hex input) — both are reachable from consumer-supplied `additionalGroups` and will blank the whole picker.

### P0-3. `vue` must be a `peerDependency` 🔴

`package.json:75-79` lists `vue` under `dependencies`, while `vite.config.ts:19` externalizes it. The bundle expects a host Vue; the manifest installs a private one. Versions `0.0.1`–`0.0.5` had this right and it regressed in `1.0.0`.

The failure is **effect tracking**, not `provide`/`inject` (I tested: refs and `inject` still work across copies because the markers use `Symbol.for`). A `watch`/`computed` from Vue copy A is never triggered by dependencies tracked in copy B. With pnpm's strict `node_modules`, duplication is guaranteed rather than hypothetical.

**Fix:**

```json
"peerDependencies": { "vue": "^3.2.23" }
```

(matching what `pinia` and `vue-router` do). Keep `vue` in `devDependencies` for local builds.

### P0-4. The package is not correctly publishable 🟠

`publint` and `attw` against the real tarball:

```text
attw: node10 ❗️ Incorrect default export | node16-CJS ❌ No types
      node16-ESM 🚭 Unexpected module syntax | bundler 🟢
      "vue3-emoji-picker/css" 💀 Resolution failed in ALL FOUR modes
```

- The `import` condition points at `dist/emoji-picker.es.js` — **ESM code in a `.js` file in a package with no `"type"` field**, so Node treats it as CommonJS. Reproduced independently: `[MODULE_TYPELESS_PACKAGE_JSON] ... Reparsing as ES module`.
- No `types` condition in `exports`, and **no `.d.ts` at all for the `require` target** (`emoji-picker.umd.d.ts` doesn't exist), so every CJS/nodenext TS consumer silently gets no types. `--traceResolution` confirmed the top-level `types` field is _ignored_ and resolution only worked via sibling-`.d.ts` substitution.
- No `default` fallback condition; `"./css"` is a bare string with nowhere to hang types.
- **The exported `Emoji` type is unconstructable.** `types.ts:33` requires the symbol-keyed `r`, which consumers cannot import. Verified:
  ```text
  error TS2741: Property '[EMOJI_RESULT_KEY]' is missing in type
                '{ n: string[]; u: string; }' but required in type 'Emoji'.
  ```
  This is the shape the README itself documents for `additional-groups`.

**Fix:** add `"type": "module"`, emit `.mjs`/`.cjs` (or `.js`/`.cjs`), put `types` **first** in each `exports` condition with separate `.d.mts`/`.d.cts`, add a trailing `default`, and make `r` optional in `Emoji` (or export the key constant). Gate CI on `publint` + `attw`.

### P0-5. CI has never run, and both lockfiles are wrong 🟠

```text
GitHub API: total workflow runs = 0
```

The `Test Automation` badge in the README has therefore been grey for its entire life. The workflow could not have succeeded anyway:

- `.github/workflows/TestAutomation.yaml:23` runs `yarn install --immutable --immutable-cache --check-cache` — **Yarn 2+/Berry flags**, but `yarn.lock` is `# yarn lockfile v1` with no `packageManager`. Yarn 1's equivalent is `--frozen-lockfile`.
- Line 22 sets `cache: 'npm'` while installing with yarn (should be `cache: 'yarn'`).
- `actions/checkout@v2` and `actions/setup-node@master` — `master` is a mutable, unprotected ref; GitHub's own hardening guidance says pin to a full SHA.
- The matrix tests Node 16.16/18.12, both long EOL.
- **Nothing exercises `dist/`** — which is exactly why the SSR, module-syntax, and missing-types breakages above are invisible.
- There is no publish/release step at all; `1.1.8` was published by hand.

Both lockfiles are committed **and they disagree**: `package-lock.json` declares the package's own version as `1.1.7` while `package.json` says `1.1.8`, and `yarn.lock` is formatted Yarn 1. `npm install` immediately rewrote both. Pick one manager, delete the other lockfile, and add a `.nvmrc`.

### P0-6. `additionalGroups` is a DOM-XSS sink 🟠

`src/components/Body.vue:122-127`:

```ts
button.innerHTML = `<span>${unicodeToEmoji(unicode)}</span>`
```

`unicodeToEmoji` decodes _any_ hyphen-separated hex, and `unicode` is `emoji.r`, which is attacker-influenced for the public `additionalGroups` prop (and for IndexedDB-persisted recents). Verified end to end:

```text
attacker-supplied r = 3c-69-6d-67-...-3e
unicodeToEmoji(r)   = "<img src=x onerror=alert(1)>"
=> injected HTML executes via innerHTML: true
```

The `@error` handler is _guaranteed_ to fire, because the corresponding `<img src=".../3c-69-....png">` 404s. It also mutates DOM that Vue owns, so later patches target a detached node. Severity is "requires a developer to pass untrusted data" (not drive-by), but it's a genuine sink.

**Fix:** never use `innerHTML` here. Track a per-emoji `failed` flag reactively and render `<span>{{ unicodeToEmoji(emoji.r) }}</span>`, or use `button.textContent = ...`.

---

## Priority 1 — correctness & compatibility

| #     | Location                                  | Problem                                                                                                                                                                                                                                                                                                                             | Fix                                                                                                                   |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P1-1  | `Picker.vue:127-144`                      | `store.updateOptions()` runs **once in setup**; there is no prop watcher anywhere. All 17 props (`theme`, `disabled-groups`, `group-order`, `native`, `hide-search`…) are mount-only and silently ignore runtime changes.                                                                                                           | `watch(() => ({...props}), p => store.updateOptions(map(p)), { deep: true })`                                         |
| P1-2  | `store/index.ts:94-100`                   | Read-modify-write race: `getRecent().then(r => { state.recent = r; updateLocalStore() })`. Emoji clicked while the IDB read is in flight are discarded, then the stale list is written back over them.                                                                                                                              | Merge instead of clobber; don't persist on load                                                                       |
| P1-3  | `Header.vue:58,68-85`                     | `orderedKeys`/`groups`/`orderedGroups` are built once in `setup()` as plain arrays (`JSON.parse(JSON.stringify(...))` is a pointless deep clone; `groups.splice()` mutates while looping). Group order/names/icons can never update.                                                                                                | `computed()` with `find`+`filter`, no mutation                                                                        |
| P1-4  | `Body.vue:92-105`                         | `toRaw(state.options.groupNames)` then writes to it in setup — bypasses the deliberate `readonly` guard added in 0.0.5, mutates store state from a child, and duplicates `Header.vue:70-75`'s naming logic (the two can disagree).                                                                                                  | Compute group names once in the store                                                                                 |
| P1-5  | `search` — `helpers.ts:51`                | Only `emoji.n[0]` is searched. **855 of 1011 (84.6%) secondary aliases are unsearchable**: `joy_cat` → 0 results, `thumbsup` → 0, `+1` → 0, `:smile:` → 0. No debounce; `filterEmojis` re-scans 1563 entries per keystroke.                                                                                                         | Match all `n[]` aliases, normalise `:`/`_`/`+`, hoist `toLowerCase()` out of the loop, debounce                       |
| P1-6  | `Root.vue:146-150`                        | `cursor = elem.value?.selectionEnd \|\| -1` — the _same_ `\|\| -1` bug: caret position 0 collapses to -1, so `mode="insert"` appends instead of inserting at the start. Selection is also never restored after patching `:value`, so two consecutive picks can insert in the wrong order.                                           | `typeof x === 'number' ? x : -1`, then `setSelectionRange` after `nextTick`                                           |
| P1-7  | `Root.vue:114-118` + `Picker.vue:108,155` | Two independent `input` refs for one value; `:text` is initialisation-only and never watched, so an externally reset value is ignored. **#65**                                                                                                                                                                                      | Single source of truth + `watch(() => props.text)`                                                                    |
| P1-8  | `Root.vue:169-179,198-200`                | `createPopper()`'s return value is discarded and `onBeforeUnmount` only removes the click listener → **leaks a Popper instance + listeners per mount**, retaining detached DOM (the demo mounts six pickers).                                                                                                                       | Keep the instance, `popper?.destroy()` on unmount                                                                     |
| P1-9  | `store/index.ts:163-176`                  | Recents persist `{u, n}` only — the chosen tone is dropped, so a recent "dark thumbs-up" always renders neutral. Dedupe compares `u`, so the tone can't be re-applied.                                                                                                                                                              | Persist `{u, n, r, t}`, dedupe on `r`                                                                                 |
| P1-10 | `store/index.ts:149-157`, `26-30`, `87`   | `store.put()` is never awaited and `updateLocalStore()` never catches → silent data loss on quota/Safari-private/`DataCloneError`. `getRecentEmojis()` opens a new DB per call and never closes it. `JSON.parse(recent[0]?.value \|\| '')` throws on a malformed record. `upgrade()` ignores `oldVersion` despite `DB_VERSION = 3`. | `await tx.done` in try/catch; open once; `try/catch` the parse; branch on `oldVersion`; drop the redundant `id` index |

---

## Priority 2 — the emoji data is 6 years stale

**What ships today:** `src/data/emojis.json` = 157 KB, **1,563 emoji**, frozen at **Emoji 13.0** (matching the pinned `emoji-datasource-apple@6.0.1`, published 2021-03-12). Zero duplicates, zero unicode parse failures — the data is _internally_ clean, just old. Issue **#70** (4 👍) already asks for this.

| Unicode                 | Released  | New emoji | Cumulative         |
| ----------------------- | --------- | --------- | ------------------ |
| **13.0 (current data)** | 2020      | —         | 3,304              |
| 13.1                    | Sept 2020 | +217      | 3,521              |
| 14.0                    | Sept 2021 | +112      | 3,633              |
| 15.0                    | Sept 2022 | 31        | 3,664              |
| 15.1                    | Sept 2023 | +118      | 3,782              |
| 16.0                    | Sept 2024 | 8         | 3,790              |
| 17.0                    | Sept 2025 | 163       | 3,953              |
| **18.0**                | Sept 2026 | 19        | **3,972** ← latest |

So the picker is missing roughly **2,400 emoji** relative to the current set.

**Two coupled blockers:**

1. **The CDN pin 404s for everything newer.** Verified: `1fae0` (Emoji 14) → **404 at `@6.0.1`**, **200 at `@16.0.0`**. Adding modern data without bumping the image version yields broken images.
2. **Issue #46 is a red herring.** The 10-👍 "resource corrupted" report does **not** reproduce: 100/100 random entries and 9/9 group icons returned valid `image/png` with correct PNG magic bytes, and jsdelivr resolves `6.0.1` fine. Most likely regional jsdelivr blocking (mirror projects exist specifically for this) or a transient incident. **Close it** — fixing it fixes nothing. The real CDN defect is the stale version.

**Data source options** (all MIT for the data):

| Package                    | Emoji              | Key size (gzip)                                                  | Shortcodes                          | Notes                                                  |
| -------------------------- | ------------------ | ---------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `emojibase-data@17.0.0`    | **17.0** + CLDR 48 | `en/compact.json` **80.9 KiB**; shortcodes **30.7 KiB** separate | ✅ 7 packs                          | Best fit: highest coverage, separable shortcodes       |
| `unicode-emoji-json@0.9.0` | **17.0**           | `data-by-emoji.json` **30.1 KiB**                                | ❌ (pair with `emojilib`, 49.7 KiB) | Smallest, but no shortcodes                            |
| `emoji-datasource@16.0.0`  | 16.0               | `emoji.json` **100.8 KiB**                                       | ✅                                  | Natural upgrade for the existing CDN + sprite approach |
| `@emoji-mart/data@1.2.1`   | 15.0 only          | `sets/15/native.json` **82.5 KiB**                               | ✅                                  | Not published since 2024-04                            |

Nothing mainstream carries Emoji 18.0 yet, so pin an upgrade path rather than chasing latest.

**Two strategic issues to decide before rewriting the data pipeline:**

- **Licensing.** `emoji-datasource-apple`'s MIT covers the code/data only — the upstream project states plainly that _"Apple images … are not licensed for commercial usage."_ This library hotlinks Apple artwork from a public CDN by default. Commercially-safe alternatives are **Twemoji** (`@twemoji/api@17.0.3`, MIT + CC-BY-4.0, Emoji 17.0) or **Noto** (OFL-1.1). This deserves an explicit decision record, because it determines the whole image strategy.
- **Request amplification.** The current default issues up to **~3,800 individual CDN requests** per session. Modern alternatives: **native unicode** (0 bytes, 0 requests — `emoji-mart`'s and `emoji-picker-element`'s default), or a **single sprite sheet** (`emoji-datasource-apple@16.0.0` ships `sheets-256/64.png`, one 4.31 MiB request).

**Bundle:** 153 KB of dataset is inlined into `dist/emoji-picker.es.js` (260 KB raw / **49 KiB gzip**) and is not tree-shakeable, so every consumer pays for all 1,563 emoji on first paint. Decoupling data (lazy `fetch`, per-group dynamic `import()`, or opt-in per-set import as `emoji-mart-vue-fast` does) is the single biggest delivery win available.

---

## Priority 3 — accessibility: currently zero

`grep -rE 'aria-|role=|tabindex|keydown|Escape' src/` → **0 matches**. For a component with 254k monthly downloads this is the biggest competitive gap; `emoji-picker-element` and `emoji-mart-vue-fast` both shipped a11y + keyboard navigation years ago.

| Location                | Problem                                                                                                                                                                                            | Fix                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `Body.vue:14-31`        | Every emoji is a bare `<button>` with no roving `tabindex` and no arrow/Home/End keys → **up to 1,563 tab stops** between search and footer                                                        | `role="listbox"`/`grid` + roving tabindex + `aria-activedescendant` |
| `Body.vue:25-30`        | Emoji buttons have no reliable accessible name (only `:alt`, and a bare glyph in `native` mode)                                                                                                    | `:aria-label="emoji.n[0]"`                                          |
| `Root.vue:25-32`        | Popup toggle contains only `<img alt="">` → **no accessible name**; no `aria-expanded`/`aria-controls`/`aria-haspopup`                                                                             | `aria-label`, `:aria-expanded="open"`                               |
| `Root.vue:34-42`        | Popup has no `role="dialog"`, focus is never moved/trapped/restored, and **there is no Escape handler anywhere in the package**                                                                    | Dialog semantics + focus management                                 |
| `Header.vue:21`         | Search input has no label; its name comes only from `placeholder`, which a consumer can set to `''`                                                                                                | `<label>` / `aria-label`                                            |
| `Header.vue:4-16`       | `alt=""` discards icon meaning; `:title` sits on a non-interactive `<span>`; no `aria-pressed`, and nothing reads `state.activeGroup` → the selected group is indicated neither visually nor to AT | `aria-label` + `aria-pressed` + active class                        |
| `Footer.vue:27-33`      | The six skin-tone swatches are empty buttons whose only content is a CSS background → **no accessible name at all**                                                                                | `:aria-label` per tone, `role="radiogroup"`/`aria-checked`          |
| `Footer.vue:2,19-24`    | Tone panel opens/closes only on `@mouseleave`; no Escape, no outside click, no focus move                                                                                                          | `aria-expanded` + Escape + focus                                    |
| `Body.vue:35`           | "No emoji has been found!" is announced by nothing                                                                                                                                                 | `role="status"`                                                     |
| `Body.vue:6-12`         | Group titles are `<h5>` → 9 headings per picker injected into the host page (54 for the 6-picker demo)                                                                                             | `<div>` inside `role="group"` + `aria-labelledby`                   |
| `Body.vue:5`            | `:id="key"` produces **duplicate DOM ids** when two pickers share a page, and `querySelector('#' + activeGroup)` throws `DOMException` for keys with CSS-special characters                        | Per-instance id prefix (`useId()`)                                  |
| `styles/header.scss:56` | `:focus { outline: none }` removes the focus ring, leaving only a 1px border colour change                                                                                                         | Restore `:focus-visible`                                            |
| multiple                | `scroll-behavior: smooth` + 200ms transitions with no reduced-motion override                                                                                                                      | `@media (prefers-reduced-motion: reduce)`                           |

---

## Priority 4 — toolchain modernization

Every dependency is multiple majors behind. Current pinned → latest:

| Package               | Pinned  | Latest         | Note                                                |
| --------------------- | ------- | -------------- | --------------------------------------------------- |
| `vite`                | ^2.4.2  | **8.3.4**      | needs Node ≥20.19/22.12                             |
| `vitest`              | ^0.24.5 | **5.0.3**      | needs Node ≥22.12; makes `vite` a peer              |
| `typescript`          | ^4.3.2  | **7.0.2**      |                                                     |
| `vue-tsc`             | ^1.2.1  | **3.3.13**     | requires TS ≥5 — the current pair is incompatible   |
| `eslint`              | ^8.3.0  | **10.12.0**    | flat config; `.eslintignore` + `--ext` removed in 9 |
| `prettier`            | ^2.5.0  | **3.9.10**     |                                                     |
| `husky`               | ^7.0.4  | **9.1.7**      | hook file format changed in v9                      |
| `idb`                 | ^7.1.0  | **8.0.4**      |                                                     |
| `sass`                | ^1.43.2 | **1.105.1**    | `@import` deprecated (warns since 1.80)             |
| `vite-plugin-dts`     | ^3.6.0  | **5.1.2**      |                                                     |
| `@vitejs/plugin-vue`  | ^1.2.5  | **6.0.10**     |                                                     |
| `@vitest/coverage-c8` | ^0.24.5 | **deprecated** | replace with `@vitest/coverage-v8`                  |
| `@popperjs/core`      | ^2.11.0 | 2.11.8         | superseded by `@floating-ui/dom`                    |

**`npm audit`: 40 vulnerabilities (3 critical, 17 high, 20 moderate).** All are devDependency/tooling chains (Vite dev-server advisories, the deprecated coverage-c8 package, `@volar`/`vue-tsc` internals, `yaml`, `postcss`), so the shipped runtime is largely unaffected — but they are real, and the modernized toolchain above clears essentially all of them in one pass.

**Config defects worth folding into the same change:**

| Location                                     | Problem                                                                                                                                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts:19`                          | Only `'vue'` is externalized, so `@popperjs/core` and `idb` — declared runtime `dependencies` — are bundled into `dist` with no `output.globals`. Either externalize them or move them to devDependencies.                                                                                  |
| `vite.config.ts:1`                           | Mixing `require('path')` with ESM imports; works only because the config is bundled as CJS                                                                                                                                                                                                  |
| `.eslintrc.js`                               | Extends only `plugin:vue/vue3-recommended` + `prettier` — **no `eslint:recommended`**, so `no-unused-vars`/`no-undef` are off (which is why dead imports and the `@ts-ignore` at `helpers.ts:43` survive). The TS plugin isn't installed though the parser points at it.                    |
| `tsconfig.json`                              | No `noUnusedLocals`/`noUnusedParameters`/`noUncheckedIndexedAccess`; `include` omits the test file with `allowJs` off, so tests are never type-checked                                                                                                                                      |
| `.husky/pre-commit`                          | Runs a full `npm run build` on every commit, and lint-staged invokes whole-repo `lint:fix`/`prettier:fix` instead of the staged filenames it appends                                                                                                                                        |
| `package.json:44`                            | `prettier -c --write` — contradictory flags (files _are_ written, but it prints misleading failure-looking output)                                                                                                                                                                          |
| `package.json:51,56`                         | `@babel/types` is a dead devDep; `@vue/compiler-sfc ^3.0.5` is redundant **and divergent** from the hoisted `vue` version (classic "Vue packages version mismatch")                                                                                                                         |
| `package.json:19`                            | `engines.node: ">=16.0.0"` advertises three EOL runtimes                                                                                                                                                                                                                                    |
| `src/data/groups.json` vs `constant.ts:7-17` | Same metadata duplicated and **disagreeing**: `"Recently Used"` vs `"Recently used"`, `"Travel & Places"` vs `"Travel places"`. Both are rendered (Header uses one for the tooltip, Body the other for the heading). `groups.json`'s `u` field is never read.                               |
| `src/data/tones.json`                        | Duplicates `SKIN_TONES` and is imported nowhere                                                                                                                                                                                                                                             |
| `prep.js`                                    | Entirely commented-out dead code; the data-generation script is still a `@todo` — which is _why_ the dataset is stuck on Emoji 13                                                                                                                                                           |
| `vercel.json`, `index.html`                  | Vestigial (`github.silent`, `<title>Vite App</title>`); the lib build emits no `index.html`, so the Vercel deploy has nothing to serve                                                                                                                                                      |
| `public/favicon.ico`                         | Copied into `dist/` and published to npm (confirmed in the tarball)                                                                                                                                                                                                                         |
| `CHANGELOG.md`                               | Stops at 1.1.7 while the package is 1.1.8 — the published release has no notes                                                                                                                                                                                                              |
| `README.md`                                  | Tells TS users to add `declare module 'vue3-emoji-picker'`, contradicting the shipped types; omits the `text` prop; documents `offset`'s default as the string `'6'`; the `group-icons` example can't override `recent` because `Header.vue:104-105` spreads `groupIcons` _before_ `recent` |

---

## Suggested sequencing

**Release 1.1.9 — patch, days not weeks.** Low-risk fixes that unblock users today:
P0-1 (skin tone, one character), P0-2 (SSR guards), P0-3 (peerDependency), P0-4 (types/exports), P0-6 (XSS sink), P1-1/P1-5/P1-6/P1-7/P1-8, plus the `Emoji` type fix and the CHANGELOG entry. Add regression tests for tone index 0, caret position 0, and SSR import — these are precisely the cases that table-driven tests catch.

**Release 1.2 — infrastructure.** Fix the CI workflow so it actually runs (`--frozen-lockfile`, `cache: 'yarn'`, `vitest run`, supported Node LTS, pinned action SHAs), add a packed-tarball **import + SSR smoke test**, gate on `publint` + `attw`, delete one of the two lockfiles, and add an OIDC trusted-publishing release step (npm classic tokens were permanently revoked in Dec 2025, so the store-a-secret pattern is dead).

**Release 2.0 — the real modernization.** Decide the artwork-licensing question first, then the toolchain bump (Vite 8 / Vitest 5 / TS 7 / ESLint 10 / vue-tsc 3), the regenerated Emoji 17 data pipeline with a real generator replacing `prep.js`, decoupled/lazy data loading, and the full accessibility + keyboard-navigation pass. Keep the public component API as a compatibility layer — 254k monthly downloads make breaking changes expensive, and the ecosystem's response to upstream dormancy has already been to fork (at least five republished forks exist, the newest from Aug 2026), which is a signal that users want this to keep working.

**Two things easy to get wrong:** issue **#46** ("corrupted CDN") does not reproduce and should be closed rather than chased; and **#75** (recently-used emoji reordering) is working-as-designed MRU behaviour — I reproduced the reorder and it is correct, so it's a UX/documentation decision, not a bug.

---

### Verification appendix

| Claim                         | How it was verified                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Skin tone dropped for all 212 | vitest probe against `filterEmojis` + real dataset; `findIndex` returns `0`, `0 \|\| -1 === -1` |
| SSR unhandled rejection       | `node` import + `renderToString` of the built ESM entry                                         |
| `navigator` ReferenceError    | same access pattern with the global removed                                                     |
| 84.6% aliases unsearchable    | script over `emojis.json`: 855 of 1011 secondary aliases unmatched                              |
| CDN 404s for Emoji 13.1+      | curl of `1fae0` at `@6.0.1` (404) vs `@16.0.0` (200)                                            |
| #46 does not reproduce        | 100 random + 9 group icons: all 200, valid PNG magic                                            |
| XSS sink                      | decode of a hex payload through `unicodeToEmoji` into the `innerHTML` template                  |
| 0 a11y attributes             | `grep -rE 'aria-\|role=\|tabindex\|keydown' src/` → 0                                           |
| CI never ran                  | GitHub API `actions/runs` → `total_count: 0`                                                    |
| Package publish defects       | `publint@0.3.25` and `@arethetypeswrong/cli --pack` on the real tarball                         |
| 40 vulnerabilities            | `npm audit --json`                                                                              |
| Build/type-check/tests pass   | `vue-tsc --noEmit`, `vite build`, `vitest run` (3/3)                                            |

_No source files were modified during this review. The working tree was restored to its committed state; build artifacts and temporary probes were removed._
