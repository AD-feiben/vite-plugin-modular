// 模块配置接口
export interface ModuleConfig {
  name: string
  sourceDir: string
  entry: string
  title: string
  outputDir: string
  environments: string[]
  define: Record<string, unknown>
  base: string
}

// 模块化配置接口
export type ModularConfig = Record<string, ModuleConfig>

// 包配置接口
export interface PackageJson {
  scripts?: Record<string, string>
  [key: string]: unknown
}
