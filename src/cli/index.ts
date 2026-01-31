#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { addCommand } from "./commands/add";
import { deleteCommand } from "./commands/delete";
import { addEnvCommand } from "./commands/addEnv";
import { deleteEnvCommand } from "./commands/deleteEnv";
import { listCommand } from "./commands/list";
import { configCommand } from "./commands/config";
// import { uiCommand } from "./commands/ui"; // 暂时注释，以后实现
import { initCommand } from "./commands/init";
import packageJson from "../../package.json";

const VERSION = packageJson.version;

// 启用颜色支持
chalk.level = 3;

// 打印 banner
function printBanner() {
  // 更自然的字母级别渐变效果函数
  function gradientText(text: string): string {
    let result = "";
    const totalLength = text.length;

    for (let i = 0; i < totalLength; i++) {
      const char = text[i];
      // 计算颜色过渡比例（0-1）
      const ratio = i / totalLength;

      // 使用更平滑的颜色过渡
      if (ratio < 0.25) {
        // 深蓝色到蓝色过渡
        result += chalk.bold.rgb(59, 130, 246)(char); // 蓝色
      } else if (ratio < 0.5) {
        // 蓝色到青色过渡
        result += chalk.bold.rgb(14, 165, 233)(char); // 亮蓝色
      } else if (ratio < 0.75) {
        // 青色到蓝绿色过渡
        result += chalk.bold.rgb(6, 182, 212)(char); // 青色
      } else {
        // 蓝绿色到绿色过渡
        result += chalk.bold.rgb(16, 185, 129)(char); // 绿色
      }
    }
    return result;
  }

  // 一行显示的 banner
  const pluginName = gradientText("Vite Plugin Modular");
  const description =
    " - 🚀 Modularize Your Vite App " + chalk.green(`v${VERSION}`);

  const banner = `\n${pluginName}${description}\n`;

  console.log(banner);
}

// 检查是否需要打印 banner
const shouldPrintBanner =
  process.argv.length === 2 ||
  process.argv[2] === "--help" ||
  process.argv[2] === "-h";
if (shouldPrintBanner) {
  printBanner();
}

const program = new Command();

program
  .name("vmod")
  .description("Vite Plugin Modular CLI Tool")
  .version(VERSION);

// 添加模块命令
program
  .command("add")
  .alias("a")
  .description("Add a new module")
  .action(addCommand);

// 删除模块命令
program
  .command("delete")
  .alias("d")
  .description("Delete a module")
  .argument("[moduleName]", "Module name to delete")
  .action(deleteCommand);

// 添加环境命令
program
  .command("addEnv")
  .alias("ae")
  .description("Add a new environment to a module")
  .action(addEnvCommand);

// 删除环境命令
program
  .command("deleteEnv")
  .alias("de")
  .description("Delete an environment from a module")
  .action(deleteEnvCommand);

// 列表查询命令
program
  .command("list")
  .alias("ls")
  .description("List all modules")
  .action(listCommand);

// 配置修改命令
program
  .command("config")
  .alias("c")
  .description("Modify module configuration")
  .action(configCommand);

// 可视化UI命令 - 暂时注释，以后实现
// program
//   .command("ui")
//   .description("Start UI server for module management")
//   .action(uiCommand);

// 初始化配置命令
program
  .command("init")
  .alias("i")
  .description("Initialize CLI configuration file with smart IDE hints")
  .action(initCommand);

program.parse(process.argv);
