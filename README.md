# Vue3 Emoji Picker Component

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />

Live preview: [codesandbox](https://codesandbox.io/s/heuristic-dewdney-kp971?file=/src/App.vue)

### Installation:

```
npm install vue3-emoji-picker

// or
yarn add vue3-emoji-picker
```

### Usage:

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

### props

| Prop                       | Type    | Default Value | Required | Description                                                            |
| :------------------------- | :------ | :------------ | :------- | :--------------------------------------------------------------------- |
| native                     | Boolean | false         | No       | Load native emoji instead of image.                                    |
| hide-search                | Boolean | true          | No       | Show/hide search input.                                                |
| hide-group-icons           | Boolean | false         | No       | Show/hide header group icons.                                          |
| hide-group-names           | Boolean | false         | No       | Show/hide group names.                                                 |
| disable-sticky-group-names | Boolean | false         | No       | Disable sticky for group names                                         |
| disable-skin-tones         | Boolean | false         | No       | Disable skin tones.                                                    |
| disabled-groups            | Array   | []            | No       | Disable any group/category. See [Available groups](#available-groups)  |
| group-names                | Object  | {}            | No       | Change any group name. See [Default Group names](#default-group-names) |
| static-texts               | Object  | Object        | No       | See [static-texts](#propsstatic-texts) table                           |
| select                     | event   | N/A           | No       | callback function on emoji click/select                                |

### props['static-texts']

| Prop        | Type   | Default Value | Required | Description                           |
| :---------- | :----- | :------------ | :------- | :------------------------------------ |
| placeholder | String | Search emoji  | No       | Update search input placeholder text. |
| skinTone    | String | Skin tone     | No       | Footer skin tone button text.         |

Example:
`:static-texts="{ placeholder: 'Search emoji'}" `<br/>

### Available groups

```javascript
;[
  'smileys_people',
  'animals_nature',
  'food_drink',
  'activities',
  'travel_places',
  'objects',
  'symbols',
  'flags',
]
```

### Default Group names

```javascript
{
  smileys_people: "Smiles & People",
  animals_nature: "Animals & Nature",
  food_drink: "Food & Drink",
  activities: "Activities",
  travel_places: "Travel places",
  objects: "Objects",
  symbols: "Symbols",
  flags: "Flags",
}
```
