module.exports = {
  extends: ['plugin:vue/vue3-recommended', 'prettier'],
  rules: {
    'vue/multi-word-component-names': 0,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
}
