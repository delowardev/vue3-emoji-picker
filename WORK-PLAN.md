# Work Plan — vue3-emoji-picker modernization

**Companions:** [MODERNIZATION-REVIEW.md](MODERNIZATION-REVIEW.md) (what's broken) · [EMOJI-MART-CONCEPTS.md](EMOJI-MART-CONCEPTS.md) (what to borrow)
**Baseline:** `1.1.8`, last publish 2023-10-11, 254,030 downloads/month, 23 open issues, 6 open PRs.
**Estimates** are solo-developer ranges and assume no surprises in the toolchain bump. Treat them as ordering aids, not commitments.

> **Status (2026-10-26):** Phase 0 and Phase 1 are implemented on disk, version bumped to `1.1.9`.
> All local gates pass — `type-check`, `lint`, `prettier`, 15 tests, `build`, `publint` ("All good"),
> `attw` ("No problems found" in node10 / node16-CJS / node16-ESM / bundler), `test:ssr`, `test:pack`,
> and `npm ci` from the regenerated lockfile.
> **Remaining owner action:** enable GitHub Actions (Settings → Actions → General), then push — the
> workflow is valid YAML with `on`, `permissions` and an 11-step gate chain, but the repo currently
> registers zero workflows.

---

## Principles

1. **Unblock users before improving architecture.** Ship the six P0 defects as `1.1.9` while the infrastructure catches up. Do not couple a hotfix to a storage or rendering rewrite.
2. **No phase starts until the previous phase's gates are green in CI.** Every fix gets a test that fails without it.
3. **No breaking change without a deprecation path.** 254k monthly downloads means `1.x` must keep working through `2.0`.
4. **Patch releases carry the smallest possible diff.** If a change could plausibly regress rendering or persistence, it belongs in a minor, not a patch.
5. **Be better than the reference where the reference is weak.** emoji-mart ships skipped tests and a global mutable data singleton; don't copy those habits.

---

## Phase overview

| Phase | Version | Goal                                       | Effort  | Gate to exit                                                            |
| ----- | ------- | ------------------------------------------ | ------- | ----------------------------------------------------------------------- |
| **0** | —       | Guardrails: CI that actually runs          | 0.5–1 d | Workflow visible in Actions; a deliberately broken branch goes red      |
| **1** | `1.1.9` | Ship the 6 P0 defects + alias search       | 2–3 d   | `publint` + `attw` clean; SSR import test passes; skin-tone test passes |
| **2** | `1.2.0` | Accessibility, storage, render performance | 6–9 d   | Keyboard-only walkthrough passes; no `idb`; ≤ N nodes rendered          |
| **3** | `1.3.0` | Toolchain modernization, no API change     | 2–4 d   | 0 known vulns; build output byte-comparable; all gates green            |
| **4** | `2.0.0` | Emoji 17 data, pluggable data, new API     | 10–15 d | Data regenerated reproducibly; compat shim; migration guide             |

Total: roughly **4–6 weeks** part-time. Phases 0 and 1 are the only ones with a hard external deadline character — they fix live user pain.

---

## Phase 0 — Guardrails

**Goal:** make it impossible to merge a regression again. Nothing else is trustworthy until this is done.

- [ ] **P0-0.1 — Enable GitHub Actions (BLOCKER, owner action).**
      The workflow file exists on `main` (588 bytes, identical to local), but `GET /actions/workflows` returns `total_count: 0` and `/actions/runs` returns `0`. Actions has never executed. Verify **Settings → Actions → General → Allow all actions**, then confirm the workflow registers. If the account cannot enable it, the entire CI plan needs a different host (see risk R1). _This is the only task that can't be done from the repo._
- [ ] **P0-0.2 — Rewrite the workflow** as `.github/workflows/ci.yml`:
  - `on: [push, pull_request]` targeting `main`; `permissions: contents: read`
  - `actions/checkout@v4`, `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: 'npm'`
  - Replace every `yarn` command with `npm ci` + `npm run …`
  - Steps in order: `type-check` → `lint` → `prettier` → `test:once` → `build` → `publint` → `attw --pack .` → `test:ssr` → `test:pack`
  - Matrix on **Node 22 and 24** (current LTS lines), not 16/18
- [ ] **P0-0.3 — Add `.nvmrc`** (`22`) and set `engines.node` to match the toolchain floor.
- [ ] **P0-0.4 — One lockfile.** Delete `yarn.lock`, keep `package-lock.json`, regenerate so the root version reads `1.1.8` and `engines` is present. Add `"packageManager": "npm@11"`. Verify `npm ci` succeeds from a clean checkout. _(Dependency sets are already structurally in sync — only the root `version` field is stale at `1.1.7`.)_
- [ ] **P0-0.5 — Add the `test:ssr` gate** (`scripts/smoke-ssr.mjs`): import `dist/emoji-picker.es.js` in plain Node, register `unhandledRejection`, assert none fires. **This single check would have caught the `indexedDB` break, and emoji-mart's CI has the same blind spot** — being better here is cheap.
- [ ] **P0-0.6 — Add the `test:pack` gate**: assert the packed tarball contains only the intended files (no `favicon.ico`, no `src/`), and that every path in `main`/`module`/`types`/`exports` exists.
- [ ] **P0-0.7 — Pin `publint` and `@arethetypeswrong/cli`** as devDependencies; stop using `npx @latest` (non-reproducible, and the earlier audit run hit exactly that).
- [ ] **P0-0.8 — Fix husky**: file-scoped lint-staged (`["eslint --fix", "prettier --write"]`), and move the full `npm run build` out of `pre-commit` into CI.
- [ ] **P0-0.9 — Add `noUnusedLocals` / `noUnusedParameters`** to `tsconfig.json`; include the test directory with `allowJs`.

**Exit criteria:** the Actions tab shows the workflow; a commit with a deliberate type error goes red; `npm ci && npm test && npm run build` passes locally from a clean clone.

---

## Phase 1 — `1.1.9` hotfix

**Goal:** close the six P0 defects and make aliases searchable. Smallest viable diff; no API breaks.

### 1a. Skin tone (the signature bug)

- [ ] **P0-1.1** — `src/helpers.ts:59-62`: replace `findIndex(...) || -1` with an explicit `find` that matches the tone segment:
  ```ts
  const variation = emoji[EMOJI_VARIATIONS_KEY]?.find((v) =>
    v.split('-').includes(skinTone)
  )
  if (variation) result = variation
  ```
- [ ] **P0-1.2** — Regression test: for all 212 tone-capable emoji, each of the 5 tones resolves to a variant containing that tone, and `neutral` resolves to the base. This test fails on `main` today.

### 1b. SSR safety (keep minimal — the storage rewrite is Phase 2)

- [ ] **P0-1.3** — `src/store/index.ts:10`: delete the module-scope `initialize()` call; invoke lazily from `onMounted` / first store use, guarded by `typeof indexedDB !== 'undefined'`.
- [ ] **P0-1.4** — `src/helpers.ts:88-93`: `const nav = typeof navigator !== 'undefined' ? navigator : undefined`.
- [ ] **P0-1.5** — `src/helpers.ts:15-21`: validate each segment (`Number.isInteger`, code-point range) and return `''` instead of throwing.
- [ ] **P0-1.6** — `src/helpers.ts:49-51`: skip records without a non-empty `n[0]`; coerce with `String()`.
- [ ] **P0-1.7** — `src/store/index.ts:87`: `try/catch` the `JSON.parse`; `:149-157`: `await tx.done` inside `try/catch` so write failures can't leak an unhandled rejection.
- [ ] **P0-1.8** — Test: `test:ssr` gate (from P0-0.5) passes.

### 1c. Packaging

- [ ] **P0-1.9** — Move `vue` from `dependencies` to `peerDependencies` (`">=3.2.23"`), keep it in `devDependencies`.
- [ ] **P0-1.10** — `"type": "module"`; emit `.mjs`/`.cjs` (or `fileName` mapping) so the ESM file isn't interpreted as CJS.
- [ ] **P0-1.11** — `exports` with types-first conditions, a `require`-side `.d.cts`, a trailing `default`, and `"./package.json"`:
  ```json
  ".": {
    "import":  { "types": "./dist/emoji-picker.d.mts", "default": "./dist/emoji-picker.mjs" },
    "require": { "types": "./dist/emoji-picker.d.cts", "default": "./dist/emoji-picker.cjs" },
    "default": "./dist/emoji-picker.mjs"
  },
  "./css": { "default": "./dist/style.css" }
  ```
- [ ] **P0-1.12** — Make `r` optional in `Emoji` (`src/types.ts:29-35`) and export the key constants; re-export `Group`, `GroupKeys`, `GroupNames`, `State`, `EmojiRecord` from `src/export.ts`.
- [ ] **P0-1.13** — Fix the `group-icons` precedence bug: `Header.vue:104-105` spreads `groupIcons` _before_ `recent`, so `recent` can never be overridden. Documented in the README but not working.
- [ ] **P0-1.14** — CHANGELOG `1.1.9`; README: remove the `declare module 'vue3-emoji-picker'` advice, add an SSR/nuxt note.

### 1d. DOM-XSS

- [ ] **P0-1.15** — `Body.vue:122-127`: remove `innerHTML`; track a per-emoji `failed` flag and render `<span>{{ unicodeToEmoji(emoji.r) }}</span>` in the template (or `textContent`). Add a test with a hex payload that decodes to markup.

### 1e. Alias search (cheap, high value — from EMOJI-MART-CONCEPTS §1)

- [ ] **P0-1.16** — Rewrite `filterEmojis` to build a comma-prefixed token string per emoji from **all** `n[]` entries (plus hyphen/underscore-split variants), normalised with `.normalize('NFD').replace(/\p{Diacritic}/gu,'')`.
- [ ] **P0-1.17** — Tiered scoring: exact alias `0` < alias prefix `10` < word match `20` < substring `40`; AND across whitespace-separated words. _(emoji-mart's raw position scoring ranks `joy` → joystick; the tiered variant ranks `joy` → face with tears of joy. Borrow the index, not the ranking.)_
- [ ] **P0-1.18** — Memoise the index by dataset identity; hoist `toLowerCase()` out of the loop; debounce input ~150 ms.
- [ ] **P0-1.19** — Tests: `thumbsup`, `+1`, `joy_cat` return exactly 1; `joy` ranks the face first; `uk flag` ranks united-kingdom first.

**Exit criteria:** all new tests pass; `publint` and `attw` report no errors in any of the four resolution modes; `npm pack` contains only intended files; a consumer fixture can `require()` and `import` with types.

---

## Phase 2 — `1.2.0` quality

**Goal:** accessibility, storage simplification, render performance. Minor release, no prop removals.

### 2a. Replace IndexedDB with localStorage frecency

- [ ] **P1-2.1** — New `src/store/storage.ts` (~20 lines): namespaced `get`/`set` with `try/catch` (SSR-safe by construction).
- [ ] **P1-2.2** — Store **counts keyed by emoji id** plus a `last` pointer (emoji-mart §2), not `{u, n}` objects. This fixes the tone-loss bug for free and makes stale ids self-pruning after a dataset upgrade.
- [ ] **P1-2.3** — Seed curated defaults so the "recently used" row is never empty on first run.
- [ ] **P1-2.4** — Delete `src/store/db.ts`, drop the `idb` dependency, remove the `DB_VERSION`/`upgrade()`/index dead weight.
- [ ] **P1-2.5** — Migration: attempt one read of the old IDB record and carry it over; otherwise start fresh. Tests for empty/corrupt/legacy storage.

### 2b. Prop reactivity (the most-reported latent bug)

- [ ] **P1-2.6** — `Picker.vue:127-144`: `watch` on props → `store.updateOptions`. All 17 props become live instead of mount-only.
- [ ] **P1-2.7** — Convert captured primitives to `computed`: `type`/`isInputType` (`Root.vue:119`, `Picker.vue:156`), `native` (`Body.vue:150`, `Footer.vue:109`), `platform` (`Body.vue:107`), and `Header.vue:58-85`'s `orderedKeys`/`groups`/`orderedGroups`.
- [ ] **P1-2.8** — Remove `Body.vue:92-105`'s `toRaw(...)` mutation of store state; compute group names once in the store and read from both components (also removes the duplicate naming logic).

### 2c. Accessibility (currently zero `aria-*`/`role`/`tabindex`/`keydown`)

- [ ] **P1-2.9** — `Body.vue`: `role="grid"` semantics, roving `tabindex` (or `aria-activedescendant`), `aria-posinset`/`aria-setsize`, `:aria-label="emoji.n[0]"` per button, Arrow/Home/End/Enter/Escape handling, wraparound navigation.
- [ ] **P1-2.10** — `aria-live="polite"` region announcing the focused emoji.
- [ ] **P1-2.11** — Popup: `role="dialog"`, `aria-modal`, label, focus move on open, focus restore on close, Escape to close, `aria-expanded`/`aria-controls`/`aria-haspopup` on the toggle (`Root.vue:25-42`).
- [ ] **P1-2.12** — Skin tones: `role="radiogroup"` + real radio inputs + labelled swatches (`Footer.vue:27-33`) — copy emoji-mart's `Picker.tsx:1038-1089` pattern.
- [ ] **P1-2.13** — Search: `type="search"`, label/`aria-label`, labelled Clear button (`Header.vue:21`).
- [ ] **P1-2.14** — Group buttons: `aria-label` + `aria-pressed`, active state bound to `state.activeGroup` (`Header.vue:4-16`).
- [ ] **P1-2.15** — Group titles: replace `<h5>` with `role="group"` + `aria-labelledby`; `role="status"` on the empty-state message (`Body.vue:6-12,35`).
- [ ] **P1-2.16** — CSS: restore `:focus-visible` rings (`header.scss:56`), add `prefers-reduced-motion` overrides, theme-aware colours in `footer.scss`/`scrollbar.scss`.
- [ ] **P1-2.17** — Optional but recommended: `vitest-axe` assertions for the picker, popup, and skin-tone menu.

### 2d. Render performance

- [ ] **P1-2.18** — Remove `recent` from the filtered `emojis` computed so a click no longer re-filters all 1,563 entries.
- [ ] **P1-2.19** — Row-boundary rendering: render every 10th row initially, grow via `IntersectionObserver` + `rootMargin` buffer (emoji-mart §4). Key on `emoji.u`, not `emoji.r`.
- [ ] **P1-2.20** — Scroll-spy via `IntersectionObserver` on category roots; delete the `querySelector('#' + activeGroup)` + `offsetTop` math (`Body.vue:129-140`).
- [ ] **P1-2.21** — Per-instance id prefix (`useId`) so two pickers on one page stop producing duplicate DOM ids.
- [ ] **P1-2.22** — `Root.vue`: keep and `destroy()` the Popper instance on unmount.
- [ ] **P1-2.23** — `Root.vue:146-150`: fix `selectionEnd || -1` (same `|| -1` class as P0-1.1) and restore the caret with `setSelectionRange` after `nextTick`.
- [ ] **P1-2.24** — Controlled-input semantics: make `:text` a real controlled prop (or document it as initial-only) — issue #65.

**Exit criteria:** keyboard-only walkthrough (open → search → arrow → Enter → Escape) works; axe reports no violations; DevTools shows only the visible-row window in the DOM; `idb` is gone from the dependency tree.

---

## Phase 3 — `1.3.0` toolchain

**Goal:** clear the security backlog with zero API change. Do this _after_ Phase 2 so the new tests are the safety net.

- [ ] **P2-3.1** — `vite` 2 → 8, `@vitejs/plugin-vue` 1 → 6, `vite-plugin-dts` 3 → 5.
- [ ] **P2-3.2** — `vitest` 0.24 → 5, replace deprecated `@vitest/coverage-c8` with `@vitest/coverage-v8`, add coverage thresholds.
- [ ] **P2-3.3** — `typescript` 4.3 → 5.x **and** `vue-tsc` 1.2 → 3.x together — `vue-tsc@1` cannot run on TS ≥5, so these are one atomic change. Validate TS 7 separately before adopting it.
- [ ] **P2-3.4** — ESLint 8 → 10: flat config, `eslint:recommended` + TS plugin, drop `.eslintignore` and `--ext` (both removed in 9).
- [ ] **P2-3.5** — Prettier 2 → 3; `husky` 7 → 9 (hook file format changed); `sass` → `@use` instead of `@import`.
- [ ] **P2-3.6** — `@popperjs/core` → `@floating-ui/dom`, or keep Popper and just add `destroy()` (already done in P1-2.22). Decide based on effort.
- [ ] **P2-3.7** — `vite.config.ts`: `fileURLToPath(import.meta.url)` instead of `require('path')`; externalize `@floating-ui/dom` (or move to devDeps if intentionally bundled); `publicDir: false` so `favicon.ico` stops shipping.
- [ ] **P2-3.8** — Delete dead code: `prep.js`, `src/data/tones.json`, `@babel/types`, the divergent `@vue/compiler-sfc`, `vercel.json`, unused `Root.vue` props.
- [ ] **P2-3.9** — Verify `npm audit` reports **0** vulnerabilities and the built artifact is behaviourally identical (size within ±5%).

**Exit criteria:** all gates green on Node 22/24; audit clean; no change to the public API or runtime behaviour.

---

## Phase 4 — `2.0.0` data + API

**Goal:** current emoji data, decoupled payload, cleaner API. Breaking, with a compat shim and migration guide.

### 4a. Decision gate first

- [ ] **P3-4.1 — Resolve artwork licensing before writing code.** `emoji-datasource-apple`'s MIT covers data only; upstream states Apple artwork is not licensed for commercial use. Options: stay on Apple (status quo, document the risk) · switch default to **Twemoji** (`@twemoji/api@17.0.3`, MIT + CC-BY-4.0) · **Noto** (OFL-1.1) · native-first (zero assets). This choice determines the renderer, the sheet, and `2.0`'s defaults.

### 4b. Data pipeline

- [ ] **P3-4.2** — Replace `prep.js` with `scripts/build-data.mjs` generating from `emojibase-data@17` (Emoji 17.0 + CLDR 48) or `unicode-emoji-json@0.9.0` + `emojilib` for keywords. Emit id, shortcodes, keywords, `skins[]` (unified + native + sheet `x`/`y`), `version`. Committed output + a `--check` mode so CI fails when data drifts.
- [ ] **P3-4.3** — Version the dataset; document the upgrade command. Nothing mainstream has Emoji 18.0 yet, so pin 17 and make the next bump a script run, not a hand edit.
- [ ] **P3-4.4** — Regenerate group metadata from one source of truth (today `groups.json` and `constant.ts` disagree on two titles).

### 4c. Payload and renderer

- [ ] **P3-4.5** — Optional `data?: EmojiRecord | (() => Promise<EmojiRecord>)` prop, defaulting to the bundled JSON — backwards compatible; lets size-sensitive consumers lazy-load the 153 KB.
- [ ] **P3-4.6** — Per-group dynamic `import()` option for the largest categories.
- [ ] **P3-4.7** — Spritesheet renderer + injectable `getSpritesheetURL` / `getImageURL`; make the sheet opt-in (4.31 MB is not a default).
- [ ] **P3-4.8** — Native-first default with canvas support detection (`latestVersion()`, `noCountryFlags()`); replace `isMac()`.
- [ ] **P3-4.9** — `i18n` prop with a bundled `en` default and lazy locale files; fold `staticTexts`/`groupNames` into it with deprecation warnings.

### 4d. API cleanup (with deprecations, not removals)

- [ ] **P3-4.10** — Introduce `exceptEmojis`, `custom` categories, and `categories` filtering (emoji-mart §7). Answers open **PR #78**.
- [ ] **P3-4.11** — Deprecate `additionalGroups` / `disabledGroups` / `groupOrder` in favour of `custom` + `categories`; keep them working through `2.x` with console warnings.
- [ ] **P3-4.12** — `previewPosition` / `navPosition` / `searchPosition` enums with `none` — answers **#73** (hide footer).
- [ ] **P3-4.13** — Migration guide + codemod notes; keep the existing prop names as aliases.

**Exit criteria:** data regenerated reproducibly; bundle shows a measurable first-paint reduction (bucket: −30% gzip or better if data is externalised); all `1.x` props still work; migration guide published.

---

## Cross-cutting — release engineering

Do this alongside Phase 1, because `1.1.9` is the first release that should be automated.

- [ ] **R-1** — Adopt `changesets` (single-package, PR-friendly) or `release-please`.
- [ ] **R-2** — Publish via **npm trusted publishing** (OIDC, `id-token: write`, automatic provenance). Long-lived `NPM_TOKEN` is no longer viable — npm permanently revoked classic tokens in Dec 2025.
- [ ] **R-3** — `prepublishOnly` = full gate chain; no manual `npm publish`.
- [ ] **R-4** — Tag + GitHub Release with the changelog body.
- [ ] **R-5** — Consumer smoke fixture: a tiny app that installs the packed tarball and exercises ESM, CJS, and SSR. This is the check that would have caught every packaging defect in the review.
- [ ] **R-6** — Triage the 23 open issues: close #46 (does not reproduce) and #44 (resolved), fold #70/#76/#63/#65/#73 into this plan, and label the rest.

---

## Decision gates

| ID     | Decision                                                    | Blocks                         | Recommended default                                                                                         |
| ------ | ----------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **D1** | Can the repo owner enable GitHub Actions?                   | Phase 0, everything downstream | Verify first; if not, use a local `pre-push` gate + a separate CI host                                      |
| **D2** | Artwork licence: Apple / Twemoji / Noto / native-first      | Phase 4a                       | Decide before Phase 4; **native-first + injectable URL** minimises legal exposure without forcing a rebrand |
| **D3** | Breaking-change appetite: keep `1.x` alive alongside `2.0`? | Phase 4d                       | Yes — deprecate through `2.x`, remove in `3.0`                                                              |
| **D4** | Package manager: npm or yarn                                | Phase 0                        | **npm** — `package-lock.json` already exists and `npm ci` is the CI default                                 |

---

## Risk register

| ID  | Risk                                             | Likelihood   | Impact                   | Mitigation                                                                                               |
| --- | ------------------------------------------------ | ------------ | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| R1  | Actions cannot be enabled (org policy / account) | Medium       | High — no CI gate at all | Verify in Phase 0 before anything else; fall back to a husky `pre-push` hook running the same gate chain |
| R2  | `vue-tsc@3` + TS 7 incompatibility               | Medium       | Medium                   | Bump to TS 5.x with `vue-tsc@3` first; treat TS 7 as a separate spike (P2-3.3)                           |
| R3  | Vite 8 migration changes build output            | Medium       | Medium                   | Phase 3 is isolated and has no API change; diff dist size/exports and rely on Phase 2 tests              |
| R4  | Spritesheet (4.31 MB) regresses first paint      | Medium       | Medium                   | Opt-in only, behind `getSpritesheetURL`; keep native and per-emoji paths                                 |
| R5  | Breaking `2.0` alienates 254k downloaders        | Medium       | High                     | Deprecation shim, migration guide, publish `2.0` as `next` tag first                                     |
| R6  | Emoji data licensing challenge                   | Low          | High                     | Resolve D2 before shipping a new default renderer                                                        |
| R7  | No consumer integration test → regressions recur | High (today) | Medium                   | R-5 fixture, run against the packed tarball                                                              |

---

## Quality bar (definition of done, all phases)

- `npm ci` from a clean clone, on Node 22 and 24.
- `type-check`, `lint`, `prettier --check`, `test:once`, `build` green.
- `publint` and `attw --pack .` report **no errors** in `node10`, `node16-CJS`, `node16-ESM`, `bundler`.
- `test:ssr` and `test:pack` green.
- Every fixed defect has a test that fails on the previous release.
- CHANGELOG entry for the version; no manual publish.
- Public API diff is empty unless the version is major — or documented + deprecated.

---

## First 48 hours

1. **Confirm D1** — can Actions be enabled? Everything else depends on it.
2. **Phase 0.2–0.6** — rewrite the workflow, add `.nvmrc`, single lockfile, `test:ssr`, `test:pack`. Verify a broken branch goes red.
3. **P0-1.1 + P0-1.2** — skin-tone fix and its regression test (one helper, one test, immediate user value).
4. **P0-1.3 + P0-1.4** — remove the module-scope `initialize()` and guard `navigator`; watch the new `test:ssr` gate flip from red to green.
5. Cut `1.1.9` with those two fixes if time-boxed; the rest of Phase 1 can follow in a `1.1.10` or roll into `1.2`.

---

_Companion documents: [MODERNIZATION-REVIEW.md](MODERNIZATION-REVIEW.md) for the evidence behind each finding, [EMOJI-MART-CONCEPTS.md](EMOJI-MART-CONCEPTS.md) for the borrowed designs referenced above._
