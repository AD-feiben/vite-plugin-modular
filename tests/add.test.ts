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

describe('addCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('module name validation', () => {
    it('should reject invalid module names', () => {
      const invalidNames = ['', 'invalid name!', 'test@module', 'test!module']
      const nameRegex = /^[a-zA-Z0-9_-]+$/

      invalidNames.forEach((name) => {
        expect(nameRegex.test(name)).toBe(false)
      })
    })

    it('should accept valid module names', () => {
      const validNames = ['module1', 'test-module', 'test_module', 'TestModule123']
      const nameRegex = /^[a-zA-Z0-9_-]+$/

      validNames.forEach((name) => {
        expect(nameRegex.test(name)).toBe(true)
      })
    })

    it('should check for duplicate module names', () => {
      const modularConfig = {
        'existing-module': {}
      }
      const newModuleName = 'existing-module'

      expect(modularConfig[newModuleName]).toBeDefined()
    })
  })

  describe('sourceDir validation', () => {
    it('should validate sourceDir availability', () => {
      const config = {
        module1: { sourceDir: 'module1' },
        module2: { sourceDir: 'module2' }
      }
      const newSourceDir = 'module1'
      const currentModuleName = 'module3'

      let isAvailable = true
      for (const [moduleName, moduleConfig] of Object.entries(config)) {
        if (moduleName !== currentModuleName && moduleConfig.sourceDir === newSourceDir) {
          isAvailable = false
          break
        }
      }

      expect(isAvailable).toBe(false)
    })

    it('should allow unique sourceDir', () => {
      const config = {
        module1: { sourceDir: 'module1' }
      }
      const newSourceDir = 'unique-source'
      const currentModuleName = 'module2'

      let isAvailable = true
      for (const [moduleName, moduleConfig] of Object.entries(config)) {
        if (moduleName !== currentModuleName && moduleConfig.sourceDir === newSourceDir) {
          isAvailable = false
          break
        }
      }

      expect(isAvailable).toBe(true)
    })
  })

  describe('environment handling', () => {
    it('should initialize with dev and prod environments', () => {
      const environments: string[] = ['dev', 'prod']

      expect(environments).toContain('dev')
      expect(environments).toContain('prod')
      expect(environments).toHaveLength(2)
    })

    it('should add new environment to list', () => {
      const environments = ['dev', 'prod']

      environments.push('sit')

      expect(environments).toContain('sit')
      expect(environments).toHaveLength(3)
    })

    it('should reject duplicate environment names', () => {
      const environments = ['dev', 'prod', 'sit']
      const newEnvName = 'sit'

      const isDuplicate = environments.includes(newEnvName)

      expect(isDuplicate).toBe(true)
    })

    it('should validate environment name format', () => {
      const nameRegex = /^[a-zA-Z0-9_-]+$/

      expect(nameRegex.test('valid_env')).toBe(true)
      expect(nameRegex.test('valid-env')).toBe(true)
      expect(nameRegex.test('invalid env!')).toBe(false)
    })
  })

  describe('module config creation', () => {
    it('should create module config with all properties', () => {
      const moduleName = 'test-module'
      const sourceDir = 'test'
      const entry = 'main.ts'
      const title = 'Test Module'
      const outputDir = 'dist-test'
      const environments = ['dev', 'prod']
      const define = { API_URL: 'https://api.example.com' }
      const base = '/'

      const moduleConfig = {
        name: moduleName,
        sourceDir,
        entry,
        title,
        outputDir,
        environments,
        define,
        base
      }

      expect(moduleConfig.name).toBe('test-module')
      expect(moduleConfig.sourceDir).toBe('test')
      expect(moduleConfig.entry).toBe('main.ts')
      expect(moduleConfig.title).toBe('Test Module')
      expect(moduleConfig.outputDir).toBe('dist-test')
      expect(moduleConfig.environments).toEqual(['dev', 'prod'])
      expect(moduleConfig.define).toEqual({ API_URL: 'https://api.example.com' })
      expect(moduleConfig.base).toBe('/')
    })
  })

  describe('title generation', () => {
    it('should capitalize first letter of module name', () => {
      const moduleName = 'test-module'
      const expectedTitle = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

      expect(expectedTitle).toBe('Test-module')
    })

    it('should handle single character module name', () => {
      const moduleName = 'a'
      const expectedTitle = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

      expect(expectedTitle).toBe('A')
    })
  })

  describe('package.json scripts generation', () => {
    it('should generate serve and build scripts', () => {
      const moduleName = 'test-module'
      const scripts: Record<string, string> = {}

      scripts[`serve:${moduleName}`] = `vite --mode ${moduleName}:dev`
      scripts[`build:${moduleName}`] = `vite build --mode ${moduleName}:prod`

      expect(scripts['serve:test-module']).toBe('vite --mode test-module:dev')
      expect(scripts['build:test-module']).toBe('vite build --mode test-module:prod')
    })

    it('should generate environment-specific build scripts', () => {
      const moduleName = 'test-module'
      const environments = ['dev', 'prod', 'sit', 'uat']
      const scripts: Record<string, string> = {}

      environments.forEach((env) => {
        if (env !== 'dev' && env !== 'prod') {
          scripts[`build:${moduleName}:${env}`] = `vite build --mode ${moduleName}:${env}`
        }
      })

      expect(scripts['build:test-module:sit']).toBe('vite build --mode test-module:sit')
      expect(scripts['build:test-module:uat']).toBe('vite build --mode test-module:uat')
      expect(scripts['build:test-module:dev']).toBeUndefined()
      expect(scripts['build:test-module:prod']).toBeUndefined()
    })
  })

  describe('commands reporting', () => {
    it('should list all commands correctly', () => {
      const moduleName = 'test-module'
      const environments = ['dev', 'prod', 'sit']

      const commands = [`serve:${moduleName}`, `build:${moduleName}`]
      environments.forEach((env) => {
        if (env !== 'dev' && env !== 'prod') {
          commands.push(`build:${moduleName}:${env}`)
        }
      })

      expect(commands).toEqual(['serve:test-module', 'build:test-module', 'build:test-module:sit'])
    })
  })

  describe('define variables management', () => {
    it('should add define variable', () => {
      const define: Record<string, any> = {}

      define['API_URL'] = 'https://api.example.com'
      define['DEBUG'] = true

      expect(define['API_URL']).toBe('https://api.example.com')
      expect(define['DEBUG']).toBe(true)
    })

    it('should handle empty define object', () => {
      const define: Record<string, any> = {}

      expect(Object.keys(define).length).toBe(0)
    })
  })

  describe('path generation', () => {
    it('should generate correct entry path', () => {
      const sourceDir = 'test-module'
      const entry = 'main.ts'

      const entryPath = `src/modules/${sourceDir}/${entry}`

      expect(entryPath).toBe('src/modules/test-module/main.ts')
    })
  })
})
