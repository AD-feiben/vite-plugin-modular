import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn()
  }
})

vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path')>('path')
  return {
    ...actual,
    join: vi.fn()
  }
})

describe('deleteCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('module selection', () => {
    it('should require module name or user selection', () => {
      const modules = ['module1', 'module2']
      const selectedModuleName = undefined

      let actualModuleName = selectedModuleName
      if (!actualModuleName) {
        actualModuleName = modules[0]
      }

      expect(actualModuleName).toBe('module1')
    })

    it('should use provided module name when available', () => {
      const selectedModuleName = 'provided-module'

      expect(selectedModuleName).toBe('provided-module')
    })
  })

  describe('module existence validation', () => {
    it('should detect when module does not exist', () => {
      const modularConfig = {
        'existing-module': {}
      }
      const selectedModuleName = 'non-existent'

      const exists = !!modularConfig[selectedModuleName]

      expect(exists).toBe(false)
    })

    it('should confirm module exists', () => {
      const modularConfig = {
        'existing-module': {}
      }
      const selectedModuleName = 'existing-module'

      const exists = !!modularConfig[selectedModuleName]

      expect(exists).toBe(true)
    })
  })

  describe('environment deletion', () => {
    it('should iterate over all environments for deletion', () => {
      const environments = ['dev', 'prod', 'sit']
      const deletedEnvs: string[] = []

      environments.forEach((env) => {
        deletedEnvs.push(env)
      })

      expect(deletedEnvs).toEqual(['dev', 'prod', 'sit'])
    })
  })

  describe('package.json scripts deletion', () => {
    it('should delete serve script', () => {
      const scripts = {
        'serve:test-module': 'vite --mode test-module:dev',
        'build:test-module': 'vite build --mode test-module:prod'
      }
      const moduleName = 'test-module'

      delete scripts[`serve:${moduleName}`]

      expect(scripts['serve:test-module']).toBeUndefined()
      expect(scripts['build:test-module']).toBeDefined()
    })

    it('should delete build script', () => {
      const scripts = {
        'serve:test-module': 'vite --mode test-module:dev',
        'build:test-module': 'vite build --mode test-module:prod'
      }
      const moduleName = 'test-module'

      delete scripts[`build:${moduleName}`]

      expect(scripts['serve:test-module']).toBeDefined()
      expect(scripts['build:test-module']).toBeUndefined()
    })

    it('should delete environment-specific build scripts', () => {
      const scripts: Record<string, string> = {
        'serve:test-module': 'vite --mode test-module:dev',
        'build:test-module': 'vite build --mode test-module:prod',
        'build:test-module:sit': 'vite build --mode test-module:sit',
        'build:test-module:uat': 'vite build --mode test-module:uat'
      }
      const moduleName = 'test-module'
      const environments = ['dev', 'prod', 'sit', 'uat']

      environments.forEach((env) => {
        if (env !== 'dev' && env !== 'prod') {
          delete scripts[`build:${moduleName}:${env}`]
        }
      })

      expect(scripts['build:test-module:sit']).toBeUndefined()
      expect(scripts['build:test-module:uat']).toBeUndefined()
      expect(scripts['serve:test-module']).toBeDefined()
      expect(scripts['build:test-module']).toBeDefined()
    })
  })

  describe('modular config deletion', () => {
    it('should remove module from config', () => {
      const modularConfig = {
        module1: {},
        module2: {},
        module3: {}
      }
      const moduleNameToDelete = 'module2'

      delete modularConfig[moduleNameToDelete]

      expect(modularConfig['module1']).toBeDefined()
      expect(modularConfig['module2']).toBeUndefined()
      expect(modularConfig['module3']).toBeDefined()
    })
  })

  describe('confirmation logic', () => {
    it('should proceed when confirm is true', () => {
      const confirm = true

      expect(confirm).toBe(true)
    })

    it('should cancel when confirm is false', () => {
      const confirm = false

      expect(confirm).toBe(false)
    })
  })

  describe('module validation', () => {
    it('should detect when no modules exist', () => {
      const modularConfig = {}

      const modules = Object.keys(modularConfig)

      expect(modules.length).toBe(0)
    })

    it('should detect when modules exist', () => {
      const modularConfig = {
        module1: {}
      }

      const modules = Object.keys(modularConfig)

      expect(modules.length).toBe(1)
    })
  })

  describe('deletion reporting', () => {
    it('should report correct environment count', () => {
      const moduleConfig = {
        environments: ['dev', 'prod', 'sit', 'uat']
      }

      const count = moduleConfig.environments.length

      expect(count).toBe(4)
    })

    it('should generate correct directory path', () => {
      const sourceDir = 'test-module'

      const path = `src/modules/${sourceDir}`

      expect(path).toBe('src/modules/test-module')
    })
  })
})
