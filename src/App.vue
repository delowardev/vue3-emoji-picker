<template>
  <div class="demo">
    <header class="demo-header">
      <div class="brand">
        <span class="logo">🙂</span>
        <span>vue3-emoji-picker</span>
        <span class="version">v{{ version }}</span>
      </div>

      <nav class="tabs">
        <button
          type="button"
          :class="{ active: tab === 'vue' }"
          @click="tab = 'vue'"
        >
          Vue component
        </button>
        <button
          type="button"
          :class="{ active: tab === 'core' }"
          @click="tab = 'core'"
        >
          Core (vanilla)
        </button>
      </nav>

      <a
        class="github"
        href="https://github.com/delowardev/vue3-emoji-picker"
        target="_blank"
        rel="noreferrer"
        >GitHub</a
      >
    </header>

    <main v-show="tab === 'vue'" class="layout">
      <aside class="controls">
        <h2>Options</h2>

        <label class="field">
          <span>Theme</span>
          <select v-model="theme">
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="auto">auto</option>
          </select>
        </label>

        <label class="field">
          <span>Picker type</span>
          <select v-model="pickerType">
            <option value="">inline</option>
            <option value="input">input</option>
            <option value="textarea">textarea</option>
          </select>
        </label>

        <label v-if="pickerType" class="field">
          <span>Insert mode</span>
          <select v-model="mode">
            <option value="insert">insert at caret</option>
            <option value="append">append</option>
            <option value="prepend">prepend</option>
          </select>
        </label>

        <label v-if="pickerType" class="field">
          <span>Offset ({{ offset }}px)</span>
          <input v-model.number="offset" type="range" min="0" max="40" />
        </label>

        <label class="field">
          <span>Placeholder</span>
          <input v-model="placeholder" type="text" />
        </label>

        <div class="toggles">
          <label><input v-model="native" type="checkbox" /> native emoji</label>
          <label
            ><input v-model="displayRecent" type="checkbox" /> recently
            used</label
          >
          <label
            ><input v-model="hideSearch" type="checkbox" /> hide search</label
          >
          <label
            ><input v-model="hideGroupNames" type="checkbox" /> hide group
            names</label
          >
          <label
            ><input v-model="hideGroupIcons" type="checkbox" /> hide group
            icons</label
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
            ><input v-model="flagsFirst" type="checkbox" /> flags group
            first</label
          >
        </div>

        <h3>Disabled groups</h3>
        <div class="toggles compact">
          <label v-for="group in GROUPS" :key="group[0]">
            <input v-model="disabledGroups" type="checkbox" :value="group[0]" />
            {{ group[1] }}
          </label>
        </div>
      </aside>

      <section class="stage">
        <div class="picker-wrap" :class="{ dark: theme === 'dark' }">
          <picker
            v-bind="pickerProps"
            @select="onSelect"
            @update:text="onText"
          />
        </div>

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
      </section>
    </main>

    <footer class="demo-footer">
      Core is framework-agnostic · Vue wrapper is a thin bridge · MIT
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Picker from './components/Picker.vue'
import {
  createMemoryStorage,
  createPicker,
  SKIN_TONES,
  unicodeToEmoji,
} from './core'
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

const tab = ref<'vue' | 'core'>('vue')

const native = ref(false)
const theme = ref<'light' | 'dark' | 'auto'>('light')
const displayRecent = ref(true)
const hideSearch = ref(false)
const hideGroupNames = ref(false)
const hideGroupIcons = ref(false)
const disableSkinTones = ref(false)
const disableStickyGroupNames = ref(false)
const pickerType = ref('')
const mode = ref('insert')
const offset = ref(6)
const placeholder = ref('Search emoji')
const flagsFirst = ref(false)
const disabledGroups = reactive<string[]>([])

const selected = ref<Record<string, any> | null>(null)
const text = ref('')
const copied = ref(false)

const pickerProps = computed(() => ({
  native: native.value,
  theme: theme.value,
  displayRecent: displayRecent.value,
  hideSearch: hideSearch.value,
  hideGroupNames: hideGroupNames.value,
  hideGroupIcons: hideGroupIcons.value,
  disableSkinTones: disableSkinTones.value,
  disableStickyGroupNames: disableStickyGroupNames.value,
  pickerType: pickerType.value,
  mode: mode.value,
  offset: offset.value,
  groupOrder: flagsFirst.value ? ['flags'] : [],
  disabledGroups: [...disabledGroups],
  staticTexts: { placeholder: placeholder.value },
  ...(pickerType.value ? { text: text.value } : {}),
}))

const selectedJson = computed(() =>
  selected.value ? JSON.stringify(selected.value, null, 2) : ''
)

const codeSnippet = computed(() => {
  const attrs: string[] = []

  if (native.value) attrs.push(':native="true"')
  if (theme.value !== 'light') attrs.push(`theme="${theme.value}"`)
  if (!displayRecent.value) attrs.push(':display-recent="false"')
  if (hideSearch.value) attrs.push(':hide-search="true"')
  if (hideGroupNames.value) attrs.push(':hide-group-names="true"')
  if (hideGroupIcons.value) attrs.push(':hide-group-icons="true"')
  if (disableSkinTones.value) attrs.push(':disable-skin-tones="true"')
  if (disableStickyGroupNames.value)
    attrs.push(':disable-sticky-group-names="true"')
  if (pickerType.value) attrs.push(`picker-type="${pickerType.value}"`)
  if (mode.value !== 'insert' && pickerType.value)
    attrs.push(`mode="${mode.value}"`)
  if (offset.value !== 6 && pickerType.value)
    attrs.push(`:offset="${offset.value}"`)
  if (flagsFirst.value) attrs.push(`:group-order="['flags']"`)
  if (disabledGroups.length)
    attrs.push(`:disabled-groups="${JSON.stringify([...disabledGroups])}"`)
  if (placeholder.value !== 'Search emoji')
    attrs.push(`:static-texts="{ placeholder: '${placeholder.value}' }"`)

  const opening = attrs.length
    ? `<EmojiPicker\n  ${attrs.join('\n  ')}\n  @select="onSelect"\n/>`
    : `<EmojiPicker @select="onSelect" />`

  return `<script setup>\nimport EmojiPicker from 'vue3-emoji-picker'\nimport 'vue3-emoji-picker/css'\n<\/script>\n\n<template>\n${opening.replace(
    /^/gm,
    '  '
  )}\n</template>`
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
    displayRecent: true,
    hideSearch: true,
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
  --bg: #f6f7f9;
  --surface: #ffffff;
  --border: #e3e6ea;
  --text: #1d2129;
  --muted: #6b7280;
  --accent: #4f46e5;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.logo {
  font-size: 20px;
}

.version {
  font-weight: 500;
  font-size: 12px;
  color: var(--muted);
  background: var(--bg);
  border-radius: 999px;
  padding: 2px 8px;
}

.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg);
  padding: 4px;
  border-radius: 10px;
}

.tabs button {
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 7px;
  cursor: pointer;
  color: var(--muted);
}

.tabs button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
}

.github {
  margin-left: auto;
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
}

.layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  max-width: 1180px;
  margin: 0 auto;
}

.controls {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  align-self: start;
  position: sticky;
  top: 86px;
  max-height: calc(100vh - 110px);
  overflow: auto;
}

.controls h2 {
  margin: 0 0 14px;
  font-size: 15px;
}

.controls h3 {
  margin: 18px 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
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
}

.field input[type='text'],
.field select {
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
}

.field input[type='range'] {
  width: 100%;
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.toggles.compact {
  gap: 6px;
}

.toggles label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.picker-wrap {
  display: flex;
  justify-content: center;
  padding: 40px;
  background: radial-gradient(
      circle at 20% 20%,
      rgb(79 70 229 / 8%),
      transparent 45%
    ),
    radial-gradient(circle at 80% 0%, rgb(16 185 129 / 8%), transparent 40%),
    var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}

.output {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  min-width: 0;
}

.panel h3 {
  margin: 0 0 10px;
  font-size: 13px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.copy {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 7px;
  padding: 3px 9px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.code {
  margin: 0;
  padding: 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 9px;
  font-family: 'SFMono-Regular', ui-monospace, Menlo, monospace;
  font-size: 12px;
  line-height: 1.55;
  overflow: auto;
  max-height: 320px;
  white-space: pre-wrap;
  word-break: break-word;
}

.muted {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.text-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
  margin: 12px 0 0;
}

.label {
  color: var(--muted);
}

.core-root {
  min-height: 320px;
}

.core-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}

.core-grid button {
  border: 0;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  padding: 8px 0;
  border-radius: 8px;
  cursor: pointer;
}

.core-grid button:hover {
  background: var(--bg);
}

.demo-footer {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  padding: 24px;
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .controls {
    position: static;
    max-height: none;
  }

  .output {
    grid-template-columns: 1fr;
  }
}
</style>
