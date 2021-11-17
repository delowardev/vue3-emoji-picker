# Vue3 Emoji Picker Component

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />

Live preview: [codesandbox](https://codesandbox.io/s/heuristic-dewdney-kp971?file=/src/App.vue)

> Notice: This component is for internal use only, it's not ready for production use yet.

### props

| Prop          | Type      | Default Value  | Required  |  Description |
| :---         | :---     | :---          | :---     | :--- |
| native        | Boolean   | false          |  No    |Load native emoji instead of image. |
| hide-search        | Boolean   | true           |  No    | Show/hide search input. |
| hide-group-icons | Boolean   | false       |  No    | Show/hide header group icons. |
| hide-group-names | Boolean   | false       |  No    | Show/hide group names. |
| static-texts | Object   | Object           |  No    | See `props['static-texts']` table |
| select        | event     | N/A            |  No    | callback function on emoji click/select |

### props['static-texts']
| Prop          | Type      | Default Value  | Required  |  Description |
| :---         | :---     | :---          | :---     | :--- |
| placeholder   | String | Search emoji | No | Update search input placeholder text. |
| skinTone   | String | Skin tone | No | Footer  skin tone button text. |

Example: 
``` :static-texts="{ placeholder: 'Search emoji'}"  ```<br/>


### Example:

```javascript

// import picker compopnent
import EmojiPicker from "vue3-emoji-picker"

// import css
import "node_modules/vue3-emoji-picker/dist/style.css"

```
```vue

// use picker component
<EmojiPicker 
    :native="true" 
    @select="onSelectEmoji"
/>
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
