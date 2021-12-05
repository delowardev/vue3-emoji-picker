# Vue3 Emoji Picker Component

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />

Live preview: [codesandbox](https://codesandbox.io/s/heuristic-dewdney-kp971?file=/src/App.vue)

## Installation:

```
npm install vue3-emoji-picker

// or
yarn add vue3-emoji-picker
```

## Usage:

```javascript
// import picker compopnent
import EmojiPicker from 'vue3-emoji-picker'

// import css
import 'node_modules/vue3-emoji-picker/dist/style.css'
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

## Options (`props`)

| Prop                       | Type    | Default Value | Description                                                                                 |
| :------------------------- | :------ | :------------ | :------------------------------------------------------------------------------------------ |
| native                     | Boolean | false         | Load native emoji instead of image.                                                         |
| hide-search                | Boolean | true          | Show/hide search input.                                                                     |
| hide-group-icons           | Boolean | false         | Show/hide header group icons.                                                               |
| hide-group-names           | Boolean | false         | Show/hide group names.                                                                      |
| disable-sticky-group-names | Boolean | false         | Disable sticky for group names                                                              |
| disable-skin-tones         | Boolean | false         | Disable skin tones.                                                                         |
| disabled-groups            | Array   | []            | Disable any group/category. See [Available groups](#available-groups)                       |
| group-names                | Object  | {}            | Change any group name. See [Default group names](#default-group-names)                      |
| static-texts               | Object  | Object        | See [static-texts](#propsstatic-texts) table                                                |
| pickerType                 | string  | ''            | Choose picker type, possible options: `input`, `textarea` (Popup with input/textarea), `''` |
| mode                       | string  | 'insert'      | Choose insert mode, possible options: `prepend`, `insert`, `append`                         |
| offset                     | Number  | '6'           | Choose emoji popup offset                                                                   |

## Static text option (`props['static-texts']`)

| Prop        | Type   | Default Value | Description                           |
| :---------- | :----- | :------------ | :------------------------------------ |
| placeholder | String | Search emoji  | Update search input placeholder text. |
| skinTone    | String | Skin tone     | Footer skin tone button text.         |

Example:
`:static-texts="{ placeholder: 'Search emoji'}" `<br/>

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
  "flags": "Flags"
}
```
