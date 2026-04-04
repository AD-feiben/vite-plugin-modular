/**
 * Vite Plugin Modular 配置工具
 *
 * 提供类似 Vite 的 defineConfig 方法
 * 为配置文件提供智能类型提示
 */

import { CliConfig } from './utils'

/**
 * 定义 Vite Plugin Modular CLI 配置
 *
 * 此函数为配置对象提供智能IDE提示
 * 用法与 Vite 的 defineConfig 类似
 *
 * @example
 * // vmod.config.js
 * const { defineVmodConfig } = require('@ad-feiben/vite-plugin-modular/config');
 *
 * module.exports = defineVmodConfig({
 *   templateDir: 'templates',
 *   jsonIndent: 2
 * });
 *
 * @example
 * // vmod.config.js (ESM)
 * import { defineVmodConfig } from '@ad-feiben/vite-plugin-modular/config';
 *
 * export default defineVmodConfig({
 *   templateDir: 'templates'
 * });
 *
 * @example
 * // 函数形式（支持动态配置）
 * export default defineVmodConfig(() => ({
 *   templateDir: 'templates',
 *   jsonIndent: 2
 * }));
 */
export function defineVmodConfig(config: CliConfig | (() => CliConfig)): CliConfig {
  if (typeof config === 'function') {
    return config()
  }
  return config
}

/**
 * Vite Plugin Modular CLI 配置类型
 *
 * 用于 TypeScript 类型引用
 */
export type VmodConfig = CliConfig
