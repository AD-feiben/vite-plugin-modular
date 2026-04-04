import {
  loadModularConfig,
  saveModularConfig,
  loadPackageJson,
  savePackageJson,
  loadCliConfig,
  createEnvFile,
  logger
} from '../../utils'
import { getPrompt, validateName } from '../utils'

const prompt = getPrompt()

export async function addEnvCommand(): Promise<void> {
  try {
    logger.commandStart('addEnv')

    const modularConfig = loadModularConfig()
    const cliConfig = loadCliConfig()
    const modules = Object.keys(modularConfig)

    if (modules.length === 0) {
      logger.errorMessage('没有找到任何模块，请先创建模块')
      return
    }

    // 选择要添加环境的模块，显示已添加的环境
    const { moduleName } = await prompt({
      type: 'list',
      name: 'moduleName',
      message: '请选择要添加环境的模块：',
      choices: modules.map((module) => ({
        name: `${module} (已添加环境：${modularConfig[module].environments.join(', ')})`,
        value: module
      }))
    })

    const moduleConfig = modularConfig[moduleName]
    const currentEnvironments = [...moduleConfig.environments]

    // 循环输入新环境名
    while (true) {
      const { envName } = await prompt({
        type: 'input',
        name: 'envName',
        message: '请输入新的环境名（回车结束）：'
      })

      if (!envName) {
        break
      }

      if (!validateName(envName, '环境名')) {
        continue
      }

      if (currentEnvironments.includes(envName)) {
        logger.warningMessage('环境名已存在，请使用其他名称')
        continue
      }

      // 添加新环境
      currentEnvironments.push(envName)
    }

    // 如果没有添加新环境，直接退出
    if (currentEnvironments.length === moduleConfig.environments.length) {
      logger.successMessage('没有添加任何新环境')
      return
    }

    // 保存原始环境列表，用于比较获取新添加的环境
    const originalEnvironments = [...moduleConfig.environments]

    // 更新模块配置
    moduleConfig.environments = currentEnvironments
    modularConfig[moduleName] = moduleConfig
    saveModularConfig(modularConfig, cliConfig.jsonIndent)

    // 加载package.json
    const packageJson = loadPackageJson()
    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }

    // 为新添加的环境创建env文件并添加命令
    const newEnvironments = currentEnvironments.filter((env) => !originalEnvironments.includes(env))
    newEnvironments.forEach((env) => {
      // 创建env文件
      createEnvFile(moduleName, env)

      // 添加build命令
      packageJson.scripts![`build:${moduleName}:${env}`] = `vite build --mode ${moduleName}:${env}`
    })

    // 保存package.json
    savePackageJson(packageJson, cliConfig.jsonIndent)

    // 打印成功信息
    logger.successMessage(`模块 ${moduleName} 环境添加成功`)
    logger.infoMessage(`当前环境: ${currentEnvironments.join(', ')}`)
    logger.infoMessage(`新增环境: ${newEnvironments.join(', ')}`)
    newEnvironments.forEach((env) => {
      logger.infoMessage(`命令: build:${moduleName}:${env}`)
    })
  } catch (error) {
    logger.errorMessage(`添加环境失败：${(error as Error).message}`)
  }
}
