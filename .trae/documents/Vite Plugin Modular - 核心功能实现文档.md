# Vite Plugin Modular 核心功能实现文档

## 1. 路径拼接函数

### 1.1 完整源码路径拼接
```typescript
/**
 * 拼接完整的源码路径
 * @param sourceDir 模块的 sourceDir 配置（只包含 src/modules/ 之后的子路径）
 * @returns 完整的源码路径
 */
function getFullSourceDir(sourceDir: string): string {
  return `src/modules/${sourceDir}`;
}
```

### 1.2 完整入口路径拼接
```typescript
/**
 * 拼接完整的入口路径
 * @param sourceDir 模块的 sourceDir 配置
 * @param entry 模块的 entry 配置
 * @returns 完整的入口路径
 */
function getFullEntryPath(sourceDir: string, entry: string): string {
  return `${getFullSourceDir(sourceDir)}/${entry}`;
}
```

## 2. 源码路径校验

### 2.1 源码路径唯一性校验
```typescript
/**
 * 校验模块的源码路径是否已被其他模块使用
 * @param sourceDir 要校验的源码路径（只包含 src/modules/ 之后的子路径）
 * @param currentModuleName 当前模块名（用于排除自身）
 * @param config 当前配置
 * @returns boolean 是否可以使用该源码路径
 */
function isSourceDirAvailable(sourceDir: string, currentModuleName: string, config: ModularConfig): boolean {
  for (const [moduleName, moduleConfig] of Object.entries(config)) {
    if (moduleName !== currentModuleName && moduleConfig.sourceDir === sourceDir) {
      return false;
    }
  }
  return true;
}
```

## 3. 环境变量注入逻辑

### 3.1 环境变量注入实现
```typescript
// 自动注入 VITE_MODULE_NAME
config.env.VITE_MODULE_NAME = moduleName;

// 将 define 对象中的环境变量转换为 SNAKE_CASE 格式，然后注入为 import.meta.env.VITE_XXX
if (moduleConfig.define) {
  for (const [key, value] of Object.entries(moduleConfig.define)) {
    // 转换为 SNAKE_CASE 格式
    const snakeCaseKey = toSnakeCase(key);
    
    // 转换为 VITE_ 前缀的格式
    config.define[`import.meta.env.VITE_${snakeCaseKey}`] = JSON.stringify(value);
  }
}
```

### 3.2 SNAKE_CASE 转换函数
```typescript
/**
 * 将字符串转换为蛇形命名
 * @param str 输入字符串
 * @returns 蛇形命名字符串
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/\./g, '_')
    .toLowerCase()
    .replace(/^_/, '');
}
```

## 4. CLI配置文件加载

### 4.1 CLI配置接口
```typescript
// CLI配置接口
export interface CliConfig {
  templateDir?: string;
  jsonIndent?: number;
}
```

### 4.2 自动获取项目缩进量
```typescript
/**
 * 从package.json获取代码缩进量
 * @returns number 缩进量，默认为2
 */
function getProjectIndent(): number {
  const packageJsonPath = getPackageJsonPath();
  if (existsSync(packageJsonPath)) {
    const content = readFileSync(packageJsonPath, 'utf8');
    
    // 尝试从package.json的缩进推断
    const indentMatch = content.match(/^\s+/m);
    if (indentMatch) {
      const indent = indentMatch[0];
      // 优先检查制表符
      if (indent.includes('\t')) {
        return 1; // 制表符缩进
      }
      return indent.length; // 空格缩进长度
    }
  }
  return 2; // 默认缩进
}
```

### 4.3 加载CLI配置
```typescript
/**
 * 加载CLI配置文件
 * @returns CliConfig CLI配置对象
 */
function loadCliConfig(): CliConfig {
  const configPath = join(process.cwd(), 'vmod.config.json');
  let config: CliConfig = {};
  
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8');
    config = JSON.parse(content);
  } else {
    // 尝试加载vmod.config.js
    const jsConfigPath = join(process.cwd(), 'vmod.config.js');
    if (existsSync(jsConfigPath)) {
      // 动态导入JS配置文件
      return require(jsConfigPath);
    }
  }
  
  // 如果没有指定jsonIndent，自动获取项目缩进
  if (config.jsonIndent === undefined) {
    config.jsonIndent = getProjectIndent();
  }
  
  return config;
}
```

## 5. 模块模板拷贝

### 5.1 模板文件拷贝函数
```typescript
/**
 * 拷贝模板文件到模块目录
 * @param templateDir 模板目录路径
 * @param targetDir 目标模块目录路径
 */
function copyTemplateFiles(templateDir: string, targetDir: string): void {
  if (!existsSync(templateDir)) {
    return;
  }
  
  // 读取模板目录中的所有文件
  const files = readdirSync(templateDir, { withFileTypes: true });
  
  for (const file of files) {
    const sourcePath = join(templateDir, file.name);
    const targetPath = join(targetDir, file.name);
    
    if (file.isDirectory()) {
      // 递归创建子目录并拷贝文件
      mkdirSync(targetPath, { recursive: true });
      copyTemplateFiles(sourcePath, targetPath);
    } else {
      // 拷贝文件
      copyFileSync(sourcePath, targetPath);
    }
  }
}
```

## 6. 配置文件管理

### 6.1 保存模块化配置
```typescript
/**
 * 保存模块化配置
 * @param config 模块化配置对象
 * @param indent 缩进量，可选，默认自动获取项目缩进量
 */
export function saveModularConfig(config: ModularConfig, indent?: number): void {
  const configPath = getModularConfigPath();
  const jsonIndent = indent !== undefined ? indent : getProjectIndent();
  writeFileSync(configPath, JSON.stringify(config, null, jsonIndent), 'utf8');
}
```

### 6.2 保存package.json
```typescript
/**
 * 保存package.json
 * @param packageJson package.json对象
 * @param indent 缩进量，可选，默认自动获取项目缩进量
 */
export function savePackageJson(packageJson: PackageJson, indent?: number): void {
  const packagePath = getPackageJsonPath();
  const jsonIndent = indent !== undefined ? indent : getProjectIndent();
  writeFileSync(packagePath, JSON.stringify(packageJson, null, jsonIndent), 'utf8');
}
```

## 7. 核心插件功能

### 7.1 模式解析
- 从 Vite 配置的 `mode` 中提取模块名和环境名
- 模式格式：`[moduleName]-[envName]`，如 `module1-dev`
- 支持从环境变量中读取模式

### 7.2 配置加载
- 自动生成和加载项目根目录下的 `modular.config.[js/json]`
- 解析当前模式对应的模块配置
- 验证模块和环境是否存在

### 7.3 源码路径校验
- 在插件初始化阶段，校验所有模块的 `sourceDir` 是否唯一
- 如果发现重复的 `sourceDir`，抛出错误，提示用户修改配置

### 7.4 入口路径解析
- 插件内部自动拼接完整入口路径：`src/modules/${module.sourceDir}/${module.entry}`

### 7.5 HTML转换
- 替换HTML页面标题为配置的 `title`
- 替换入口JS脚本为完整的入口路径

### 7.6 构建配置
- 动态配置 `build.outDir` 为 `dist/[module.outputDir]`
- 支持用户自定义输出目录

### 7.7 环境变量配置
- 配置 `envDir` 为固定值 `env`（所有模块共用）
- 配置 `envPrefix` 为 `VITE_`
- 注入环境变量：`VITE_MODULE_NAME` 和 `moduleConfig.define` 中的环境变量
- 加载对应环境的 env 文件：`env/.env.[moduleName]-[envName]`
