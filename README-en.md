# Vite Plugin Modular

[![npm version](https://badge.fury.io/js/%40ad-feiben%2Fvite-plugin-modular.svg)](https://badge.fury.io/js/%40ad-feiben%2Fvite-plugin-modular)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 📦 Overview

Vite Plugin Modular is a powerful Vite plugin for managing multi-module, multi-environment frontend projects. It provides:

- 🚀 **Multi-Module Management**: Manage multiple independent modules in a single project
- 🌍 **Multi-Environment Configuration**: Support different environment configurations for each module
- 📁 **Auto Directory Structure**: Generate standardized module directory structure
- 🛠 **CLI Tools**: Convenient CLI commands for module management
- 🔧 **Environment Variable Handling**: Automatic environment variable processing and injection
- 📝 **Modular Configuration**: Support for modular configuration file management

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @ad-feiben/vite-plugin-modular --save-dev

# Using yarn
yarn add @ad-feiben/vite-plugin-modular -D

# Using pnpm
pnpm add @ad-feiben/vite-plugin-modular -D
```

### Configuration

1. **Initialize Configuration**

```bash
# Using CLI to initialize
npx vmod init

# Or use short form
npx vm init
```

2. **Register Plugin in vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import VitePluginModular from '@ad-feiben/vite-plugin-modular'

export default defineConfig({
  plugins: [
    VitePluginModular()
  ]
})
```

## 📖 Usage Guide

### Core Concepts

1. **Module**: An independent functional unit in a project, each module has its own source directory, entry file, and configuration
2. **Environment**: Each module can have multiple environment configurations, such as development, production, test, etc.
3. **Configuration File**: `.modular.config.jsonc` stores module configuration information

### CLI Tools

#### CLI Demo

![CLI Demo](./assets/cli-effect.png)

#### Commands

| Command   | Alias | Description            |
| --------- | ----- | ---------------------- |
| `add`     | `a`   | Add a new module       |
| `delete`  | `d`   | Delete a module        |
| `addEnv`  | `ae`  | Add environment to module |
| `deleteEnv` | `de` | Delete environment from module |
| `list`    | `ls`  | List all modules       |
| `config`  | `c`   | Modify module config    |
| `init`    | `i`   | Initialize CLI config   |

> Run `vmod --help` to see the complete command list and detailed instructions

### Module Development

1. **Module Directory Structure**

After creating a module, the following directory structure is automatically generated:

```
src/modules/
├── module1/          # Module directory
│   ├── main.ts       # Module entry
│   └── style.css     # Module styles
└── module2/
    ├── main.ts
    └── style.css
```

2. **Code Sharing Suggestions**

To maintain module independence and maintainability, avoid directly referencing other modules. If multiple modules need shared code:

- Extract shared functions, variables, etc. into the `src` directory as a common module
- Use `src/utils` directory for utility functions
- Use `src/types` directory for shared type definitions
- Use `define` to configure shared environment variables

3. **Environment Configuration**

Create environment configuration files in the `env` directory:

```
env/
├── .env.development  # Development environment
├── .env.production   # Production environment
└── .env.test         # Test environment
```

4. **Run and Build**

```bash
# Run development server for specific module
npm run dev:module1-dev

# Build production version for specific module
npm run build:module1-prod

# Build test version for specific module
npm run build:module1-test
```

## 🔧 Configuration Guide

### Module Configuration File

The module configuration file `.modular.config.jsonc` stores all module configuration:

```jsonc
{
  "module1": {
    "name": "module1",
    "sourceDir": "module1",
    "entry": "main.ts",
    "title": "Module 1",
    "outputDir": "module1",
    "environments": ["dev", "prod", "test"],
    "define": {
      "API_URL": "https://api.example.com",
      "APP_VERSION": "1.0.0"
    }
  },
  "module2": {
    "name": "module2",
    "sourceDir": "module2",
    "entry": "main.ts",
    "title": "Module 2",
    "outputDir": "module2",
    "environments": ["dev", "prod"],
    "define": {
      "API_URL": "https://api.example.com",
      "APP_VERSION": "1.0.0"
    }
  }
}
```

### Configuration Options

| Option        | Type                | Description                           |
| ------------- | ------------------- | ------------------------------------- |
| `name`        | string              | Module name                           |
| `sourceDir`   | string              | Source directory (relative to src/modules) |
| `entry`       | string              | Entry file (relative to source directory) |
| `title`       | string              | Page title                            |
| `outputDir`   | string              | Output directory (relative to dist)    |
| `environments`| string[]            | Environment list                      |
| `define`      | Record<string, any> | Shared environment variables          |

## 🎯 Features

### 1. Environment Variable Injection

Automatically inject `define` configurations as environment variables:

```typescript
// Using injected environment variables
const apiUrl = import.meta.env.VITE_API_URL
const appVersion = import.meta.env.VITE_APP_VERSION
```

### 3. Smart Command Generation

When creating a module, automatically generate corresponding npm script commands:

```json
{
  "scripts": {
    "dev:module1-dev": "vite --mode module1-dev",
    "build:module1-dev": "vite build --mode module1-dev",
    "dev:module1-prod": "vite --mode module1-prod",
    "build:module1-prod": "vite build --mode module1-prod",
    "dev:module1-test": "vite --mode module1-test",
    "build:module1-test": "vite build --mode module1-test"
  }
}
```

### 4. Optimized User Experience

- **Colorful Logs**: Colorful terminal output for better readability
- **Smart Hints**: Intelligent prompts during CLI interactions
- **Progress Feedback**: Clear progress feedback during operations
- **Error Handling**: Friendly error messages and handling

## 📁 Project Structure

```
vite-plugin-modular/
├── dist/             # Build output
├── src/              # Source code
│   ├── cli/          # CLI tools
│   │   └── commands/ # Command implementations
│   ├── types/        # Type definitions
│   ├── utils/        # Utility functions
│   ├── config.ts     # Configuration handling
│   └── plugin.ts     # Plugin core
├── schemas/          # JSON Schema
├── public/           # Static assets
├── tests/            # Test files
└── example/          # Example project
```

## 🚧 Development Guide

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

## 🌟 Example Project

Vite Plugin Modular includes a complete example project in the `example/` directory. You can refer to it to understand how to use the plugin:

```bash
# Enter example directory
cd example

# Install dependencies
npm install

# Run example module
npm run dev:module1-dev
```

## 🤝 Contributing

We welcome community contributions! If you have any suggestions or improvements:

1. Fork this repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter issues while using:

1. Check the [Example Project](example/) to understand usage
2. Review [Configuration Guide](#-configuration-guide) to verify configuration
3. Submit an [Issue](https://github.com/AD-feiben/vite-plugin-modular/issues) to report problems

## 🌟 Acknowledgements

- [Vite](https://vitejs.dev/) - Modern frontend build tool
- [Commander.js](https://github.com/tj/commander.js) - CLI tool
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI
- [Chalk](https://github.com/chalk/chalk) - Terminal colorful output
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

---

**Vite Plugin Modular** - Making frontend modular development easier! 🚀
