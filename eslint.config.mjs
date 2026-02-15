import stylistic from '@stylistic/eslint-plugin'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(stylistic.configs.customize({
  flat: true,
  indent: 2,
  quotes: 'single',
  semi: false,
  jsx: true,
  braceStyle: '1tbs',
  commaDangle: 'always-multiline',
}))
