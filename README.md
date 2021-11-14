# Vue3 Emoji Picker Component

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />

Live preview: [codesandbox](https://codesandbox.io/s/heuristic-dewdney-kp971?file=/src/App.vue)

> Notice: This component is for internal use only, it's not ready for production use yet.

### Props

| Name          | Type      | Default Value  | Required  |  Description |
| :---:         | :---:     | :---:          | :---:     | :---: |
| native        | Boolean   | false          |  false    |Load native emoji instead of image. |
| search        | Boolean   | true           |  false    | Show/hide search input. |
| groupIcons    | Boolean   | true           |  false    | Show/hide header group icons. |
| select        | event     | N/A            |  false      | callback function on emoji click/select |

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
