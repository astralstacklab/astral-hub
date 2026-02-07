module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    // Add custom rules here, or override recommended ones
    // For example, to allow console.log in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
}
