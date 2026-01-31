# Vite Plugin Modular 配置结构文档

## 1. 主配置文件：modular.config.json

### 1.1 配置格式
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

### 1.2 配置字段说明

#### 模块配置字段

| 字段名 | 类型 | 必填 | 描述 |
| ---- | ---- | ---- | ---- |
| name | string | 是 | 模块名称 |
| title | string | 是 | 模块标题，用于替换HTML页面标题 |
| sourceDir | string | 是 | 源码路径，只记录 `src/modules/` 之后的子路径 |
| entry | string | 是 | 入口文件名 |
| outputDir | string | 是 | 构建输出目录，相对于 `dist` 目录 |
| environments | array | 是 | 支持的环境列表，至少包含 dev 和 prod |
| commands | array | 是 | 自动生成的命令列表 |
| define | object | 否 | 环境变量定义，将被注入到模块中 |

## 2. CLI配置文件：vmod.config.json

### 2.1 配置格式
```json
// vmod.config.json (项目根目录，可选，用户可自定义)
{
  "templateDir": "templates", // 模块模板目录，相对路径
  "jsonIndent": 2 // JSON缩进量，可选，默认自动获取项目中的代码缩进量
}
```

### 2.2 配置字段说明

| 字段名 | 类型 | 必填 | 描述 |
| ---- | ---- | ---- | ---- |
| templateDir | string | 否 | 模块模板目录，相对路径 |
| jsonIndent | number | 否 | JSON缩进量，默认自动获取项目中的代码缩进量 |

## 3. 环境变量文件

### 3.1 文件结构
```
env/
├── .env.module1-dev       # 模块1开发环境变量
├── .env.module1-prod      # 模块1生产环境变量
├── .env.module1-test      # 模块1测试环境变量
├── .env.module2-dev       # 模块2开发环境变量
└── .env.module2-prod      # 模块2生产环境变量
```

### 3.2 命名规则
- 所有 env 文件存放在 `env` 目录下
- 命名规则：`env/.env.[模块名]-[环境名]`

### 3.3 内容格式
```
# Environment variables for module: module1, env: dev
VITE_API_URL=https://dev.api.example.com
VITE_DEBUG_MODE=true
```

## 4. 项目结构

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
