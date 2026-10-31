<template>
  <div class="demo">
    <header class="demo-header">
      <a class="brand" href="#top">
        <span class="logo">🙂</span>
        <span class="pixel">vue3-emoji-picker</span>
      </a>

      <nav class="nav">
        <a href="#playground" class="pixel">Playground</a>
        <a href="#features" class="pixel">Features</a>
        <a
          class="pixel"
          href="https://github.com/delowardev/vue3-emoji-picker#readme"
          target="_blank"
          rel="noreferrer"
          >Docs</a
        >
      </nav>

      <a
        class="btn btn-surface github"
        href="https://github.com/delowardev/vue3-emoji-picker"
        target="_blank"
        rel="noreferrer"
        >GitHub</a
      >
    </header>

    <section id="top" class="hero">
      <span class="badge">v{{ version }} · MIT · Vue 3</span>
      <h1 class="pixel">
        The emoji picker<br />for <span class="accent">Vue 3</span>
      </h1>
      <p class="lead">
        Lightweight, fully customizable and keyboard friendly — with a
        framework-agnostic core you can use anywhere.
      </p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#playground">Try the playground</a>
        <button
          type="button"
          class="btn btn-surface install"
          @click="copyInstall"
        >
          <code>npm i vue3-emoji-picker</code>
          <span class="install-copy">{{
            installCopied ? 'Copied' : 'Copy'
          }}</span>
        </button>
      </div>
    </section>

    <section class="stats">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <span class="stat-icon">{{ stat.icon }}</span>
        <strong class="pixel">{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </div>
    </section>

    <section id="playground" class="section-head">
      <h2 class="pixel">Try it <span class="accent">live</span></h2>
      <p>Every control maps to a prop. The usage snippet updates as you go.</p>
      <nav class="tabs">
        <button
          type="button"
          class="pixel"
          :class="{ active: tab === 'vue' }"
          @click="tab = 'vue'"
        >
          Vue component
        </button>
        <button
          type="button"
          class="pixel"
          :class="{ active: tab === 'core' }"
          @click="tab = 'core'"
        >
          Core (vanilla)
        </button>
      </nav>
    </section>

    <main v-show="tab === 'vue'" class="layout">
      <aside class="controls">
        <h2>Options</h2>

        <div class="presets">
          <button
            v-for="preset in PRESETS"
            :key="preset.name"
            type="button"
            @click="applyPreset(preset.values)"
          >
            {{ preset.name }}
          </button>
        </div>

        <h3>Appearance</h3>
        <label class="field">
          <span>Theme</span>
          <select v-model="theme">
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="auto">auto</option>
          </select>
        </label>

        <label class="field">
          <span>Emoji set</span>
          <select v-model="set">
            <option v-for="name in EMOJI_SETS" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Emoji size ({{ emojiSize }}px)</span>
          <input v-model.number="emojiSize" type="range" min="14" max="40" />
        </label>

        <label class="field">
          <span>Per line ({{ perLine }})</span>
          <input v-model.number="perLine" type="range" min="5" max="12" />
        </label>

        <label class="field">
          <span>Width ({{ width }}px)</span>
          <input v-model.number="width" type="range" min="240" max="480" />
        </label>

        <label class="field">
          <span>Height ({{ height }}px)</span>
          <input v-model.number="height" type="range" min="240" max="520" />
        </label>

        <label class="field">
          <span>Accent (focus ring)</span>
          <input v-model="accent" type="color" />
        </label>

        <h3>Layout</h3>
        <div class="toggles">
          <label
            ><input v-model="hideSearch" type="checkbox" /> hide search</label
          >
          <label
            ><input v-model="hideGroupIcons" type="checkbox" /> hide group
            icons</label
          >
          <label
            ><input v-model="hideGroupNames" type="checkbox" /> hide group
            names</label
          >
          <label
            ><input v-model="hideFooter" type="checkbox" /> hide preview</label
          >
          <label
            ><input v-model="disableSkinTones" type="checkbox" /> disable skin
            tones</label
          >
          <label
            ><input v-model="disableStickyGroupNames" type="checkbox" /> disable
            sticky names</label
          >
          <label
            ><input v-model="autoFocus" type="checkbox" /> auto focus
            search</label
          >
        </div>

        <h3>Input mode</h3>
        <label class="field">
          <span>Picker type</span>
          <select v-model="pickerType">
            <option value="">inline</option>
            <option value="input">input</option>
            <option value="textarea">textarea</option>
          </select>
        </label>

        <template v-if="pickerType">
          <label class="field">
            <span>Insert mode</span>
            <select v-model="mode">
              <option value="caret">insert at caret</option>
              <option value="append">append</option>
              <option value="prepend">prepend</option>
            </select>
          </label>

          <label class="field">
            <span>Placement</span>
            <select v-model="placement">
              <option v-for="name in PLACEMENTS" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Offset ({{ offset }}px)</span>
            <input v-model.number="offset" type="range" min="0" max="40" />
          </label>

          <label class="field">
            <span>Input placeholder</span>
            <input v-model="inputPlaceholder" type="text" />
          </label>
        </template>

        <h3>Recently used</h3>
        <div class="toggles">
          <label
            ><input v-model="displayRecent" type="checkbox" /> show recently
            used</label
          >
        </div>
        <template v-if="displayRecent">
          <label class="field">
            <span>Order</span>
            <select v-model="recentMode">
              <option value="recent">most recent</option>
              <option value="frequent">most frequent</option>
            </select>
          </label>
          <label class="field">
            <span>Max recent ({{ maxRecent }})</span>
            <input v-model.number="maxRecent" type="range" min="4" max="48" />
          </label>
        </template>

        <h3>Content</h3>
        <div class="toggles">
          <label
            ><input v-model="customGroup" type="checkbox" /> custom emoji group
            (own images)</label
          >
          <label
            ><input v-model="flagsFirst" type="checkbox" /> flags group
            first</label
          >
        </div>

        <label class="field">
          <span>Disabled emoji (unicode, comma separated)</span>
          <input
            v-model="disabledEmojisText"
            type="text"
            placeholder="1f595, 1f4a9"
          />
        </label>

        <div class="toggles compact">
          <label v-for="group in GROUPS" :key="group[0]">
            <input v-model="disabledGroups" type="checkbox" :value="group[0]" />
            hide {{ group[1] }}
          </label>
        </div>

        <h3>Language</h3>
        <label class="field">
          <span>Locale (via the i18n prop)</span>
          <select v-model="locale">
            <option v-for="(_, key) in LOCALES" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
        </label>
      </aside>

      <section class="stage">
        <div class="picker-wrap" :class="{ dark: isDark }" :style="stageVars">
          <picker
            v-bind="pickerProps"
            @select="onSelect"
            @update:text="onText"
          />
        </div>

        <p class="hint">
          <kbd>Tab</kbd> into the grid · <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd
          ><kbd>↓</kbd> move · <kbd>Enter</kbd> select · in search,
          <kbd>↓</kbd> enters the grid and <kbd>Enter</kbd> picks the first
          result · <kbd>Esc</kbd> closes popups
        </p>

        <div class="output">
          <div class="panel">
            <h3>Selected</h3>
            <pre v-if="selected" class="code">{{ selectedJson }}</pre>
            <p v-else class="muted">Click an emoji to inspect the event.</p>
            <p v-if="pickerType" class="text-row">
              <span class="label">text</span>
              <code>{{ JSON.stringify(text) }}</code>
            </p>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h3>Usage</h3>
              <button type="button" class="copy" @click="copyCode">
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>
            <pre class="code">{{ codeSnippet }}</pre>
          </div>
        </div>
      </section>
    </main>

    <main v-show="tab === 'core'" class="layout">
      <aside class="controls">
        <h2>Core API</h2>
        <p class="muted">
          This panel uses <code>createPicker()</code> and plain DOM — no Vue
          component involved. The same entry powers other frameworks.
        </p>

        <label class="field">
          <span>Search</span>
          <input v-model="coreSearch" type="text" placeholder="thumbsup…" />
        </label>

        <label class="field">
          <span>Skin tone</span>
          <select v-model="coreTone">
            <option v-for="tone in SKIN_TONES" :key="tone" :value="tone">
              {{ tone }}
            </option>
          </select>
        </label>

        <p class="muted">{{ coreCount }} results</p>

        <pre class="code">{{ coreJson }}</pre>
      </aside>

      <section class="stage">
        <div ref="coreRoot" class="core-root"></div>

        <div class="panel">
          <h3>Shortcodes → emoji</h3>
          <p class="muted">
            <code>replaceShortcodes()</code> from
            <code>vue3-emoji-picker/core</code> — handy for text stored as
            <code>:wave:</code>.
          </p>
          <textarea v-model="shortcodeInput" class="shortcode-input" rows="3" />
          <p class="shortcode-output">{{ shortcodeOutput }}</p>
        </div>
      </section>
    </main>

    <section id="features" class="section-head">
      <h2 class="pixel">Why <span class="accent">vue3-emoji-picker</span>?</h2>
      <p>Everything you need, nothing you have to fight.</p>
    </section>

    <section class="features">
      <div v-for="feature in FEATURES" :key="feature.title" class="feature">
        <span class="feature-icon">{{ feature.icon }}</span>
        <div>
          <h3 class="pixel">{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </div>
      </div>
    </section>

    <footer class="demo-footer">
      <span class="pixel">vue3-emoji-picker</span>
      <span
        >MIT licensed · built with Vue 3 · artwork from emoji-datasource</span
      >
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Picker from './components/Picker.vue'
import {
  createMemoryStorage,
  createPicker,
  EMOJI_SETS,
  replaceShortcodes,
  SKIN_TONES,
  unicodeToEmoji,
} from './core'
import type { EmojiSet, I18nInput, InsertMode, RecentMode } from './core'
import { BUILTIN_CATEGORIES, defaultEmojis } from './core'
import pkg from '../package.json'

const version = pkg.version

const GROUPS: Array<[string, string]> = [
  ['smileys_people', 'Smileys & People'],
  ['animals_nature', 'Animals & Nature'],
  ['food_drink', 'Food & Drink'],
  ['activities', 'Activities'],
  ['travel_places', 'Travel & Places'],
  ['objects', 'Objects'],
  ['symbols', 'Symbols'],
  ['flags', 'Flags'],
]

const PLACEMENTS = [
  'bottom-end',
  'bottom-start',
  'bottom',
  'top-end',
  'top-start',
  'top',
  'left',
  'right',
]

/** Example translations; any strings can be passed the same way. */
const LOCALES: Record<string, I18nInput> = {
  English: {},
  Español: {
    search: 'Buscar emoji',
    skinTone: 'Tono de piel',
    noResults: 'No se encontraron emoji',
    skinTones: [
      'Predeterminado',
      'Claro',
      'Medio claro',
      'Medio',
      'Medio oscuro',
      'Oscuro',
    ],
    categories: {
      recent: 'Usados recientemente',
      smileys_people: 'Caras y personas',
      animals_nature: 'Animales y naturaleza',
      food_drink: 'Comida y bebida',
      activities: 'Actividades',
      travel_places: 'Viajes y lugares',
      objects: 'Objetos',
      symbols: 'Símbolos',
      flags: 'Banderas',
      team: 'Equipo',
    },
  },
  Français: {
    search: 'Rechercher un emoji',
    skinTone: 'Teint',
    noResults: 'Aucun emoji trouvé',
    skinTones: [
      'Par défaut',
      'Clair',
      'Moyennement clair',
      'Moyen',
      'Moyennement foncé',
      'Foncé',
    ],
    categories: {
      recent: 'Utilisés récemment',
      smileys_people: 'Smileys et personnes',
      animals_nature: 'Animaux et nature',
      food_drink: 'Nourriture et boissons',
      activities: 'Activités',
      travel_places: 'Voyages et lieux',
      objects: 'Objets',
      symbols: 'Symboles',
      flags: 'Drapeaux',
      team: 'Équipe',
    },
  },
}

/** Tiny inline SVG badges stand in for a team's custom emoji. */
const badge = (label: string, color: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${color}"/><text x="32" y="42" font-family="system-ui,sans-serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`
  )

const TEAM_EMOJIS = [
  {
    name: 'ship it',
    shortcodes: ['shipit'],
    unicode: 'x-shipit',
    src: badge('SHIP', '#16a34a'),
  },
  {
    name: 'lgtm',
    shortcodes: ['lgtm'],
    unicode: 'x-lgtm',
    src: badge('LGTM', '#2563eb'),
  },
  {
    name: 'wip',
    shortcodes: ['wip'],
    unicode: 'x-wip',
    src: badge('WIP', '#d97706'),
  },
  {
    name: 'vue',
    shortcodes: ['vue'],
    unicode: 'x-vue',
    src: badge('VUE', '#41b883'),
  },
]

const FEATURES = [
  {
    icon: '⌨️',
    title: 'Keyboard first',
    text: 'One tab stop, arrow-key grid, Enter to pick, Esc to close, labelled for screen readers.',
  },
  {
    icon: '🎨',
    title: 'Any artwork',
    text: 'Native glyphs, Apple, Google, Twitter or Facebook sets, your own CDN, or custom images per emoji.',
  },
  {
    icon: '🧩',
    title: 'Framework-agnostic core',
    text: 'Search, skin tones, recents and shortcodes ship in a Vue-free core entry for any view layer.',
  },
  {
    icon: '🛠️',
    title: 'Customize everything',
    text: 'Sizes, columns, colors, texts, groups, ordering, hidden emoji and layout — all props or CSS variables.',
  },
  {
    icon: '🌍',
    title: 'Any language',
    text: 'Every label, group name and message is configurable, so the picker speaks your users’ language.',
  },
  {
    icon: '⚡',
    title: 'Light and SSR-safe',
    text: 'Lazy images, localStorage recents, no IndexedDB, and safe to import on the server.',
  },
]

const stats = [
  {
    icon: '😀',
    value: Object.values(defaultEmojis).flat().length.toLocaleString('en'),
    label: 'Emoji included',
  },
  {
    icon: '🖼️',
    value: String(EMOJI_SETS.length),
    label: 'Artwork sets',
  },
  {
    icon: '🎛️',
    value: String(Object.keys(Picker.props || {}).length),
    label: 'Props to customize',
  },
]

const installCopied = ref(false)

async function copyInstall() {
  try {
    await navigator.clipboard.writeText('npm i vue3-emoji-picker')
    installCopied.value = true
    window.setTimeout(() => (installCopied.value = false), 1500)
  } catch {
    installCopied.value = false
  }
}

const tab = ref<'vue' | 'core'>('vue')

const defaults = {
  native: false,
  theme: 'light' as 'light' | 'dark' | 'auto',
  set: 'apple' as EmojiSet,
  emojiSize: 22,
  perLine: 8,
  width: 280,
  height: 320,
  accent: '#2563eb',
  displayRecent: true,
  recentMode: 'recent' as RecentMode,
  maxRecent: 24,
  hideSearch: false,
  hideGroupNames: false,
  hideGroupIcons: false,
  hideFooter: false,
  disableSkinTones: false,
  disableStickyGroupNames: false,
  autoFocus: false,
  customGroup: false,
  flagsFirst: false,
}

const theme = ref(defaults.theme)
const set = ref(defaults.set)
const emojiSize = ref(defaults.emojiSize)
const perLine = ref(defaults.perLine)
const width = ref(defaults.width)
const height = ref(defaults.height)
const accent = ref(defaults.accent)
const displayRecent = ref(defaults.displayRecent)
const recentMode = ref(defaults.recentMode)
const maxRecent = ref(defaults.maxRecent)
const hideSearch = ref(defaults.hideSearch)
const hideGroupNames = ref(defaults.hideGroupNames)
const hideGroupIcons = ref(defaults.hideGroupIcons)
const hideFooter = ref(defaults.hideFooter)
const disableSkinTones = ref(defaults.disableSkinTones)
const disableStickyGroupNames = ref(defaults.disableStickyGroupNames)
const autoFocus = ref(defaults.autoFocus)
const customGroup = ref(defaults.customGroup)
const flagsFirst = ref(defaults.flagsFirst)
const pickerType = ref('')
const mode = ref<InsertMode>('caret')
const placement = ref('bottom-end')
const offset = ref(6)
const inputPlaceholder = ref('Type a message…')
const disabledEmojisText = ref('')
const disabledGroups = reactive<string[]>([])
const locale = ref('English')

const refs: Record<string, { value: unknown }> = {
  theme,
  set,
  emojiSize,
  perLine,
  width,
  height,
  accent,
  displayRecent,
  recentMode,
  maxRecent,
  hideSearch,
  hideGroupNames,
  hideGroupIcons,
  hideFooter,
  disableSkinTones,
  disableStickyGroupNames,
  autoFocus,
  customGroup,
  flagsFirst,
}

const PRESETS: Array<{ name: string; values: Partial<typeof defaults> }> = [
  { name: 'Default', values: {} },
  {
    name: 'Compact',
    values: {
      emojiSize: 18,
      perLine: 9,
      width: 260,
      height: 260,
      hideGroupNames: true,
      hideFooter: true,
    },
  },
  {
    name: 'Chat app',
    values: {
      theme: 'dark',
      set: 'twitter',
      perLine: 9,
      width: 340,
      height: 380,
      recentMode: 'frequent',
      customGroup: true,
      accent: '#a78bfa',
    },
  },
  {
    name: 'Big & touch',
    values: { emojiSize: 32, perLine: 6, width: 360, height: 440 },
  },
]

function applyPreset(values: Partial<typeof defaults>) {
  const next = { ...defaults, ...values }
  for (const [key, target] of Object.entries(refs)) {
    target.value = next[key as keyof typeof defaults]
  }
}

const selected = ref<Record<string, any> | null>(null)
const text = ref('')
const copied = ref(false)

const isDark = computed(() => theme.value === 'dark')

const disabledEmojis = computed(() =>
  disabledEmojisText.value
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
)

const i18n = computed(() => LOCALES[locale.value] || LOCALES.English)

/** Width/height/accent are plain CSS variables set on a parent element. */
const stageVars = computed(() => ({
  '--v3-picker-width': `${width.value}px`,
  '--v3-picker-height': `${height.value}px`,
  '--v3-picker-focus': accent.value,
}))

/** `categories` is only passed when the default order is changed. */
const categories = computed(() => {
  // Custom categories show up by default; only reorder/filter when asked.
  if (!flagsFirst.value && !disabledGroups.length) {
    return []
  }
  return [
    'recent',
    ...(customGroup.value ? ['team'] : []),
    ...(flagsFirst.value ? ['flags'] : []),
    ...BUILTIN_CATEGORIES,
  ].filter(
    (key, index, all) =>
      all.indexOf(key) === index && !disabledGroups.includes(key)
  )
})

const pickerProps = computed<Record<string, any>>(() => ({
  theme: theme.value,
  set: set.value,
  emojiSize: emojiSize.value,
  perLine: perLine.value,
  searchPosition: hideSearch.value ? 'none' : 'top',
  navPosition: hideGroupIcons.value ? 'none' : 'top',
  previewPosition: hideFooter.value ? 'none' : 'bottom',
  skinTonePosition: disableSkinTones.value ? 'none' : 'preview',
  categoryHeaders: hideGroupNames.value
    ? 'none'
    : disableStickyGroupNames.value
    ? 'static'
    : 'sticky',
  categories: categories.value,
  customCategories: customGroup.value
    ? [{ key: 'team', name: 'Team', emojis: TEAM_EMOJIS }]
    : [],
  excludeEmojis: disabledEmojis.value,
  recent: displayRecent.value ? recentMode.value : 'none',
  maxRecent: maxRecent.value,
  i18n: i18n.value,
  autoFocus: autoFocus.value,
  type: pickerType.value || 'inline',
  insertMode: mode.value,
  offset: offset.value,
  placement: placement.value,
  inputAttrs: { placeholder: inputPlaceholder.value },
  ...(pickerType.value ? { modelValue: text.value } : {}),
}))

const selectedJson = computed(() =>
  selected.value ? JSON.stringify(selected.value, null, 2) : ''
)

const codeSnippet = computed(() => {
  const attrs: string[] = []
  const d = defaults

  const props = pickerProps.value

  if (theme.value !== d.theme) attrs.push(`theme="${theme.value}"`)
  if (set.value !== d.set) attrs.push(`set="${set.value}"`)
  if (emojiSize.value !== d.emojiSize)
    attrs.push(`:emoji-size="${emojiSize.value}"`)
  if (perLine.value !== d.perLine) attrs.push(`:per-line="${perLine.value}"`)
  if (displayRecent.value) {
    attrs.push(`recent="${recentMode.value}"`)
    if (maxRecent.value !== d.maxRecent)
      attrs.push(`:max-recent="${maxRecent.value}"`)
  }
  if (props.searchPosition !== 'top') attrs.push('search-position="none"')
  if (props.navPosition !== 'top') attrs.push('nav-position="none"')
  if (props.previewPosition !== 'bottom') attrs.push('preview-position="none"')
  if (props.skinTonePosition !== 'preview')
    attrs.push('skin-tone-position="none"')
  if (props.categoryHeaders !== 'sticky')
    attrs.push(`category-headers="${props.categoryHeaders}"`)
  if (autoFocus.value) attrs.push(':auto-focus="true"')
  if (pickerType.value) {
    attrs.push(`type="${pickerType.value}"`)
    attrs.push('v-model="text"')
    if (mode.value !== 'caret') attrs.push(`insert-mode="${mode.value}"`)
    if (placement.value !== 'bottom-end')
      attrs.push(`placement="${placement.value}"`)
    if (offset.value !== 6) attrs.push(`:offset="${offset.value}"`)
    if (inputPlaceholder.value)
      attrs.push(`:input-attrs="{ placeholder: '${inputPlaceholder.value}' }"`)
  }
  if (categories.value.length)
    attrs.push(
      `:categories="${JSON.stringify(categories.value).replace(/"/g, "'")}"`
    )
  if (customGroup.value) attrs.push(':custom-categories="customCategories"')
  if (disabledEmojis.value.length)
    attrs.push(
      `:exclude-emojis="${JSON.stringify(disabledEmojis.value).replace(
        /"/g,
        "'"
      )}"`
    )
  if (locale.value !== 'English') attrs.push(':i18n="i18n"')

  const opening = attrs.length
    ? `<EmojiPicker\n  ${attrs.join('\n  ')}\n  @select="onSelect"\n/>`
    : `<EmojiPicker @select="onSelect" />`

  const style =
    width.value !== d.width ||
    height.value !== d.height ||
    accent.value !== d.accent
      ? `\n\n<style>\n.v3-emoji-picker {\n  --v3-picker-width: ${width.value}px;\n  --v3-picker-height: ${height.value}px;\n  --v3-picker-focus: ${accent.value};\n}\n</style>`
      : ''

  return `<script setup>\nimport EmojiPicker from 'vue3-emoji-picker'\nimport 'vue3-emoji-picker/css'\n<\/script>\n\n<template>\n${opening.replace(
    /^/gm,
    '  '
  )}\n</template>${style}`
})

function onSelect(emoji: Record<string, any>) {
  selected.value = emoji
}

function onText(value: string | undefined) {
  text.value = value || ''
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeSnippet.value)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1500)
  } catch {
    copied.value = false
  }
}

/**
 * Vanilla core demo.
 */
const coreRoot = ref<HTMLElement | null>(null)
const coreSearch = ref('')
const coreTone = ref('neutral')
const coreCount = ref(0)
const coreJson = ref('')
const shortcodeInput = ref(
  'Shipped it :rocket: thanks team :raised_hands::skin-tone-3: :+1: :joy_cat:'
)
const shortcodeOutput = computed(() => replaceShortcodes(shortcodeInput.value))
let corePicker: ReturnType<typeof createPicker> | null = null

function renderCore() {
  const root = coreRoot.value
  if (!root || !corePicker) return

  const results = corePicker.results()
  const emojis = Object.values(results).flat()
  coreCount.value = emojis.length

  const grid = document.createElement('div')
  grid.className = 'core-grid'

  for (const emoji of emojis.slice(0, 120)) {
    const button = document.createElement('button')
    button.type = 'button'
    button.title = emoji.n[0]
    button.textContent = unicodeToEmoji(emoji.r || '')
    button.addEventListener('click', () => {
      const payload = corePicker?.select(emoji)
      coreJson.value = payload ? JSON.stringify(payload, null, 2) : ''
    })
    grid.appendChild(button)
  }

  root.replaceChildren(grid)
}

onMounted(() => {
  corePicker = createPicker({
    storage: createMemoryStorage(),
    recent: 'recent',
  })
  corePicker.subscribe(renderCore)
  renderCore()
})

watch(coreSearch, (value) => corePicker?.setSearch(value))
watch(coreTone, (value) => corePicker?.setSkinTone(value))

onBeforeUnmount(() => {
  corePicker?.destroy()
})
</script>

<style scoped>
.demo {
  /* Warm stone neutrals with a single yellow accent. */
  --bg: #fafaf9;
  --surface: #ffffff;
  --surface-2: #f5f5f4;
  --header: #e7e5e4;
  --border: #d6d3d1;
  --border-soft: #e7e5e4;
  --heading: #1c1917;
  --text: #44403c;
  --muted: #78716c;
  --accent: #f0b100;
  --accent-ink: #733e0a;
  --accent-soft: #fef9c3;
  --accent-wash: #fffbeb;
  --pixel: 'Silkscreen', ui-monospace, monospace;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 15px;
  line-height: 1.6;
}

.pixel {
  font-family: var(--pixel);
  font-weight: 700;
  letter-spacing: -0.03em;
  word-spacing: -0.15em;
}

.accent {
  color: var(--accent);
}

h1,
h2,
h3 {
  color: var(--heading);
}

/* Header */
.demo-header {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 68px;
  padding: 0 max(24px, calc((100vw - 1240px) / 2));
  background: var(--header);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--heading);
  text-decoration: none;
  font-size: 16px;
  white-space: nowrap;
}

.logo {
  font-size: 22px;
}

.nav {
  display: flex;
  gap: 28px;
}

.nav a {
  color: var(--text);
  text-decoration: none;
  font-size: 13px;
  text-transform: uppercase;
}

.nav a:hover {
  color: var(--heading);
}

.github {
  margin-left: auto;
}

/* Buttons: flat with a darker "pressed" bottom edge. */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid var(--border);
  border-bottom-width: 4px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: transform 80ms, border-bottom-width 80ms;
}

.btn:active {
  transform: translateY(2px);
  border-bottom-width: 2px;
}

.btn-primary {
  background: var(--accent);
  border-color: var(--accent-ink);
  color: var(--accent-ink);
}

.btn-primary:hover {
  filter: brightness(1.05);
}

.btn-surface {
  background: var(--surface);
  border-color: var(--border);
  color: var(--heading);
}

.btn-surface:hover {
  background: var(--surface-2);
}

/* Hero */
.hero {
  text-align: center;
  padding: 72px 24px 56px;
  background: radial-gradient(
      ellipse at top,
      var(--accent-wash),
      transparent 65%
    ),
    var(--bg);
  border-bottom: 1px solid var(--border-soft);
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 13px;
  font-weight: 600;
}

.hero h1 {
  font-size: clamp(34px, 6vw, 56px);
  line-height: 1.05;
  margin: 18px 0 14px;
  text-transform: uppercase;
}

.lead {
  max-width: 560px;
  margin: 0 auto 28px;
  font-size: 17px;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.install code {
  font: 13px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.install-copy {
  font-size: 12px;
  color: var(--muted);
  border-left: 1px solid var(--border);
  padding-left: 10px;
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  max-width: 1080px;
  margin: 48px auto 0;
  padding: 0 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 24px;
  border: 2px solid #fce7a2;
  border-radius: 10px;
  background: linear-gradient(var(--accent-wash), var(--surface));
  color: var(--muted);
  font-size: 14px;
}

.stat-icon {
  font-size: 24px;
}

.stat strong {
  font-size: 34px;
  line-height: 1.2;
  color: var(--accent);
}

/* Section headings */
.section-head {
  text-align: center;
  padding: 64px 24px 8px;
  scroll-margin-top: 68px;
}

.section-head h2 {
  margin: 0;
  font-size: clamp(26px, 4vw, 38px);
  text-transform: uppercase;
}

.section-head p {
  margin: 6px 0 0;
  color: var(--muted);
}

.tabs {
  display: inline-flex;
  gap: 4px;
  margin-top: 22px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
}

.tabs button {
  border: 0;
  background: transparent;
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 5px;
  cursor: pointer;
  color: var(--muted);
  text-transform: uppercase;
}

.tabs button.active {
  background: var(--accent);
  color: var(--accent-ink);
}

/* Playground */
.layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  max-width: 1240px;
  margin: 0 auto;
}

.controls {
  background: var(--surface);
  border: 2px solid var(--border-soft);
  border-radius: 10px;
  padding: 20px;
  align-self: start;
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 110px);
  overflow: auto;
}

.controls h2 {
  margin: 0 0 14px;
  font-family: var(--pixel);
  font-size: 18px;
  text-transform: uppercase;
}

.controls h3 {
  margin: 22px 0 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border-soft);
  font-family: var(--pixel);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--muted);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.presets button {
  border: 1px solid var(--border);
  border-bottom-width: 3px;
  background: var(--surface);
  border-radius: 6px;
  padding: 3px 10px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--heading);
  cursor: pointer;
}

.presets button:hover {
  border-color: var(--accent-ink);
  background: var(--accent);
  color: var(--accent-ink);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.field > span {
  color: var(--muted);
  font-weight: 500;
}

.field input[type='text'],
.field select {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  background: var(--surface);
  color: var(--heading);
}

.field input[type='text']:focus,
.field select:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}

.field input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}

.field input[type='color'] {
  width: 48px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.toggles.compact {
  margin-top: 4px;
}

.toggles label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggles input {
  accent-color: var(--accent);
  width: 15px;
  height: 15px;
}

.stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.picker-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 420px;
  padding: 48px 24px;
  border: 2px solid var(--accent);
  border-radius: 10px;
  background: radial-gradient(
      circle at 20% 0%,
      var(--accent-wash),
      transparent 55%
    ),
    var(--surface);
  transition: background 200ms;
}

.picker-wrap.dark {
  background: radial-gradient(circle at 20% 0%, #44403c, transparent 60%),
    #1c1917;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  line-height: 2.2;
}

kbd {
  display: inline-flex;
  align-items: center;
  height: 20px;
  min-width: 20px;
  padding: 0 6px;
  margin: 0 2px;
  border-radius: 3px;
  border-bottom: 3px solid #78716c;
  background: rgb(120 113 108 / 25%);
  color: var(--heading);
  font: 500 12px ui-monospace, SFMono-Regular, Menlo, monospace;
  justify-content: center;
}

.output {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.panel {
  background: var(--surface);
  border: 2px solid var(--border-soft);
  border-radius: 10px;
  padding: 18px;
  min-width: 0;
}

.panel h3 {
  margin: 0 0 10px;
  font-family: var(--pixel);
  font-size: 14px;
  text-transform: uppercase;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copy {
  border: 1px solid var(--accent-ink);
  border-bottom-width: 3px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 6px;
  padding: 2px 10px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.code {
  margin: 0;
  padding: 14px;
  border-radius: 8px;
  background: #1c1917;
  color: #fafaf9;
  font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: auto;
  max-height: 340px;
  white-space: pre;
}

.muted {
  color: var(--muted);
  font-size: 13px;
}

.text-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 12px 0 0;
  font-size: 13px;
}

.label {
  font-family: var(--pixel);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
}

.shortcode-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  font: 13px ui-monospace, SFMono-Regular, Menlo, monospace;
  resize: vertical;
}

.shortcode-input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}

.shortcode-output {
  font-size: 20px;
  margin: 10px 0 0;
}

.core-root {
  background: var(--surface);
  border: 2px solid var(--accent);
  border-radius: 10px;
  padding: 16px;
}

.core-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
}

.core-grid button {
  border: 0;
  background: transparent;
  font-size: 24px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
}

.core-grid button:hover {
  background: var(--accent-soft);
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px 48px;
  max-width: 1080px;
  margin: 32px auto 0;
  padding: 0 24px 72px;
}

.feature {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.feature-icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent-wash);
  font-size: 28px;
}

.feature h3 {
  margin: 4px 0 4px;
  font-size: 16px;
  text-transform: uppercase;
}

.feature p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.demo-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 24px max(24px, calc((100vw - 1240px) / 2));
  border-top: 1px solid var(--border);
  background: var(--header);
  color: var(--muted);
  font-size: 13px;
}

.demo-footer .pixel {
  color: var(--heading);
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .controls {
    position: static;
    max-height: none;
  }

  .output,
  .features,
  .stats {
    grid-template-columns: 1fr;
  }

  .nav {
    display: none;
  }

  .brand {
    font-size: 13px;
  }
}
</style>
