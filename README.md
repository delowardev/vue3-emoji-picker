# Vue3 Emoji Picker Component

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />

Live preview: [codesandbox](https://codesandbox.io/s/heuristic-dewdney-kp971?file=/src/App.vue)

> Notice: This component is for internal use only, it's not ready for production use yet.

### Options

| Option | Type | Default Value | Description | Range |
| :---: | :---: | :---: | :---: | :---: |
| native | Boolean | false | Load native emoji instead of image. |  N/A |
| search | Boolean | true | Show/hide search input. |  N/A |
| groupIcons | Boolean | true | Show/hide header group icons. |  N/A |
| select | event | N/A | fires on emoji onClick |  N/A |

#### Option Example:

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
    :search="true"
    :groupIcons="true"
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
