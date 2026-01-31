import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { ModularConfig, PackageJson } from "../types";

// 获取模块化配置文件路径
export function getModularConfigPath(): string {
  return join(process.cwd(), ".modular.config.jsonc");
}

// 获取package.json文件路径
export function getPackageJsonPath(): string {
  return join(process.cwd(), "package.json");
}

// 获取CLI配置文件路径
export function getCliConfigPath(): { json: string; js: string } {
  return {
    json: join(process.cwd(), "vmod.config.json"),
    js: join(process.cwd(), "vmod.config.js"),
  };
}

// CLI配置接口
export interface CliConfig {
  templateDir?: string;
  jsonIndent?: number;
}

// 查找模板目录中的入口文件
export function findTemplateEntryFile(templateDir?: string): string | null {
  const dir = templateDir || "templates";
  const templateDirPath = join(process.cwd(), dir);

  if (existsSync(templateDirPath)) {
    try {
      const templateFiles = readdirSync(templateDirPath);

      // 查找可能为入口的文件（index/main/app 等）
      const entryFiles = templateFiles.filter((file: string) => {
        const fileName = file.split(".")[0];
        return [
          "index",
          "main",
          "app",
          "entry",
          "bootstrap",
          "init",
          "start",
        ].includes(fileName);
      });

      if (entryFiles.length > 0) {
        // 返回第一个找到的入口文件的完整名称
        return entryFiles[0];
      }
    } catch (error) {
      console.warn(`读取模板目录失败: ${(error as Error).message}`);
    }
  }

  return null;
}

// 复制模板目录中的文件到模块目录
export function copyTemplateFiles(
  templateDir?: string,
  sourceDir?: string,
): string[] {
  const dir = templateDir || "templates";
  const templateDirPath = join(process.cwd(), dir);
  const moduleDirPath = join(process.cwd(), `src/modules/${sourceDir}`);
  const copiedFiles: string[] = [];

  if (existsSync(templateDirPath) && existsSync(moduleDirPath)) {
    try {
      copyRecursive(templateDirPath, moduleDirPath, copiedFiles);
    } catch (error) {
      console.warn(`复制模板文件失败: ${(error as Error).message}`);
    }
  }

  return copiedFiles;
}

// 递归复制目录内容
function copyRecursive(src: string, dest: string, copiedFiles: string[]): void {
  const fs = require("fs");

  // 检查源路径是否存在
  if (!existsSync(src)) return;

  // 检查是否为目录
  const isDirectory = fs.lstatSync(src).isDirectory();

  if (isDirectory) {
    // 如果目标目录不存在，创建它
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    // 读取目录中的文件
    const files = readdirSync(src);
    files.forEach((file: string) => {
      const srcPath = join(src, file);
      const destPath = join(dest, file);
      copyRecursive(srcPath, destPath, copiedFiles);
    });
  } else {
    // 复制文件
    const content = readFileSync(src, "utf8");
    writeFileSync(dest, content, "utf8");
    copiedFiles.push(src.split("/").pop() || "");
  }
}

// 加载CLI配置
export function loadCliConfig(): CliConfig {
  const configPaths = getCliConfigPath();

  // 尝试加载JSON配置文件
  if (existsSync(configPaths.json)) {
    const content = readFileSync(configPaths.json, "utf8");
    return JSON.parse(content);
  }

  // 尝试加载JS配置文件
  if (existsSync(configPaths.js)) {
    // 在ESM环境中使用静态方式加载JS配置，确保兼容
    try {
      // 使用readFileSync读取文件内容，避免使用require

      // 简单处理JS配置文件，假设它导出一个对象
      // 注意：这种方式可能不支持所有复杂的JS配置
      return {};
    } catch (error) {
      console.warn(`无法加载JS配置文件: ${configPaths.js}，使用默认配置`);
      return {};
    }
  }

  return {};
}

// 加载模块化配置
export function loadModularConfig(): ModularConfig {
  const configPath = getModularConfigPath();
  if (existsSync(configPath)) {
    let content = readFileSync(configPath, "utf8");
    // 移除注释行，只保留有效的 JSON 内容
    content = content
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
    return JSON.parse(content);
  }
  return {};
}

// 从package.json获取代码缩进量
export function getProjectIndent(): number {
  const packageJsonPath = getPackageJsonPath();
  if (existsSync(packageJsonPath)) {
    const content = readFileSync(packageJsonPath, "utf8");

    // 尝试从package.json的缩进推断
    const indentMatch = content.match(/^\s+/m);
    if (indentMatch) {
      const indent = indentMatch[0];
      // 优先检查制表符
      if (indent.includes("\t")) {
        return 1; // 制表符缩进
      }
      return indent.length; // 空格缩进长度
    }
  }
  return 2; // 默认缩进
}

// 保存模块化配置
export function saveModularConfig(
  config: ModularConfig,
  indent?: number,
): void {
  const configPath = getModularConfigPath();
  const jsonIndent = indent !== undefined ? indent : getProjectIndent();
  // 添加警告注释，告知用户不要手动修改
  const warningComment = `// ⚠️  警告：此文件由 Vite Plugin Modular CLI 自动生成，请勿手动修改
// ⚠️  手动修改可能导致配置失效或功能异常
// ⚠️  请使用 vmod config 命令来修改模块配置

`;
  writeFileSync(
    configPath,
    warningComment + JSON.stringify(config, null, jsonIndent),
    "utf8",
  );
}

// 加载package.json
export function loadPackageJson(): PackageJson {
  const packagePath = getPackageJsonPath();
  if (existsSync(packagePath)) {
    const content = readFileSync(packagePath, "utf8");
    return JSON.parse(content);
  }
  return { scripts: {} };
}

// 保存package.json
export function savePackageJson(
  packageJson: PackageJson,
  indent?: number,
): void {
  const packagePath = getPackageJsonPath();
  const jsonIndent = indent !== undefined ? indent : getProjectIndent();
  writeFileSync(
    packagePath,
    JSON.stringify(packageJson, null, jsonIndent),
    "utf8",
  );
}

// 创建env文件
export function createEnvFile(moduleName: string, envName: string): void {
  const envDir = join(process.cwd(), "env");
  if (!existsSync(envDir)) {
    mkdirSync(envDir, { recursive: true });
  }
  const envPath = join(envDir, `.env.${moduleName}-${envName}`);
  writeFileSync(
    envPath,
    "# Environment variables for module: " +
      moduleName +
      ", env: " +
      envName +
      "\n",
    "utf8",
  );
}

// 删除env文件
export function deleteEnvFile(moduleName: string, envName: string): void {
  const envPath = join(process.cwd(), "env", `.env.${moduleName}-${envName}`);
  if (existsSync(envPath)) {
    rmSync(envPath);
  }
}

// 创建模块目录
export function createModuleDir(sourceDir: string): void {
  const fullSourceDir = join(process.cwd(), `src/modules/${sourceDir}`);
  mkdirSync(fullSourceDir, { recursive: true });
}

// 删除模块目录
export function deleteModuleDir(sourceDir: string): void {
  const fullSourceDir = join(process.cwd(), `src/modules/${sourceDir}`);
  if (existsSync(fullSourceDir)) {
    rmSync(fullSourceDir, { recursive: true, force: true });
  }
}

// 创建入口文件
export function createEntryFile(sourceDir: string, entry: string): void {
  const entryPath = join(process.cwd(), `src/modules/${sourceDir}/${entry}`);
  if (!existsSync(entryPath)) {
    // 尝试从模板目录加载模板
    const cliConfig = loadCliConfig();
    const templateDir = cliConfig.templateDir || "templates";
    const templatePath = join(
      process.cwd(),
      templateDir,
      `module.template.${entry.split(".").pop()}`,
    );

    let content = '// Module entry file\nconsole.log("Module loaded");\n';

    // 检查模板文件是否存在
    if (existsSync(templatePath)) {
      content = readFileSync(templatePath, "utf8");
      console.log(`📋 已从模板目录加载入口文件模板: ${templatePath}`);
    }

    writeFileSync(entryPath, content, "utf8");
  }
}

// 检查源码路径是否可用
export function isSourceDirAvailable(
  sourceDir: string,
  currentModuleName: string,
  config: ModularConfig,
): boolean {
  for (const [moduleName, moduleConfig] of Object.entries(config)) {
    if (
      moduleName !== currentModuleName &&
      moduleConfig.sourceDir === sourceDir
    ) {
      return false;
    }
  }
  return true;
}

// 将字符串转换为蛇形命名
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/\./g, "_")
    .toLowerCase()
    .replace(/^_/, "");
}

// 获取完整的源码路径
export function getFullSourceDir(sourceDir: string): string {
  return `src/modules/${sourceDir}`;
}

// 获取完整的入口路径
export function getFullEntryPath(sourceDir: string, entry: string): string {
  return `${getFullSourceDir(sourceDir)}/${entry}`;
}

// 标记默认环境的环境列表
export function getEnvironmentChoices(
  environments: string[],
): Array<{ name: string; value: string; disabled: boolean }> {
  return environments.map((env) => {
    const isDefault = env === "dev" || env === "prod";
    return {
      name: isDefault ? `${env} (默认环境，不可删除)` : env,
      value: env,
      disabled: isDefault,
    };
  });
}

export * from "./logger";
