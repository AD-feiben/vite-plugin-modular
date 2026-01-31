import { table } from "table";
import { loadModularConfig, logger } from "../../utils";

export async function listCommand(): Promise<void> {
  try {
    logger.commandStart("list");

    const modularConfig = loadModularConfig();
    const modules = Object.values(modularConfig);

    if (modules.length === 0) {
      logger.errorMessage("没有找到任何模块，请先创建模块");
      return;
    }

    // 准备表格数据
    const tableData = [
      ["模块名称", "标题", "源码路径", "入口文件", "输出目录", "环境列表"],
    ];

    modules.forEach((module) => {
      tableData.push([
        module.name,
        module.title,
        `src/modules/${module.sourceDir}`,
        `${module.entry}`,
        `dist/${module.outputDir}`,
        module.environments.join(", "),
      ]);
    });

    // 输出表格
    console.log(table(tableData));
    logger.successMessage(`共找到 ${modules.length} 个模块`);

    logger.commandEnd("list");
  } catch (error) {
    logger.errorMessage(`获取模块列表失败：${(error as Error).message}`);
  }
}
