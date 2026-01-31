# Vite Plugin Modular CLI工具实现文档

## 1. CLI入口和命令解析

### 1.1 入口文件结构
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { addCommand } from './commands/add';
import { deleteCommand } from './commands/delete';
import { addEnvCommand } from './commands/addEnv';
import { deleteEnvCommand } from './commands/deleteEnv';
import { listCommand } from './commands/list';
import { configCommand } from './commands/config';
import { uiCommand } from './commands/ui';

const program = new Command();

program
  .name('vmod')
  .description('Vite Plugin Modular CLI Tool')
  .version('1.0.0');

// 添加模块命令
program
  .command('add')
  .description('Add a new module')
  .action(addCommand);

// 删除模块命令
program
  .command('delete')
  .description('Delete a module')
  .argument('[moduleName]', 'Module name to delete')
  .action(deleteCommand);

// 添加环境命令
program
  .command('addEnv')
  .description('Add a new environment to a module')
  .action(addEnvCommand);

// 删除环境命令
program
  .command('deleteEnv')
  .description('Delete an environment from a module')
  .action(deleteEnvCommand);

// 列表查询命令
program
  .command('list')
  .description('List all modules')
  .action(listCommand);

// 配置修改命令
program
  .command('config')
  .description('Modify module configuration')
  .action(configCommand);

// 可视化UI命令
program
  .command('ui')
  .description('Start UI server for module management')
  .action(uiCommand);

program.parse(process.argv);
```

## 2. 命令实现

### 2.1 add 命令

#### 功能描述
创建新模块，包括配置生成、目录创建、入口文件生成和环境变量文件创建。

#### 实现逻辑
```typescript
export async function addCommand(): Promise<void> {
  try {
    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    
    // 1. 询问模块名称，带重复校验
    // 2. 询问模块标题
    // 3. 询问源码路径，默认 [模块名]，带唯一性校验
    // 4. 询问入口文件，默认 main.ts
    // 5. 询问输出目录，默认模块名
    // 6. 自动添加dev和prod默认环境
    // 7. 循环询问额外环境名，展示已确认的环境列表
    // 8. 生成所有环境的 env 文件到 env 目录
    // 9. 自动添加相关命令
    // 10. 根据拼接后的完整源码路径创建模块目录
    // 11. 若 CLI 配置中指定了模板目录且模板目录存在，则拷贝模板文件到新模块目录中
    // 12. 使用CLI配置中的jsonIndent保存配置
  } catch (error) {
    console.error('❌ 创建模块失败：', error);
  }
}
```

### 2.2 delete 命令

#### 功能描述
删除指定模块，包括配置清理、目录删除、入口文件删除和环境变量文件删除。

#### 实现逻辑
```typescript
export async function deleteCommand(moduleName?: string): Promise<void> {
  try {
    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    const modules = Object.keys(modularConfig);
    
    // 1. 如果没有提供模块名，让用户选择
    // 2. 检查模块是否存在
    // 3. 确认删除
    // 4. 删除所有环境的env文件
    // 5. 删除模块目录
    // 6. 删除package.json中的相关命令
    // 7. 删除模块化配置中的模块
    // 8. 使用CLI配置中的jsonIndent保存配置
  } catch (error) {
    console.error('❌ 删除模块失败：', error);
  }
}
```

### 2.3 addEnv 命令

#### 功能描述
为指定模块添加新环境，包括配置更新和环境变量文件创建。

#### 实现逻辑
```typescript
export async function addEnvCommand(): Promise<void> {
  try {
    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    const modules = Object.keys(modularConfig);
    
    // 1. 选择要添加环境的模块
    // 2. 循环输入新环境名
    // 3. 环境名校验
    // 4. 如果没有添加新环境，直接退出
    // 5. 更新模块配置
    // 6. 生成对应的env文件
    // 7. 添加相关命令到package.json
    // 8. 使用CLI配置中的jsonIndent保存配置
  } catch (error) {
    console.error('❌ 添加环境失败：', error);
  }
}
```

### 2.4 deleteEnv 命令

#### 功能描述
从指定模块删除环境，包括配置更新和环境变量文件删除。

#### 实现逻辑
```typescript
export async function deleteEnvCommand(): Promise<void> {
  try {
    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    const modules = Object.keys(modularConfig);
    
    // 1. 选择要删除环境的模块
    // 2. 检查是否有可删除的环境
    // 3. 显示当前环境列表，标记默认环境
    // 4. 选择要删除的环境
    // 5. 确认删除
    // 6. 删除env文件
    // 7. 更新模块配置
    // 8. 删除package.json中的相关命令
    // 9. 使用CLI配置中的jsonIndent保存配置
  } catch (error) {
    console.error('❌ 删除环境失败：', error);
  }
}
```

### 2.5 list 命令

#### 功能描述
列表展示所有模块的信息。

#### 实现逻辑
```typescript
export async function listCommand(): Promise<void> {
  try {
    const modularConfig = loadModularConfig();
    const modules = Object.values(modularConfig);
    
    // 1. 检查是否有模块
    // 2. 准备表格数据
    // 3. 输出表格
  } catch (error) {
    console.error('❌ 获取模块列表失败：', error);
  }
}
```

### 2.6 config 命令

#### 功能描述
交互式修改模块配置。

#### 实现逻辑
```typescript
export async function configCommand(): Promise<void> {
  try {
    const modularConfig = loadModularConfig();
    const cliConfig = loadCliConfig();
    const modules = Object.keys(modularConfig);
    
    // 1. 选择要修改的模块
    // 2. 配置修改菜单
    // 3. 根据用户选择执行不同的修改操作：
    //    - 修改标题
    //    - 修改源码路径
    //    - 修改入口文件
    //    - 修改输出目录
    //    - 管理环境
    //    - 管理共享环境变量
    // 4. 保存并退出或取消修改
    // 5. 使用CLI配置中的jsonIndent保存配置
  } catch (error) {
    console.error('❌ 修改配置失败：', error);
  }
}
```

### 2.7 ui 命令

#### 功能描述
启动可视化UI界面，用于模块管理。

#### 实现逻辑
```typescript
export async function uiCommand(): Promise<void> {
  try {
    // 1. 启动Web服务器
    // 2. 提供可视化管理界面
    // 3. 支持模块管理
    // 4. 支持环境管理
    // 5. 支持配置修改
  } catch (error) {
    console.error('❌ 启动UI服务器失败：', error);
  }
}
```

## 3. 核心功能实现

### 3.1 自动获取项目缩进量
- 从package.json文件中自动分析代码缩进格式
- 支持空格和制表符缩进
- 默认使用2个空格缩进

### 3.2 模板文件拷贝
- 支持用户设置模块模板目录
- 创建新模块时，若模板目录存在，则拷贝模板文件至新模块中
- 递归拷贝目录结构

### 3.3 配置文件管理
- 支持JSON和JS格式的配置文件
- 自动加载配置文件
- 使用项目缩进量保存配置文件

## 4. CLI命令使用示例

### 4.1 创建模块
```bash
vmod add
```

### 4.2 删除模块
```bash
vmod delete module1
# 或交互式选择
vmod delete
```

### 4.3 新增环境
```bash
vmod addEnv
```

### 4.4 删除环境
```bash
vmod deleteEnv
```

### 4.5 列表查询
```bash
vmod list
```

### 4.6 配置修改
```bash
vmod config
```

### 4.7 可视化UI
```bash
vmod ui
```

## 5. CLI配置文件示例

### 5.1 JSON格式配置
```json
// vmod.config.json
{
  "templateDir": "templates",
  "jsonIndent": 2
}
```

### 5.2 JS格式配置
```javascript
// vmod.config.js
module.exports = {
  templateDir: 'templates',
  jsonIndent: 4
};
```
