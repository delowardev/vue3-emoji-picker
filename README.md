### Emoji Picker Component for Vue3
Live preview: [https://vue3-emoji-picker.vercel.app](https://vue3-emoji-picker.vercel.app)

<img src="https://i.imgur.com/CQc1nCF.png" width="280" />

### Options

| Option | Type | Default Value | Description | Range |
| :---: | :---: | :---: | :---: | :---: |
| native | Boolean | false | Load native emoji instead of image. |  N/A |
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
