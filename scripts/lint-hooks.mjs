// 快速 React Hooks 规则检查(与 CI 的 react-hooks 规则对齐)
//
// 背景:完整的 `npm run lint` 会加载 eslint-config-next 的全部 TS 规则,启动约 1 分钟。
// CI 里失败最多的是 react-hooks 系列(set-state-in-effect / preserve-manual-memoization 等),
// 这个脚本只加载该插件,几秒内出结果,便于提交前自查。
//
// 用法:node scripts/lint-hooks.mjs [文件或目录...]  (默认检查 app 与 lib)
import { ESLint } from 'eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import tsParser from '@typescript-eslint/parser'

const targets = process.argv.slice(2)
const files = targets.length > 0 ? targets : ['app', 'lib']

const rules = Object.fromEntries(
  Object.keys(reactHooks.configs['recommended-latest'].rules).map((name) => [name, 'error'])
)

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' }
      },
      plugins: { 'react-hooks': reactHooks },
      rules
    }
  ]
})

const results = await eslint.lintFiles(files)
const formatter = await eslint.loadFormatter('stylish')
const output = await formatter.format(results)
const errorCount = results.reduce((sum, item) => sum + item.errorCount, 0)

if (output.trim()) {
  console.log(output)
}
console.log(errorCount > 0 ? `✗ react-hooks 检查失败:${errorCount} 个错误` : '✓ react-hooks 检查通过')
process.exit(errorCount > 0 ? 1 : 0)
