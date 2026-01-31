# Vite Plugin Modular 需求文档

## 核心需求

### 1. 源码路径统一管理
- 所有模块的源码路径必须都在 `src/modules/` 下
- 只支持用户自定义子路径
- `modular.config.json` 中 `sourceDir` 配置项只需要记录 `src/modules/` 之后的子路径
- 插件内部自动拼接完整路径：`src/modules/${module.sourceDir}`
- 完整入口路径拼接规则：`src/modules/${module.sourceDir}/${module.entry}`
- 源码路径唯一性校验，确保没有被其他模块使用

### 2. 配置简化
- `modular.config.json` 中 `sourceDir` 配置项只需要记录 `src/modules/` 之后的子路径
- 插件内部自动拼接完整路径
- 移除 `envDir` 配置项，所有模块共用 `env` 目录

### 3. 环境变量管理
- 所有 env 文件存放在 `env` 目录下
- 命名规则：`env/.env.[模块名]-[环境名]`
- 自动注入 `VITE_MODULE_NAME`
- 将 `moduleConfig.define` 中的环境变量 key 转换为 SNAKE_CASE 格式
- 以 `import.meta.env.VITE_[SNAKE_CASE_KEY]` 格式注入环境变量

### 4. 多模块支持
- 通过 `vite --mode` 解析启动/编译的模块
- mode 命名规则：`[模块名]-[环境名]`
- 模块之间相互独立
- 复用代码存放在 `src` 目录下
- 构建输出目录为 `dist` 目录下各自独立的子目录，支持用户自定义

### 5. CLI 工具功能
- 创建模块
- 删除模块
- 新增环境
- 删除环境
- 列表查询
- 配置修改
- 可视化 UI 界面
- CLI 配置文件支持：`vmod.config.[json/js]`
- 支持模块模板目录配置
- 自动获取项目代码缩进量

### 6. 插件功能
- 解析 mode 参数
- 替换页面标题和入口 JS
- 注入环境变量
- 支持 env 目录配置
- 源码路径唯一性校验
- 配置构建输出目录

## 新增需求

1. **CLI 配置文件支持**：支持 `vmod.config.[js/json]` 配置文件，用于配置 CLI 工具的行为
2. **模块模板支持**：支持用户设置模块模板目录，创建新模块时若模板目录存在，则拷贝模板文件至新模块中
3. **JSON 缩进量自动适配**：默认自动获取项目中的代码缩进量，可选手动配置
