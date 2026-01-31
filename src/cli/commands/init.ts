import { createPromptModule } from "inquirer";
const prompt = createPromptModule();
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { getProjectIndent, logger } from "../../utils";

export async function initCommand(): Promise<void> {
  try {
    logger.commandStart("init");

    // 检查是否已存在配置文件
    const jsonConfigPath = join(process.cwd(), "vmod.config.json");
    const jsConfigPath = join(process.cwd(), "vmod.config.js");

    if (existsSync(jsonConfigPath) || existsSync(jsConfigPath)) {
      logger.errorMessage("配置文件已存在，无法初始化");
      return;
    }

    // 询问配置文件格式
    const { format } = await prompt({
      type: "list",
      name: "format",
      message: "请选择配置文件格式：",
      choices: [
        { name: "JSON格式 (vmod.config.json) - 支持智能提示", value: "json" },
        { name: "JavaScript格式 (vmod.config.js) - 更灵活", value: "js" },
      ],
      default: "json",
    });

    // 询问模板目录
    const { templateDir } = await prompt({
      type: "input",
      name: "templateDir",
      message: "请输入模板目录路径（默认：templates）：",
      default: "templates",
    });

    // 询问JSON缩进
    const projectIndent = getProjectIndent();
    const { jsonIndent } = await prompt({
      type: "input",
      name: "jsonIndent",
      message: `请输入JSON缩进空格数（默认：${projectIndent}，自动从项目检测）：`,
      default: projectIndent.toString(),
      validate: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 8) {
          return "缩进值必须在1-8之间";
        }
        return true;
      },
    });

    // 生成配置文件
    if (format === "json") {
      const config = {
        templateDir,
        jsonIndent: parseInt(jsonIndent),
      };

      writeFileSync(
        jsonConfigPath,
        JSON.stringify(config, null, projectIndent),
        "utf8",
      );

      logger.successMessage("已创建配置文件：vmod.config.json");
    } else {
      const configContent = `// Vite Plugin Modular CLI 配置文件
// IDE会自动提供智能提示
// 使用 ESM 格式
import { defineVmodConfig } from '@ad-feiben/vite-plugin-modular/config';

export default defineVmodConfig({
  templateDir: "${templateDir}",
  jsonIndent: ${jsonIndent}
});
`;

      writeFileSync(jsConfigPath, configContent, "utf8");

      logger.successMessage("已创建配置文件：vmod.config.js");
    }

    // 打印成功信息
    logger.infoMessage(`模板目录：${templateDir}`);
    logger.infoMessage(`JSON缩进：${jsonIndent} 空格`);
    logger.successMessage("配置文件初始化完成");
    logger.infoMessage("使用 vmod add 命令创建新模块");
  } catch (error) {
    logger.errorMessage(`初始化配置文件失败：${(error as Error).message}`);
  }
}
