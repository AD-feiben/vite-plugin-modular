import { createPromptModule } from "inquirer";
const prompt = createPromptModule();
import {
  loadModularConfig,
  saveModularConfig,
  loadPackageJson,
  savePackageJson,
  loadCliConfig,
  deleteEnvFile,
  deleteModuleDir,
  logger,
} from "../../utils";

export async function deleteCommand(moduleName?: string): Promise<void> {
  try {
    logger.commandStart("delete");

    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    const modules = Object.keys(modularConfig);

    if (modules.length === 0) {
      logger.errorMessage("没有找到任何模块，请先创建模块");
      return;
    }

    let selectedModuleName = moduleName;

    // 如果没有提供模块名，让用户选择
    if (!selectedModuleName) {
      const { module: selectedModule } = await prompt({
        type: "list",
        name: "module",
        message: "请选择要删除的模块：",
        choices: modules,
      });
      selectedModuleName = selectedModule;
    }

    // 检查模块是否存在
    if (!selectedModuleName || !modularConfig[selectedModuleName]) {
      logger.errorMessage(`模块 "${selectedModuleName}" 不存在`);
      return;
    }

    // 确认删除
    const { confirm } = await prompt({
      type: "confirm",
      name: "confirm",
      message: `确认删除模块 "${selectedModuleName}" 吗？这将删除所有相关配置、目录和文件。`,
      default: false,
    });

    if (!confirm) {
      logger.successMessage("已取消删除操作");
      return;
    }

    const moduleConfig = modularConfig[selectedModuleName];

    // 删除所有环境的env文件
    moduleConfig.environments.forEach((env) => {
      deleteEnvFile(selectedModuleName, env);
    });

    // 删除模块目录
    deleteModuleDir(moduleConfig.sourceDir);

    // 加载package.json
    const packageJson = loadPackageJson();

    // 删除相关命令
    if (packageJson.scripts) {
      // 删除serve命令
      delete packageJson.scripts[`serve:${selectedModuleName}`];

      // 删除build命令
      delete packageJson.scripts[`build:${selectedModuleName}`];

      // 删除额外环境的build命令
      moduleConfig.environments.forEach((env) => {
        if (env !== "dev" && env !== "prod") {
          delete packageJson.scripts![`build:${selectedModuleName}:${env}`];
        }
      });

      // 保存package.json
      savePackageJson(packageJson, cliConfig.jsonIndent);
    }

    // 删除模块化配置中的模块
    delete modularConfig[selectedModuleName];
    saveModularConfig(modularConfig, cliConfig.jsonIndent);

    // 打印成功信息
    logger.successMessage(`模块 ${selectedModuleName} 删除成功`);
    logger.infoMessage(`目录: src/modules/${moduleConfig.sourceDir}`);
    logger.infoMessage(`环境: ${moduleConfig.environments.length} 个`);
  } catch (error) {
    logger.errorMessage(`删除模块失败：${(error as Error).message}`);
  }
}
