import { createPromptModule } from "inquirer";
const prompt = createPromptModule();
import { existsSync } from "fs";
import { join } from "path";
import {
  loadModularConfig,
  saveModularConfig,
  loadPackageJson,
  savePackageJson,
  loadCliConfig,
  createEnvFile,
  createModuleDir,
  createEntryFile,
  isSourceDirAvailable,
  findTemplateEntryFile,
  copyTemplateFiles,
  logger,
} from "../../utils";

export async function addCommand(): Promise<void> {
  try {
    logger.commandStart("add");

    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();

    // 询问模块名称，带重复校验
    const { moduleName } = await prompt({
      type: "input",
      name: "moduleName",
      message: "请输入模块名称：",
      validate: (value) => {
        if (!value) {
          return "模块名称不能为空";
        }
        if (modularConfig[value]) {
          return "模块名称已存在，请使用其他名称";
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return "模块名称只能包含字母、数字、下划线和连字符";
        }
        return true;
      },
    });

    // 询问模块标题
    const { title } = await prompt({
      type: "input",
      name: "title",
      message: "请输入模块标题：",
      default: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
    });

    // 询问源码路径，默认模块名，带唯一性校验
    const { sourceDir } = await prompt({
      type: "input",
      name: "sourceDir",
      message: "请输入源码路径（只包含src/modules/之后的子路径）：",
      default: moduleName,
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

    // 检查模板目录并推断入口文件名
    let entry = "main.ts";
    const templateDir = cliConfig.templateDir || "templates";

    // 使用新的函数查找模板入口文件
    const templateEntryFile = findTemplateEntryFile(templateDir);

    if (templateEntryFile) {
      // 保留模板中的入口文件名
      entry = templateEntryFile;
    }

    // 询问入口文件（如果没有从模板推断出）
    if (entry === "main.ts") {
      const entryPrompt = await prompt({
        type: "input",
        name: "entry",
        message: "请输入入口文件：",
        default: entry,
      });
      entry = entryPrompt.entry;
    }

    // 询问输出目录，默认模块名
    const { outputDir } = await prompt({
      type: "input",
      name: "outputDir",
      message: "请输入构建输出目录（默认: dist/[outputDir]）：",
      default: moduleName,
    });

    // 环境列表，初始包含dev和prod
    const environments: string[] = ["dev", "prod"];
    let addMore = true;

    // 循环询问额外环境名
    while (addMore) {
      const { newEnv } = await prompt({
        type: "input",
        name: "newEnv",
        message: `请输入额外的环境名（已选择：${environments.join(", ")}，回车结束）：`,
      });

      if (newEnv) {
        // 环境名校验
        if (!/^[a-zA-Z0-9_-]+$/.test(newEnv)) {
          logger.warningMessage(
            "环境名只能包含字母、数字、下划线和连字符，请重新输入",
          );
          continue;
        }
        if (environments.includes(newEnv)) {
          logger.warningMessage("环境名已存在，请使用其他名称");
          continue;
        }
        environments.push(newEnv);
      } else {
        addMore = false;
      }
    }

    // 收集共享环境变量
    const define: Record<string, any> = {};
    const { addVars } = await prompt({
      type: "confirm",
      name: "addVars",
      message: "是否需要添加共享环境变量？",
      default: false,
    });

    if (addVars) {
      let addMoreVars = true;
      while (addMoreVars) {
        const { key, value, continueAdding } = await prompt([
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
          {
            type: "confirm",
            name: "continueAdding",
            message: "是否继续添加变量？",
            default: true,
          },
        ]);

        define[key] = value;
        logger.successMessage(`已添加变量：${key} = ${value}`);

        if (!continueAdding) {
          addMoreVars = false;
        }
      }
    }

    // 创建模块配置
    const moduleConfig = {
      name: moduleName,
      sourceDir,
      entry,
      title,
      outputDir,
      environments,
      define,
    };

    // 更新模块化配置
    modularConfig[moduleName] = moduleConfig;
    saveModularConfig(modularConfig, cliConfig.jsonIndent);

    // 加载package.json
    const packageJson = loadPackageJson();
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // 添加命令到package.json
    packageJson.scripts[`serve:${moduleName}`] =
      `vite --mode ${moduleName}-dev`;
    packageJson.scripts[`build:${moduleName}`] =
      `vite build --mode ${moduleName}-prod`;

    // 为额外环境添加build命令
    environments.forEach((env) => {
      if (env !== "dev" && env !== "prod") {
        packageJson.scripts![`build:${moduleName}-${env}`] =
          `vite build --mode ${moduleName}-${env}`;
      }
    });

    // 保存package.json
    savePackageJson(packageJson, cliConfig.jsonIndent);

    // 创建模块目录
    createModuleDir(sourceDir);

    // 复制模板文件到模块目录
    const copiedFiles = copyTemplateFiles(cliConfig.templateDir, sourceDir);

    // 创建入口文件（如果模板中没有提供）
    const entryPath = join(process.cwd(), `src/modules/${sourceDir}/${entry}`);
    if (!existsSync(entryPath)) {
      createEntryFile(sourceDir, entry);
    }

    // 创建所有环境的env文件
    environments.forEach((env) => {
      createEnvFile(moduleName, env);
    });

    // 打印成功信息
    logger.successMessage(`模块 ${moduleName} 创建成功`);
    logger.infoMessage(`目录: src/modules/${sourceDir}`);
    logger.infoMessage(`入口: ${entry}`);
    logger.infoMessage(`环境: ${environments.join(", ")}`);
    // 合并所有命令并打印
    const commands = [`serve:${moduleName}`, `build:${moduleName}`];
    environments.forEach((env) => {
      if (env !== "dev" && env !== "prod") {
        commands.push(`build:${moduleName}-${env}`);
      }
    });
    logger.infoMessage(`命令: ${commands.join(", ")}`);
    // 打印复制的模板文件信息
    if (copiedFiles.length > 0) {
      logger.infoMessage(`已从模板复制文件: ${copiedFiles.join(", ")}`);
    }

    logger.commandEnd("add");
  } catch (error) {
    logger.errorMessage(`创建模块失败：${(error as Error).message}`);
  }
}
