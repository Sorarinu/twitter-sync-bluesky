module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: ['standard-with-typescript', 'plugin:vue/vue3-essential', 'plugin:prettier/recommended'],
  plugins: ['vue'],
  rules: {}
}
