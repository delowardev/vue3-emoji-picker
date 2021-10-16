const path = require("path")
const ncp = require('ncp').ncp;
// const fs = require("fs")

const image_source = path.join(__dirname, "node_modules", "emoji-datasource-apple", "img", "apple", "64")
const image_dest = path.join(__dirname, "public", "emojis")

// const emoji_source = path.join(__dirname, "node_modules", "emoji-datasource-apple", "emoji_pretty.json");
// const categories = path.join(__dirname, "node_modules", "emoji-datasource-apple", "categories.json");



// fs.readFile(categories, 'utf8', function (error, data) {
//     console.log(Object.values(JSON.parse(JSON.stringify(data))))
// })
//
// fs.readFile(emoji_source, 'utf8', function (error, data) {
//     console.log(error)
//     // console.log(data)
// })


ncp(image_source, image_dest, function (error) {
    if (error) {
        console.log(error);
        return;
    }
    console.log("Success!")
})
