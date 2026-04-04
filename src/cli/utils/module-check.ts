import { loadModularConfig, logger } from '../../utils'
import { ModularConfig, ModuleConfig } from '../../types'

export interface ModuleCheckResult {
  passed: boolean
  config: ModularConfig
  modules: string[]
}

export interface ModuleListResult {
  passed: boolean
  config: ModularConfig
  modules: ModuleConfig[]
}

export function checkModulesExist(): ModuleCheckResult {
  const config = loadModularConfig()
  const modules = Object.keys(config)

  if (modules.length === 0) {
    logger.errorMessage('没有找到任何模块，请先创建模块')
    return { passed: false, config, modules }
  }

  return { passed: true, config, modules }
}

export function getModuleList(): ModuleListResult {
  const config = loadModularConfig()
  const modules = Object.values(config)

  if (modules.length === 0) {
    logger.errorMessage('没有找到任何模块，请先创建模块')
    return { passed: false, config, modules }
  }

  return { passed: true, config, modules }
}
