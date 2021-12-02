module.exports = {
    extends: [
        // add more generic rulesets here, such as:
        // 'eslint:recommended',
        'plugin:vue/vue3-recommended',
        'prettier'
        // 'plugin:vue/recommended' // Use this if you are using Vue.js 2.x.
    ],
    rules: {
        'vue/multi-word-component-names': 0
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser'
    }
}
