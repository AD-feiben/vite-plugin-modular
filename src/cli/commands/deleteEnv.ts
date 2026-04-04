import {
  saveModularConfig,
  loadPackageJson,
  savePackageJson,
  loadCliConfig,
  deleteEnvFile,
  getEnvironmentChoices,
  logger
} from '../../utils'
import { getPrompt, checkModulesExist } from '../utils'

const prompt = getPrompt()

export async function deleteEnvCommand(): Promise<void> {
  try {
    logger.commandStart('deleteEnv')

    const { config: modularConfig, modules } = checkModulesExist()
    const cliConfig = loadCliConfig()

    if (!modules.length) {
      return
    }

    // 选择要删除环境的模块
    const { moduleName } = await prompt({
      type: 'list',
      name: 'moduleName',
      message: '请选择要删除环境的模块：',
      choices: modules
    })

    const moduleConfig = modularConfig[moduleName]

    // 检查是否有可删除的环境
    const removableEnvironments = moduleConfig.environments.filter(
      (env) => env !== 'dev' && env !== 'prod'
    )

    if (removableEnvironments.length === 0) {
      logger.errorMessage('没有可删除的环境，dev和prod是默认环境，不可删除')
      return
    }

    // 显示当前环境列表，标记默认环境
    const environmentChoices = getEnvironmentChoices(moduleConfig.environments)

    // 选择要删除的环境
    const { envName } = await prompt({
      type: 'list',
      name: 'envName',
      message: '请选择要删除的环境：',
      choices: environmentChoices
    })

    // 确认删除
    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: `确认删除环境 "${envName}" 吗？`,
      default: false
    })

    if (!confirm) {
      logger.successMessage('已取消删除操作')
      return
    }

    // 删除env文件
    deleteEnvFile(moduleName, envName)

    // 更新模块配置
    moduleConfig.environments = moduleConfig.environments.filter((env) => env !== envName)
    modularConfig[moduleName] = moduleConfig
    saveModularConfig(modularConfig, cliConfig.jsonIndent)

    // 加载package.json
    const packageJson = loadPackageJson()

    // 删除相关命令
    if (packageJson.scripts) {
      delete packageJson.scripts[`build:${moduleName}:${envName}`]
      savePackageJson(packageJson, cliConfig.jsonIndent)
    }

    // 打印成功信息
    logger.successMessage(`模块 ${moduleName} 环境 ${envName} 删除成功`)
    logger.infoMessage(`当前环境: ${moduleConfig.environments.join(', ')}`)
  } catch (error) {
    logger.errorMessage(`删除环境失败：${(error as Error).message}`)
  }
}
