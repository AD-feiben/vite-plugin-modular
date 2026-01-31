# Vite Plugin Modular 实现方案

## 需求确认

根据用户最新反馈，进一步调整实现方案：

### 核心修改
1. **源码路径统一前缀**：所有模块的源码路径必须都在 `src/modules/` 下，只支持用户自定义子路径
2. **配置简化**：`modular.config.json` 中 `sourceDir` 配置项只需要记录 `src/modules/` 之后的子路径，插件内部自动拼接完整路径
3. **源码路径校验**：仍然需要校验模块的源码路径，确保没有被其他模块使用
4. **自动拼接路径**：插件内部自动拼接完整的源码路径：`src/modules/${module.sourceDir}`
5. **完整入口路径**：完整入口路径拼接规则：`src/modules/${module.sourceDir}/${module.entry}`

### 其他需求保持不变
1. 通过 `vite --mode` 解析启动/编译的模块，mode 命名规则：`[模块名]-[环境名]`
2. 模块之间相互独立，复用代码存放在 `src` 目录下
3. 构建输出目录为 `dist` 目录下各自独立的子目录，支持用户自定义
4. CLI 工具功能：创建模块、删除模块、新增环境、删除环境、列表查询、配置修改、可视化 UI 界面
5. 插件功能：解析 mode 参数、替换页面标题和入口 JS、注入环境变量、支持 env 目录配置
6. 环境变量文件管理：所有 env 文件存放在 `env` 目录下，命名规则：`env/.env.[模块名]-[环境名]`
7. 注入环境变量：自动注入 `VITE_MODULE_NAME`，将 `moduleConfig.define` 中的环境变量 key 转换为 SNAKE_CASE 格式，然后以 `import.meta.env.VITE_[SNAKE_CASE_KEY]` 格式注入

### 新增需求
1. **CLI 配置文件支持**：支持 `vmod.config.[js/json]` 配置文件，用于配置 CLI 工具的行为
2. **模块模板支持**：支持用户设置模块模板目录，创建新模块时若模块目录存在，则拷贝模板文件至新模块中

## 实现方案

### 1. 配置文件结构

#### 1.1 主配置文件：modular.config.json

```json
// modular.config.json (项目根目录，自动生成)
{
  "module1": {
    "title": "Module 1",
    "sourceDir": "module1", // 只记录 src/modules/ 之后的子路径
    "entry": "main.ts",
    "outputDir": "module1",
    "environments": ["dev", "prod", "test"],
    "commands": ["serve:module1", "build:module1", "build:module1-test"],
    "define": {
      "apiUrl": "https://api.example.com",
      "debugMode": true
    }
  },
  "module2": {
    "title": "Module 2",
    "sourceDir": "custom/module2", // 支持多级子路径
    "entry": "index.js",
    "outputDir": "custom-module2",
    "environments": ["dev", "prod"],
    "commands": ["serve:module2", "build:module2"],
    "define": {
      "apiUrl": "https://api.example2.com"
    }
  }
}
```

#### 1.2 CLI配置文件：vmod.config.json

```json
// vmod.config.json (项目根目录，可选，用户可自定义)
{
  "templateDir": "templates", // 模块模板目录，相对路径
  "jsonIndent": 2 // JSON缩进量，可选，默认自动获取项目中的代码缩进量
}
```

### 2. 核心功能实现

#### 2.1 路径拼接函数

```typescript
/**
 * 拼接完整的源码路径
 * @param sourceDir 模块的 sourceDir 配置（只包含 src/modules/ 之后的子路径）
 * @returns 完整的源码路径
 */
function getFullSourceDir(sourceDir: string): string {
  return `src/modules/${sourceDir}`;
}

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

#### 2.2 源码路径校验

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

#### 2.3 环境变量注入逻辑

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

#### 2.4 CLI配置文件加载

```typescript
// CLI配置文件接口
interface CliConfig {
  templateDir?: string;
  jsonIndent?: number;
}

/**
 * 从package.json获取代码缩进量
 * @returns number 缩进量，默认为2
 */
function getProjectIndent(): number {
  const packageJsonPath = join(process.cwd(), 'package.json');
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
      config = require(jsConfigPath);
    }
  }
  
  // 如果没有指定jsonIndent，自动获取项目缩进
  if (config.jsonIndent === undefined) {
    config.jsonIndent = getProjectIndent();
  }
  
  return config;
}
```

#### 2.5 模块模板拷贝

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

### 3. 核心插件功能

#### 3.1 模式解析

* 从 Vite 配置的 `mode` 中提取模块名和环境名

* 模式格式：`[moduleName]-[envName]`，如 `module1-dev`

* 支持从环境变量中读取模式

#### 3.2 配置加载

* 自动生成和加载项目根目录下的 `modular.config.[js/json]`

* 解析当前模式对应的模块配置

* 验证模块和环境是否存在

#### 3.3 源码路径校验

* 在插件初始化阶段，校验所有模块的 `sourceDir` 是否唯一

* 如果发现重复的 `sourceDir`，抛出错误，提示用户修改配置

* 错误示例：
  ```
  Error: Source directory "module1" is already used by module "module1"
  Please use a different source directory for module "module2"
  ```

#### 3.4 入口路径解析

* 插件内部自动拼接完整入口路径：`src/modules/${module.sourceDir}/${module.entry}`

* 例如：
  - `src/modules/module1/main.ts`
  - `src/modules/custom/module2/index.js`

#### 3.5 HTML转换

* 替换HTML页面标题为配置的 `title`

* 替换入口JS脚本为完整的入口路径

#### 3.6 构建配置

* 动态配置 `build.outDir` 为 `dist/[module.outputDir]`

* 支持用户自定义输出目录

#### 3.7 环境变量配置

* 配置 `envDir` 为固定值 `env`（所有模块共用）

* 配置 `envPrefix` 为 `VITE_`

* 注入环境变量：
  * 自动注入 `VITE_MODULE_NAME`
  * 将 `moduleConfig.define` 中的环境变量 key 转换为 SNAKE_CASE 格式，然后以 `import.meta.env.VITE_[SNAKE_CASE_KEY]` 格式注入

* 加载对应环境的 env 文件：`env/.env.[moduleName]-[envName]`

### 4. CLI工具开发（vmod）

* 实现CLI入口和命令解析

* 实现 `add` 命令：
  - 交互式模块创建，带重复校验
  - 加载 CLI 配置文件，获取模板目录和JSON缩进配置
  - 询问模块名称，带重复校验
  - 询问模块标题
  - 询问源码路径，默认 `[模块名]`（只包含 src/modules/ 之后的子路径），带唯一性校验
  - 询问入口文件，默认 `main.ts`
  - 询问输出目录，默认模块名
  - 自动添加dev和prod默认环境
  - 循环询问额外环境名，展示已确认的环境列表
  - 生成所有环境的 env 文件到 `env` 目录，命名规则：`.env.[模块名]-[环境名]`
  - 自动添加相关命令
  - 根据拼接后的完整源码路径创建模块目录
  - 若 CLI 配置中指定了模板目录且模板目录存在，则拷贝模板文件到新模块目录中

* 实现 `delete` 命令：
  - 支持直接指定模块名
  - 支持列表选择
  - 自动清理相关命令、目录和所有 env 文件（`.env.[模块名]-[环境名]`）
  - 根据拼接后的完整源码路径删除模块目录

* 实现 `addEnv` 命令：
  - 模块选择
  - 循环输入新环境名，展示当前环境列表
  - 严格的环境名校验
  - 生成对应的 env 文件到 `env` 目录，命名规则：`.env.[模块名]-[环境名]`
  - 自动添加相关命令

* 实现 `deleteEnv` 命令：
  - 模块选择
  - 显示当前环境列表，标记默认环境
  - 禁用默认环境的选择
  - 删除对应的 env 文件（`.env.[模块名]-[环境名]`）
  - 自动清理相关命令

* 实现 `list` 命令：
  - 表格展示模块信息，包含源码路径（只显示子路径）、完整源码路径、入口文件、输出目录、环境列表等
  - 标记默认环境
  - 支持过滤和排序

* 实现 `config` 命令：
  - 交互式配置修改
  - 支持修改模块标题、源码路径（只修改子路径，插件自动拼接完整路径）、入口文件、输出目录
  - 修改源码路径时进行唯一性校验
  - 支持环境管理，默认环境不可删除
  - 支持添加/删除共享环境变量

* 实现 `ui` 命令：
  - 启动Web服务器
  - 提供可视化管理界面
  - 支持模块管理
  - 支持环境管理
  - 支持配置修改

### 5. 项目结构

```
├── src/                      # 源码根目录
│   ├── modules/              # 固定的模块根目录
│   │   ├── module1/          # 模块1的源码目录（完整路径：src/modules/module1）
│   │   │   └── main.ts       # 模块1的入口文件
│   │   └── custom/           # 自定义子目录
│   │       └── module2/      # 模块2的源码目录（完整路径：src/modules/custom/module2）
│   │           └── index.js   # 模块2的入口文件
│   └── components/           # 共享组件目录
├── env/                      # 环境变量目录（所有模块共用）
│   ├── .env.module1-dev       # 模块1开发环境变量
│   ├── .env.module1-prod      # 模块1生产环境变量
│   ├── .env.module1-test      # 模块1测试环境变量
│   ├── .env.module2-dev       # 模块2开发环境变量
│   └── .env.module2-prod      # 模块2生产环境变量
├── templates/                 # 模板目录
│   └── module/               # 模块模板目录
│       ├── main.ts           # 模板入口文件
│       ├── style.css         # 模板样式文件
│       └── README.md         # 模板说明文件
├── modular.config.json       # 模块配置文件（自动生成）
├── vmod.config.json          # CLI配置文件（可选）
└── package.json              # 项目配置
```

### 6. 实现步骤

1. **插件核心功能实现**

   * 调整插件代码，解析mode参数

   * 加载配置文件

   * 实现源码路径唯一性校验，只校验 `sourceDir` 配置

   * 实现路径拼接函数，自动拼接完整的源码路径和入口路径

   * 实现HTML标题和入口JS替换

   * 配置构建输出目录

   * 实现环境变量配置：
     - 配置 `envDir` 为固定值 `env`
     - 配置 `envPrefix` 为 `VITE_`
     - 注入环境变量 `VITE_MODULE_NAME`
     - 实现 `toSnakeCase` 转换函数
     - 将 `moduleConfig.define` 中的环境变量 key 转换为 SNAKE_CASE 格式，然后以 `import.meta.env.VITE_[SNAKE_CASE_KEY]` 格式注入

2. **配置文件管理**

   * 实现主配置文件的自动生成，每个模块包含 `sourceDir` 配置，只记录子路径

   * 确保默认环境dev和prod自动添加到配置中

   * 支持使用 `define` 对象配置所有环境共享的环境变量

   * 移除 `envDir` 配置项，所有模块共用 `env` 目录

3. **环境变量文件管理**

   * 实现环境变量文件的自动生成，所有文件存放在 `env` 目录下，命名规则：`.env.[模块名]-[环境名]`

   * 确保每个模块的每个环境都有对应的 env 文件

   * 实现 env 文件的自动清理，包括 `.env.[模块名]-[环境名]`

4. **CLI工具开发（vmod）**

   * 实现CLI入口和命令解析

   * 实现CLI配置文件加载功能，支持 `vmod.config.[json/js]` 格式

   * 实现模块模板拷贝功能，根据CLI配置中的 `templateDir` 拷贝模板文件

   * 实现完整的交互式命令行界面，包含所有命令

   * 实现源码路径唯一性校验

   * 实现路径拼接，自动创建/删除模块目录

   * 实现环境变量文件的自动生成和清理

5. **示例项目更新**

   * 更新示例项目结构，添加 CLI 配置文件和模板目录

   * 添加配置文件，包含 `sourceDir` 配置，只记录子路径

   * 添加环境变量文件

   * 添加模块模板文件

   * 测试各种功能场景

### 7. 预期效果

1. **源码路径统一管理**

   * 所有模块的源码路径都在 `src/modules/` 下，实现统一管理
   * 配置文件中只记录子路径，配置更简洁
   * 插件自动拼接完整路径，减少用户配置错误
   * 源码路径唯一性校验，避免模块冲突

2. **环境变量注入**

   * 输入配置：
     ```json
     {
       "define": {
         "apiUrl": "https://api.example.com",
         "debugMode": true,
         "userInfo.name": "admin"
       }
     }
     ```

   * 输出注入：
     ```javascript
     // 注入到全局环境中
     import.meta.env.VITE_API_URL = "https://api.example.com";
     import.meta.env.VITE_DEBUG_MODE = "true";
     import.meta.env.VITE_USER_INFO_NAME = "admin";
     ```

3. **开发体验**

   * `npm run serve:module1` 启动module1开发环境，自动加载模块配置和环境变量

   * `npm run build:module1` 构建module1生产版本，输出到 `dist/module1`

   * 自动替换页面标题和入口JS

   * 构建输出到配置的目录

4. **CLI交互**

   * 命令简短易记，使用 `vmod` 命令

   * 完整的交互式命令行界面

   * 清晰的环境列表展示，标记默认环境

   * 默认环境不可删除，避免误操作

   * 源码路径唯一性校验，避免模块冲突

5. **配置简化**

   * 配置文件自动生成，无需手动创建

   * 默认环境自动添加，减少用户操作

   * 环境变量使用 `define` 对象，所有环境共享，配置更简洁

   * 所有模块共用一个 env 目录，配置更简单

   * 源码路径配置更简洁，只记录子路径

6. **自动化维护**

   * 新增模块自动生成相关命令和环境变量文件

   * 删除模块自动清理相关命令、目录和环境变量文件

   * 新增环境自动生成对应的环境变量文件和命令

   * 删除环境自动清理对应的环境变量文件和命令

   * 配置文件与package.json保持同步

7. **CLI配置文件支持**

   * 支持 `vmod.config.json` 和 `vmod.config.js` 两种配置格式
   * 可以设置模块模板目录，实现模块的快速创建
   * 支持配置JSON缩进量，默认自动从项目中获取代码缩进量
   * 配置文件自动加载，无需手动指定

8. **模块模板功能**

   * 支持自定义模块模板，包含完整的文件结构
   * 创建新模块时自动拷贝模板文件到模块目录
   * 模板文件可以包含入口文件、样式文件、README等
   * 支持多级目录结构的模板
   * 提高模块创建效率，保证模块结构一致性

## 注意事项

1. 确保默认环境dev和prod在所有模块中都存在

2. 所有环境相关操作都要检查并排除默认环境

3. CLI交互中要清晰标记默认环境

4. 环境变量注入时要正确处理不同数据类型，确保所有环境变量都以 `VITE_` 前缀注入

5. 支持多种入口文件类型（.ts, .js, .jsx, .tsx等）

6. 确保跨平台兼容性

7. 提供清晰的错误提示和帮助信息

8. 支持命令缩写和别名

9. 可视化UI界面要与CLI功能保持一致

10. 定期备份配置文件，避免误操作导致数据丢失

11. 支持模块模板机制，方便用户快速创建模块

12. 确保插件与Vite 5.x版本兼容

13. 支持TypeScript类型定义

14. 提供完整的文档和示例