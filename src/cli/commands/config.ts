import { createPromptModule } from "inquirer";
const prompt = createPromptModule();
import {
  loadModularConfig,
  saveModularConfig,
  loadCliConfig,
  createEnvFile,
  isSourceDirAvailable,
  getEnvironmentChoices,
  logger,
} from "../../utils";

export async function configCommand(): Promise<void> {
  try {
    logger.commandStart("config");

    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    const modules = Object.keys(modularConfig);

    if (modules.length === 0) {
      logger.errorMessage("没有找到任何模块，请先创建模块");
      return;
    }

    // 选择要修改的模块
    const { moduleName } = await prompt({
      type: "list",
      name: "moduleName",
      message: "请选择要修改配置的模块：",
      choices: modules,
    });

    const moduleConfig = modularConfig[moduleName];
    let updatedConfig = { ...moduleConfig };

    // 配置修改菜单
    let continueEditing = true;

    while (continueEditing) {
      // 配置修改菜单
      const { action } = await prompt({
        type: "list",
        name: "action",
        message: "请选择要修改的配置项：",
        choices: [
          "修改标题",
          "修改源码路径",
          "修改入口文件",
          "修改输出目录",
          "修改基础路径",
          "管理环境",
          "管理共享环境变量",
          "保存并退出",
          "取消修改",
        ],
      });

      switch (action) {
        case "修改标题":
          {
            const { title } = await prompt({
              type: "input",
              name: "title",
              message: "请输入新的模块标题：",
              default: updatedConfig.title,
            });
            updatedConfig.title = title;
            logger.successMessage(`已更新模块标题为: ${title}`);
          }
          break;

        case "修改源码路径":
          {
            const { sourceDir } = await prompt({
              type: "input",
              name: "sourceDir",
              message: "请输入新的源码路径（只包含src/modules/之后的子路径）：",
              default: updatedConfig.sourceDir,
              validate: (value) => {
                if (!value) {
                  return "源码路径不能为空";
                }
                if (!isSourceDirAvailable(value, moduleName, modularConfig)) {
                  return "源码路径已被其他模块使用，请使用其他路径";
                }
                return true;
              },
            });
            updatedConfig.sourceDir = sourceDir;
            logger.successMessage(`已更新源码路径为: ${sourceDir}`);
          }
          break;

        case "修改入口文件":
          {
            const { entry } = await prompt({
              type: "input",
              name: "entry",
              message: "请输入新的入口文件：",
              default: updatedConfig.entry,
            });
            updatedConfig.entry = entry;
            logger.successMessage(`已更新入口文件为: ${entry}`);
          }
          break;

        case "修改输出目录":
          {
            const { outputDir } = await prompt({
              type: "input",
              name: "outputDir",
              message: "请输入新的输出目录：",
              default: updatedConfig.outputDir,
            });

            updatedConfig.outputDir = outputDir;
            logger.successMessage(`已更新输出目录为: ${outputDir}`);
          }
          break;

        case "修改基础路径":
          {
            const { base } = await prompt({
              type: "input",
              name: "base",
              message: "请输入新的基础路径：",
              default: updatedConfig.base || "/",
            });

            updatedConfig.base = base;
            logger.successMessage(`已更新基础路径为: ${base}`);
          }
          break;

        case "管理环境":
          {
            const { envAction } = await prompt({
              type: "list",
              name: "envAction",
              message: "请选择环境管理操作：",
              choices: ["添加环境", "删除环境", "返回上一级"],
            });

            if (envAction === "添加环境") {
              const { envName } = await prompt({
                type: "input",
                name: "envName",
                message: "请输入要添加的环境名：",
                validate: (value) => {
                  if (!value) {
                    return "环境名不能为空";
                  }
                  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return "环境名只能包含字母、数字、下划线和连字符";
                  }
                  if (updatedConfig.environments.includes(value)) {
                    return "环境名已存在，请使用其他名称";
                  }
                  return true;
                },
              });

              updatedConfig.environments.push(envName);
              createEnvFile(moduleName, envName);
              logger.successMessage(`已添加环境：${envName}`);
            } else if (envAction === "删除环境") {
              // 显示当前环境列表，标记默认环境
              const environmentChoices = getEnvironmentChoices(
                updatedConfig.environments,
              );

              // 选择要删除的环境
              const { envName } = await prompt({
                type: "list",
                name: "envName",
                message: "请选择要删除的环境：",
                choices: environmentChoices,
              });

              // 确认删除
              const { confirm } = await prompt({
                type: "confirm",
                name: "confirm",
                message: `确认删除环境 "${envName}" 吗？`,
                default: false,
              });

              if (confirm) {
                updatedConfig.environments = updatedConfig.environments.filter(
                  (env) => env !== envName,
                );
                logger.successMessage(`已删除环境：${envName}`);
              }
            }
          }
          break;

        case "管理共享环境变量":
          {
            const { varAction } = await prompt({
              type: "list",
              name: "varAction",
              message: "请选择共享环境变量管理操作：",
              choices: ["添加变量", "删除变量", "返回上一级"],
            });

            if (varAction === "添加变量") {
              const { key, value } = await prompt([
                {
                  type: "input",
                  name: "key",
                  message: "请输入变量名：",
                  validate: (value) => {
                    if (!value) {
                      return "变量名不能为空";
                    }
                    return true;
                  },
                },
                {
                  type: "input",
                  name: "value",
                  message: "请输入变量值：",
                },
              ]);

              updatedConfig.define[key] = value;
              logger.successMessage(`已添加变量：${key} = ${value}`);
            } else if (varAction === "删除变量") {
              const currentVars = Object.keys(updatedConfig.define);
              if (currentVars.length === 0) {
                logger.errorMessage("没有可删除的共享环境变量");
                continue;
              }

              const { key } = await prompt({
                type: "list",
                name: "key",
                message: "请选择要删除的共享环境变量：",
                choices: currentVars,
              });

              delete updatedConfig.define[key];
              logger.successMessage(`已删除变量：${key}`);
            }
          }
          break;

        case "保存并退出":
          continueEditing = false;
          break;

        case "取消修改":
          return;
      }
    }

    // 更新模块化配置
    modularConfig[moduleName] = updatedConfig;
    saveModularConfig(modularConfig, cliConfig.jsonIndent);

    // 打印成功信息
    logger.successMessage(`模块 ${moduleName} 配置更新成功`);
    logger.infoMessage(`配置已保存到 .modular.config.jsonc`);
  } catch (error) {
    logger.errorMessage(`修改配置失败：${(error as Error).message}`);
  }
}
