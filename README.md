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
// use picker component
<EmojiPicker :native="true" @select="onSelectEmoji" />
```

```javascript
// event callback
function onSelectEmoji(emoji) {
  console.log(emoji)
  /*
    // result
    { 
        i: "😚", 
        n: ["kissing face"], 
        r: "1f61a", // with skin tone
        t: "neutral", // skin tone
        u: "1f61a" // without tone
    }
    */
}
```

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

const picker = createPicker({ displayRecent: true })

picker.subscribe((state) => render(state))

picker.setSearch('thumbsup')
picker.setSkinTone('1f3fb')

const results = picker.results() // { groupKey: Emoji[] }
const payload = picker.select(results.smileys_people[0])
// { ...emoji, r, t, i }
```

### Shortcodes

```javascript
import { replaceShortcodes, shortcodeToEmoji } from 'vue3-emoji-picker/core'

replaceShortcodes('Hello :wave::skin-tone-2: :+1:') // 'Hello 👋🏻 👍'
shortcodeToEmoji('joy_cat') // '😹'
```

Unknown codes are left as-is. Both accept `{ skinTone, additionalGroups }`.

Exports include `createPicker`, `replaceShortcodes` / `shortcodeToEmoji`, `searchEmojis` / `filterEmojis`, `applySkinTone`,
`unicodeToEmoji`, the bundled dataset (`defaultEmojis`, `defaultGroups`),
storage adapters (`createMemoryStorage`, `getDefaultStorage`) and the public
types. `createPicker` accepts a `storage` adapter, so persistence can be swapped
out in tests or on the server.

> The core ships from the same package as a second entry point. `vue` is an
> optional peer dependency, so core-only consumers do not need Vue installed.

## Options (`props`)

| Prop                       | Type     | Default Value | Description                                                                                      |
| :------------------------- | :------- | :------------ | :----------------------------------------------------------------------------------------------- |
| native                     | Boolean  | false         | Load native emoji instead of image.                                                              |
| set                        | String   | 'apple'       | Artwork: `native`, `apple`, `google`, `twitter`, `facebook`. See [Emoji artwork](#emoji-artwork) |
| image-url                  | Function | null          | `(unicode) => url` to self-host or use any CDN; overrides `set`                                  |
| hide-search                | Boolean  | false         | Show/hide search input.                                                                          |
| hide-group-icons           | Boolean  | false         | Show/hide header group icons.                                                                    |
| hide-group-names           | Boolean  | false         | Show/hide group names.                                                                           |
| hide-footer                | Boolean  | false         | Show/hide the footer (preview and skin tones).                                                   |
| per-line                   | Number   | 8             | Emoji per row                                                                                    |
| emoji-size                 | Number   | 22            | Emoji size in px                                                                                 |
| auto-focus                 | Boolean  | false         | Focus search on mount (inline) or when the popup opens                                           |
| disable-sticky-group-names | Boolean  | false         | Disable sticky for group names                                                                   |
| disable-skin-tones         | Boolean  | false         | Disable skin tones.                                                                              |
| disabled-groups            | Array    | []            | Disable any group/category. See [Available groups](#available-groups)                            |
| disabled-emojis            | Array    | []            | Hide individual emoji by unicode, e.g. `['1f595']`.                                              |
| group-names                | Object   | {}            | Change any group name. See [Default group names](#default-group-names)                           |
| static-texts               | Object   | Object        | See [static-texts](#propsstatic-texts) table                                                     |
| pickerType                 | string   | ''            | Choose picker type, possible options: `input`, `textarea` (Popup with input/textarea), `''`      |
| text                       | String   | ''            | Initial value for the input/textarea picker types.                                               |
| mode                       | string   | 'insert'      | Choose insert mode, possible options: `prepend`, `insert`, `append`                              |
| offset                     | Number   | 6             | Popup offset in px (only for `input`/`textarea` picker types)                                    |
| placement                  | string   | 'bottom-end'  | Popup placement for `input`/`textarea` picker types (any Popper placement, e.g. `top-start`)     |
| input-attrs                | Object   | {}            | Attributes for the `input`/`textarea`, e.g. `{ placeholder: 'Say hi', class: 'my-input' }`       |
| additional-groups          | Object   | {}            | Add additional customized groups, keys are the group names translated from snake_case            |
| group-order                | Array    | []            | Override ordering of groups                                                                      |
| group-icons                | Object   | {}            | Override group icons by passing svg's on keys                                                    |
| display-recent             | Boolean  | false         | Display Recently used emojis                                                                     |
| recent-mode                | String   | 'recent'      | `recent` (last used first) or `frequent` (most used first)                                       |
| max-recent                 | Number   | 24            | Maximum recent emoji shown                                                                       |
| theme                      | String   | 'light'       | Available options, 'light', 'dark', and 'auto'                                                   |

## Static text option (`props['static-texts']`)

| Prop            | Type   | Default Value                                           | Description                                             |
| :-------------- | :----- | :------------------------------------------------------ | :------------------------------------------------------ |
| placeholder     | String | Search emoji                                            | Update search input placeholder text.                   |
| skinTone        | String | Skin tone                                               | Footer skin tone button text.                           |
| noResults       | String | No emoji has been found!                                | Shown when a search has no results.                     |
| searchLabel     | String | Search emoji                                            | Accessible label of the search input.                   |
| categoriesLabel | String | Emoji categories                                        | Accessible label of the category bar.                   |
| skinTones       | String | Default, Light, Medium-light, Medium, Medium-dark, Dark | Comma-separated accessible names of the six skin tones. |

Together with `group-names`, every string in the picker can be translated.

Example:
`:static-texts="{ placeholder: 'Search emoji'}" `<br/>

## Emoji artwork

`set` picks the artwork from [emoji-datasource](https://github.com/iamcal/emoji-data)
on jsDelivr, `native` uses the system font, and `image-url` lets you serve
images yourself:

```vue
<EmojiPicker set="twitter" />
<EmojiPicker :image-url="(u) => `/emoji/${u}.png`" />
```

Emoji in `additional-groups` can carry their own image with `src`, which is
always used — handy for team or brand emoji:

```js
{
  custom: [
    { n: ['ship it', 'shipit'], u: 'x-shipit', src: '/emoji/shipit.png' },
  ]
}
```

> Licensing differs per set. Twitter (Twemoji, CC-BY 4.0) and Google (Noto,
> Apache 2.0) can be used commercially; check Apple's and Facebook's terms
> before shipping their artwork in a product.

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

## Events / Callbacks

### `@select`

This event fires when an emoji gets selected/clicked.<br/>
Event callback will receive selected emoji in the first argument.

```
<EmojiPicker @select="onSelectEmoji" />

function onSelectEmoji(emoji) { /* do something */ }
```

### `@update:text`

This event fires when input text gets changed.<br/>
Event callback will receive the text in the first argument.

```
<EmojiPicker @update:text="onChangeText" />

function onChangeText(text) { /* do something */ }
```

## Available groups

```json
[
  "smileys_people",
  "animals_nature",
  "food_drink",
  "activities",
  "travel_places",
  "objects",
  "symbols",
  "flags"
]
```

## Default group names

```json
{
  "smileys_people": "Smiles & People",
  "animals_nature": "Animals & Nature",
  "food_drink": "Food & Drink",
  "activities": "Activities",
  "travel_places": "Travel places",
  "objects": "Objects",
  "symbols": "Symbols",
  "flags": "Flags",
  "recent": "Recently used"
}
```

## Overriding group names

```vue
<picker :group-names="{ smileys_people: 'My customized group name' }" />
```

## Overriding group icons

```vue
<template>
  <picker :group-icons="{ smileys_people: customSVG }" />
</template>

<script setup>
import customSVG from './path/to/svg'
</script>
```

## Override group order

This will make it so flags is first and then any other non-defined group will follow.

```vue
<picker :group-order="['flags']" />
```

## Add additional groups

To see any existing emoji's see `src/data/emojis.json`

```vue
<picker
  :additional-groups="{
    my_custom_group: [
      { n: ['grinning face', 'grinning'], u: '1f600' },
      { n: ['grinning face with smiling eyes', 'grin'], u: '1f601' },
    ],
  }"
  :group-names="{ my_custom_group: 'Frequently used' }"
/>
```
