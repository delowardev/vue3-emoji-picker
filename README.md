# Vue3 Emoji Picker. [Live preview](https://codesandbox.io/p/github/delowardev/vue3-emoji-picker/main?file=%2FREADME.md)

[![Test Automation](https://github.com/delowardev/vue3-emoji-picker/actions/workflows/TestAutomation.yaml/badge.svg)](https://github.com/delowardev/vue3-emoji-picker/actions/workflows/TestAutomation.yaml)
[![npm version](https://badge.fury.io/js/vue3-emoji-picker.svg)](https://badge.fury.io/js/vue3-emoji-picker)
[![downloads](https://img.shields.io/npm/dm/vue3-emoji-picker.svg)](https://www.npmjs.com/package/vue3-emoji-picker)

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />
<img src="https://i.imgur.com/RGGRQSk.png" width="280" />

## Installation:

```
npm install vue3-emoji-picker

// or
yarn add vue3-emoji-picker
```

_TypeScript types ship with the package — no `declare module 'vue3-emoji-picker'` shim is needed._

### SSR / Nuxt

The picker is safe to import on the server. Browser-only storage is initialised
lazily and silently disabled when `localStorage` is unavailable, so importing the
component in Node or SSR no longer throws. If you only want it rendered on the
client, wrap it in Nuxt's `<ClientOnly>` as usual.

## Usage:

```javascript
// import picker component
import EmojiPicker from 'vue3-emoji-picker'

// import css
import 'vue3-emoji-picker/css'
// or import directly:
// import'node_modules/vue3-emoji-picker/dist/style.css'
```

```vue
<script setup>
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

function onSelectEmoji(emoji) {
  console.log(emoji)
  /*
    {
      native: "👍🏽",          // the character to insert
      unicode: "1f44d-1f3fd", // with skin tone
      baseUnicode: "1f44d",   // without skin tone
      name: "thumbs up",
      shortcodes: ["+1", "thumbsup"],
      skinTone: "1f3fd",      // or "neutral"
      // 1.x keys i, n, r, t, u are still included until 3.0
    }
  */
}
</script>

<template>
  <EmojiPicker set="native" @select="onSelectEmoji" />
</template>
```

> Upgrading from 1.x? Old props keep working with a console warning. See
> [UPGRADE.md](UPGRADE.md).

## Playground

`npm run dev` starts an interactive playground with live prop controls, the
generated usage snippet and a vanilla-core demo. `npm run demo:build` emits a
static build to `demo-dist/`.

## Framework-agnostic core

The picker logic is available without Vue from `vue3-emoji-picker/core`. It has
no Vue import, so it can drive a picker in React, Svelte, a custom element or
plain DOM.

```javascript
import { createPicker } from 'vue3-emoji-picker/core'

const picker = createPicker({ recent: 'recent' })

picker.subscribe((state) => render(state))

picker.setSearch('thumbsup')
picker.setSkinTone('1f3fb')

const results = picker.results() // { categoryKey: Emoji[] }
const payload = picker.select(results.smileys_people[0])
// { native, unicode, name, shortcodes, skinTone, ... }
picker.categories() // [{ key, title, u }] in display order
```

`createPicker` takes the same options as the component props, in camelCase
(`searchPosition`, `customCategories`, `i18n`, …).

### Shortcodes

```javascript
import { replaceShortcodes, shortcodeToEmoji } from 'vue3-emoji-picker/core'

replaceShortcodes('Hello :wave::skin-tone-2: :+1:') // 'Hello 👋🏻 👍'
shortcodeToEmoji('joy_cat') // '😹'
```

Unknown codes are left as-is. Both accept `{ skinTone, customCategories }`.

Exports include `createPicker`, `replaceShortcodes` / `shortcodeToEmoji`, `searchEmojis` / `filterEmojis`, `applySkinTone`,
`unicodeToEmoji`, the bundled dataset (`defaultEmojis`, `defaultGroups`),
storage adapters (`createMemoryStorage`, `getDefaultStorage`) and the public
types. `createPicker` accepts a `storage` adapter, so persistence can be swapped
out in tests or on the server.

> The core ships from the same package as a second entry point. `vue` is an
> optional peer dependency, so core-only consumers do not need Vue installed.

## Options (`props`)

### Appearance

| Prop         | Type     | Default   | Description                                                                             |
| :----------- | :------- | :-------- | :-------------------------------------------------------------------------------------- |
| `theme`      | String   | `'light'` | `light`, `dark` or `auto`                                                               |
| `set`        | String   | `'apple'` | `native`, `apple`, `google`, `twitter`, `facebook`. See [Emoji artwork](#emoji-artwork) |
| `image-url`  | Function | –         | `(unicode) => url` to self-host or use any CDN; overrides `set`                         |
| `per-line`   | Number   | `8`       | Emoji per row                                                                           |
| `emoji-size` | Number   | `22`      | Emoji size in px                                                                        |

### Layout

| Prop                 | Type    | Default     | Values                                         |
| :------------------- | :------ | :---------- | :--------------------------------------------- |
| `search-position`    | String  | `'top'`     | `top`, `none`                                  |
| `nav-position`       | String  | `'top'`     | `top`, `none` (category bar)                   |
| `preview-position`   | String  | `'bottom'`  | `bottom`, `none`                               |
| `skin-tone-position` | String  | `'preview'` | `preview`, `none`                              |
| `category-headers`   | String  | `'sticky'`  | `sticky`, `static`, `none`                     |
| `auto-focus`         | Boolean | `false`     | Focus search on mount, or when the popup opens |

### Categories and emoji

| Prop                | Type   | Default  | Description                                                                |
| :------------------ | :----- | :------- | :------------------------------------------------------------------------- |
| `categories`        | Array  | all      | Categories to show, in order. See [Categories](#categories)                |
| `custom-categories` | Array  | `[]`     | Your own categories and emoji. See [Custom categories](#custom-categories) |
| `category-icons`    | Object | `{}`     | Icon URL per category key, e.g. `{ recent: '/star.svg' }`                  |
| `exclude-emojis`    | Array  | `[]`     | Unicode ids to hide everywhere, e.g. `['1f595']`                           |
| `recent`            | String | `'none'` | `none`, `recent` (last used first) or `frequent` (most used first)         |
| `max-recent`        | Number | `24`     | Maximum recent emoji shown                                                 |

### Text and language

| Prop   | Type   | Default | Description                                   |
| :----- | :----- | :------ | :-------------------------------------------- |
| `i18n` | Object | English | Every string in the picker. See [i18n](#i18n) |

### Input and textarea

| Prop          | Type   | Default        | Description                                                                   |
| :------------ | :----- | :------------- | :---------------------------------------------------------------------------- |
| `type`        | String | `'inline'`     | `inline`, `input` or `textarea` (field with a popup picker)                   |
| `v-model`     | String | `''`           | The field's text                                                              |
| `insert-mode` | String | `'caret'`      | Where picked emoji go: `caret`, `append`, `prepend`                           |
| `placement`   | String | `'bottom-end'` | Popup placement (any Popper placement, e.g. `top-start`)                      |
| `offset`      | Number | `6`            | Popup offset in px                                                            |
| `input-attrs` | Object | `{}`           | Attributes for the field, e.g. `{ placeholder: 'Say hi', class: 'my-input' }` |

```vue
<EmojiPicker type="textarea" v-model="message" :input-attrs="{ rows: 3 }" />
```

## i18n

Pass any subset; missing strings fall back to English. `EN_I18N` from
`vue3-emoji-picker/core` shows every key.

```vue
<EmojiPicker
  :i18n="{
    search: 'Buscar emoji',
    noResults: 'No se encontraron emoji',
    skinTone: 'Tono de piel',
    skinTones: [
      'Predeterminado',
      'Claro',
      'Medio claro',
      'Medio',
      'Medio oscuro',
      'Oscuro',
    ],
    categories: { smileys_people: 'Caras y personas', flags: 'Banderas' },
  }"
/>
```

| Key               | Default                                                 |
| :---------------- | :------------------------------------------------------ |
| `search`          | Search emoji (placeholder)                              |
| `searchLabel`     | Search emoji (screen readers)                           |
| `categoriesLabel` | Emoji categories (screen readers)                       |
| `noResults`       | No emoji found                                          |
| `skinTone`        | Skin tone                                               |
| `skinTones`       | Default, Light, Medium-light, Medium, Medium-dark, Dark |
| `categories`      | Category names by key, including your custom categories |

## Categories

Built-in keys: `smileys_people`, `animals_nature`, `food_drink`, `activities`,
`travel_places`, `objects`, `symbols`, `flags`, plus `recent` (shown when
`recent` is not `none`) and your custom category keys.

By default every category is shown: recent, custom categories, then the
built-ins. `categories` picks which ones appear and in what order:

```vue
<EmojiPicker
  recent="frequent"
  :categories="['recent', 'smileys_people', 'flags']"
/>
```

## Custom categories

```vue
<EmojiPicker
  :custom-categories="[
    {
      key: 'team',
      name: 'Team', // or i18n.categories.team
      icon: '/icons/team.svg', // category bar icon
      emojis: [
        {
          name: 'ship it',
          shortcodes: ['shipit'],
          unicode: 'x-shipit',
          src: '/emoji/shipit.png',
        },
        { name: 'party', shortcodes: ['party_face'], unicode: '1f973' },
      ],
    },
  ]"
/>
```

`unicode` must be unique. Emoji with `src` render that image; others use the
native glyph or the selected `set`. `skins` takes skin tone variations.

## Emoji artwork

`set` picks the artwork from [emoji-datasource](https://github.com/iamcal/emoji-data)
on jsDelivr, `native` uses the system font, and `image-url` lets you serve
images yourself:

```vue
<EmojiPicker set="twitter" />
<EmojiPicker :image-url="(u) => `/emoji/${u}.png`" />
```

Custom emoji can carry their own image with `src`, which is always used —
handy for team or brand emoji. See [Custom categories](#custom-categories).

> Licensing differs per set. Twitter (Twemoji, CC-BY 4.0) and Google (Noto,
> Apache 2.0) can be used commercially; check Apple's and Facebook's terms
> before shipping their artwork in a product.

## Emoji data

The bundled emoji (`src/data/emojis.json`) are generated from
[emoji-datasource](https://github.com/iamcal/emoji-data), the same release the
artwork sets load from (`EMOJI_DATASOURCE_VERSION` in `src/core/images.ts`), so
every listed emoji has an image. Names are the Unicode CLDR short names
("red heart"); shortcodes are the Slack/GitHub-style `short_names`. Only emoji
with Twitter and Google artwork are included.

To regenerate (defaults to the latest emoji-datasource on npm):

```sh
npm run data:update            # or: npm run data:update -- 16.0.0
```

A weekly GitHub Actions workflow (`update-emoji-data.yml`) does this
automatically and opens a pull request with the added, removed and renamed
emoji when a newer emoji-datasource is published.

## Keyboard and accessibility

The grid has a single tab stop. Arrow keys move between emoji (respecting
`per-line`), `Home`/`End` jump within a group, and `Enter`/`Space` selects.
In the search box, `↓` moves into the grid and `Enter` picks the first
result. `Esc` closes the input/textarea popup. Buttons, groups, the
category bar and skin tones are labelled for screen readers.

## Styling with CSS variables

| Variable                            | Default   | Description              |
| :---------------------------------- | :-------- | :----------------------- |
| `--v3-picker-width`                 | `280px`   | Picker width             |
| `--v3-picker-height`                | `320px`   | Picker height            |
| `--v3-picker-bg` / `--v3-picker-fg` | theme     | Background / text        |
| `--v3-picker-border`                | theme     | Header/footer borders    |
| `--v3-picker-emoji-hover`           | theme     | Emoji hover background   |
| `--v3-picker-focus`                 | `#2563eb` | Keyboard focus ring      |
| `--v3-emoji-radius`                 | `6px`     | Emoji hover/focus radius |

```css
.v3-emoji-picker {
  --v3-picker-width: 340px;
  --v3-picker-focus: #f0b100;
}
```

## Events

| Event               | Payload    | Description                                            |
| :------------------ | :--------- | :----------------------------------------------------- |
| `select`            | `EmojiExt` | An emoji was picked. See [Usage](#usage) for the shape |
| `update:modelValue` | `string`   | The field text changed (`v-model`)                     |
