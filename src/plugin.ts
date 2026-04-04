import { Plugin } from "vite";
import { readFileSync } from "fs";
import { join } from "path";
import { defineVmodConfig } from "./config";

// 模块配置接口
interface ModuleConfig {
  name: string;
  sourceDir: string;
  entry: string;
  title: string;
  outputDir: string;
  environments: string[];
  define: Record<string, any>;
  base: string;
}

// 模块化配置接口
type ModularConfig = Record<string, ModuleConfig>;

// SNAKE_CASE 转换函数
function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-. ]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toUpperCase();
}

// 拼接完整的源码路径
function getFullSourceDir(sourceDir: string): string {
  return `src/modules/${sourceDir}`;
}

// 拼接完整的入口路径
function getFullEntryPath(sourceDir: string, entry: string): string {
  return `${getFullSourceDir(sourceDir)}/${entry}`;
}

// 模式解析函数
function parseMode(
  mode: string,
  moduleNames: string[],
): { moduleName: string | null; envName: string | null } {
  const sortedNames = [...moduleNames].sort((a, b) => b.length - a.length);

  for (const name of sortedNames) {
    if (mode.startsWith(name + ":")) {
      return {
        moduleName: name,
        envName: mode.substring(name.length + 1),
      };
    }
  }

  return parseModeLegacy(mode, moduleNames);
}

// 兼容老版本 `-` 分隔符
function parseModeLegacy(
  mode: string,
  moduleNames: string[],
): { moduleName: string | null; envName: string | null } {
  const sortedNames = [...moduleNames].sort((a, b) => b.length - a.length);
  for (const name of sortedNames) {
    if (mode.startsWith(name + "-")) {
      return {
        moduleName: name,
        envName: mode.substring(name.length + 1),
      };
    }
  }
  return { moduleName: null, envName: null };
}

// 加载模块化配置
function loadModularConfig(root: string): ModularConfig {
  const configPath = join(root, ".modular.config.jsonc");
  try {
    let content = readFileSync(configPath, "utf8");
    // 移除注释行，只保留有效的 JSON 内容
    content = content
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load .modular.config.jsonc:", error);
    return {};
  }
}

// 源码路径唯一性校验
function validateSourceDirs(config: ModularConfig): void {
  const sourceDirs = new Set<string>();
  for (const moduleConfig of Object.values(config)) {
    if (sourceDirs.has(moduleConfig.sourceDir)) {
      throw new Error(
        `Source directory "${moduleConfig.sourceDir}" is already used by another module`,
      );
    }
    sourceDirs.add(moduleConfig.sourceDir);
  }
}

export default function VitePluginModular(): Plugin {
  let currentModule: ModuleConfig | null = null;

  return {
    name: "@ad-feiben/vite-plugin-modular",

    config(config, env) {
      // 加载模块化配置
      const modularConfig = loadModularConfig(config.root || process.cwd());

      // 校验源码路径唯一性
      validateSourceDirs(modularConfig);

      // 解析模式
      const moduleNames = Object.keys(modularConfig);
      const { moduleName } = parseMode(env.mode, moduleNames);

      // 获取当前模块配置
      if (!moduleName) {
        console.warn(
          "Mode format is invalid, expected: [moduleName]:[envName] or [moduleName]-[envName]",
        );
        return config;
      }

      currentModule = modularConfig[moduleName];
      if (!currentModule) {
        console.warn(
          `Module "${moduleName}" not found in .modular.config.jsonc`,
        );
        return config;
      }

      // 配置环境变量目录
      // 获取用户的 outDir 配置，默认为 "dist"
      const userOutDir = config.build?.outDir || "dist";
      const moduleBase = currentModule.base || "/";
      const base = moduleBase.startsWith("/") ? moduleBase : `/${moduleBase}`;
      const updatedConfig = {
        ...config,
        base: base,
        envDir: "env",
        build: {
          ...config.build,
          outDir: `${userOutDir}/${currentModule.outputDir}`,
        },
        define: {
          ...config.define,
          "import.meta.env.VITE_MODULE_NAME": JSON.stringify(moduleName),
        } as Record<string, string>,
      };

      // 注入 define 中的环境变量
      if (currentModule.define) {
        for (const [key, value] of Object.entries(currentModule.define)) {
          const snakeCaseKey = toSnakeCase(key);
          updatedConfig.define[`import.meta.env.VITE_${snakeCaseKey}`] =
            JSON.stringify(value);
        }
      }

      return updatedConfig;
    },

    transformIndexHtml(html) {
      if (!currentModule) return html;

      // 替换页面标题
      const updatedHtml = html.replace(
        /<title>([^<]*)<\/title>/,
        `<title>${currentModule.title}</title>`,
      );

      // 替换入口脚本
      const base = currentModule.base || "/";
      const processedBase = base.startsWith("/") ? base : `/${base}`;
      const normalizedBase = processedBase.endsWith("/")
        ? processedBase
        : `${processedBase}/`;
      const fullEntryPath = getFullEntryPath(
        currentModule.sourceDir,
        currentModule.entry,
      );
      const entryPathWithBase = normalizedBase + fullEntryPath;

      // 替换入口脚本，只替换非注释的本地资源
      let lastIndex = 0;
      let newHtml = "";

      // 首先替换所有非注释中的 script 标签
      const scriptRegex = /<script[^>]*src=["']([^"']*)["'][^>]*><\/script>/g;
      let match;

      while ((match = scriptRegex.exec(updatedHtml)) !== null) {
        // 检查是否在 HTML 注释中
        const beforeMatch = updatedHtml.substring(0, match.index);
        const commentBefore = beforeMatch.lastIndexOf("<!--");
        const commentAfter = beforeMatch.lastIndexOf("-->");

        // 如果不在注释中（最后一个注释结束位置在最后一个注释开始位置之前）
        if (commentBefore === -1 || commentAfter > commentBefore) {
          const src = match[1];
          // 检查是否为外部资源（以 http:// 或 https:// 开头）
          if (!src.startsWith("http://") && !src.startsWith("https://")) {
            // 检查是否为需要替换的入口文件
            if (src.includes("main.ts") || src.includes("main.js")) {
              // 替换为模块入口
              newHtml +=
                updatedHtml.substring(lastIndex, match.index) +
                `<script type="module" src="${entryPathWithBase}"></script>`;
              lastIndex = scriptRegex.lastIndex;
              continue;
            }
          }
        }

        // 不替换的情况，保持原样
        newHtml += updatedHtml.substring(lastIndex, scriptRegex.lastIndex);
        lastIndex = scriptRegex.lastIndex;
      }

      // 添加剩余部分
      newHtml += updatedHtml.substring(lastIndex);

      return newHtml;
    },
  };
}

// 导出 defineVmodConfig 函数
export { defineVmodConfig };
