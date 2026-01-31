/**
 * Vite Plugin Modular CLI 配置文件类型定义
 *
 * 此文件为vmod.config.js提供智能IDE提示
 * 无需在配置文件中添加JSDoc注释
 */

declare module "vite-plugin-modular" {
  import { Plugin } from "vite";

  /**
   * Vite Plugin Modular 插件
   */
  export default function VitePluginModular(): Plugin;

  /**
   * 定义 Vite Plugin Modular CLI 配置
   *
   * 此函数为配置对象提供智能IDE提示
   * 用法与 Vite 的 defineConfig 类似
   *
   * @example
   * // vmod.config.js
   * const { defineVmodConfig } = require('vite-plugin-modular');
   *
   * module.exports = defineVmodConfig({
   *   templateDir: 'templates',
   *   jsonIndent: 2
   * });
   *
   * @example
   * // vmod.config.js (ESM)
   * import { defineVmodConfig } from 'vite-plugin-modular';
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
  export function defineVmodConfig(
    config: CliConfig | (() => CliConfig),
  ): CliConfig;

  /**
   * Vite Plugin Modular CLI 配置接口
   */
  export interface CliConfig {
    /**
     * 模板目录路径
     * @default "templates"
     */
    templateDir?: string;

    /**
     * JSON文件缩进空格数
     * @default 自动从项目检测
     */
    jsonIndent?: number;
  }

  /**
   * Vite Plugin Modular CLI 配置类型
   */
  export type VmodConfig = CliConfig;
}

declare module "vite-plugin-modular/config" {
  export * from "vite-plugin-modular";
}

/**
 * Vite Plugin Modular CLI 配置文件
 */
declare interface VmodConfig {
  /**
   * 模板目录路径
   * @default "templates"
   */
  templateDir?: string;

  /**
   * JSON文件缩进空格数
   * @default 自动从项目检测
   */
  jsonIndent?: number;
}

/**
 * 模块导出声明，为JS配置文件提供智能提示
 */
declare module "*.config.js" {
  const config: VmodConfig;
  export = config;
}

declare module "*.config.json" {
  const config: VmodConfig;
  export default config;
}
