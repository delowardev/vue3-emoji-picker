module.exports = {
  extends: ['plugin:vue/vue3-recommended', 'prettier'],
  rules: {
    'vue/no-reserved-component-names': 'off',
    'vue/multi-word-component-names': 'off',
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
}
