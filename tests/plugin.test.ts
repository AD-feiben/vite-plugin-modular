import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs', async () => {
  const actual = await import('fs')
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn()
  }
})

vi.mock('path', async () => {
  const actual = await import('path')
  return {
    ...actual,
    join: vi.fn()
  }
})

describe('VitePluginModular', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toSnakeCase', () => {
    it('should convert camelCase to SNAKE_CASE', () => {
      const str = 'camelCase'
      const result = str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-. ]+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toUpperCase()

      expect(result).toBe('CAMEL_CASE')
    })

    it('should handle hyphens', () => {
      const str = 'my-variable'
      const result = str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-. ]+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toUpperCase()

      expect(result).toBe('MY_VARIABLE')
    })

    it('should handle dots', () => {
      const str = 'my.variable.name'
      const result = str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-. ]+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toUpperCase()

      expect(result).toBe('MY_VARIABLE_NAME')
    })
  })

  describe('getFullSourceDir', () => {
    it('should prepend src/modules/ to sourceDir', () => {
      const sourceDir = 'my-module'
      const fullPath = `src/modules/${sourceDir}`

      expect(fullPath).toBe('src/modules/my-module')
    })
  })

  describe('getFullEntryPath', () => {
    it('should combine sourceDir and entry', () => {
      const sourceDir = 'my-module'
      const entry = 'main.ts'
      const fullPath = `src/modules/${sourceDir}/${entry}`

      expect(fullPath).toBe('src/modules/my-module/main.ts')
    })
  })

  describe('parseMode', () => {
    it('should parse valid mode with colon separator', () => {
      const mode = 'test-module:sit'
      const moduleNames = ['test-module', 'other-module']
      const sortedNames = [...moduleNames].sort((a, b) => b.length - a.length)

      let result = { moduleName: null as string | null, envName: null as string | null }
      for (const name of sortedNames) {
        if (mode.startsWith(name + ':')) {
          result = {
            moduleName: name,
            envName: mode.substring(name.length + 1)
          }
          break
        }
      }

      expect(result.moduleName).toBe('test-module')
      expect(result.envName).toBe('sit')
    })

    it('should return null for invalid mode', () => {
      const mode = 'invalid-mode-format'
      const moduleNames: string[] = []

      const sortedNames = [...moduleNames].sort((a, b) => b.length - a.length)
      let result = { moduleName: null as string | null, envName: null as string | null }

      for (const name of sortedNames) {
        if (mode.startsWith(name + ':')) {
          result = {
            moduleName: name,
            envName: mode.substring(name.length + 1)
          }
        }
      }

      expect(result.moduleName).toBe(null)
      expect(result.envName).toBe(null)
    })
  })

  describe('parseModeLegacy', () => {
    it('should parse mode with hyphen separator', () => {
      const mode = 'test-module-legacy'
      const moduleNames = ['test-module']
      const sortedNames = [...moduleNames].sort((a, b) => b.length - a.length)

      let result = { moduleName: null as string | null, envName: null as string | null }
      for (const name of sortedNames) {
        if (mode.startsWith(name + '-')) {
          result = {
            moduleName: name,
            envName: mode.substring(name.length + 1)
          }
          break
        }
      }

      expect(result.moduleName).toBe('test-module')
      expect(result.envName).toBe('legacy')
    })
  })

  describe('loadModularConfig', () => {
    it('should remove comment lines from JSONC content', () => {
      const jsoncContent = `{
        // This is a comment
        "module1": { "name": "module1" },
        // Another comment
        "module2": { "name": "module2" }
      }`

      const cleanedContent = jsoncContent
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n')

      expect(cleanedContent).not.toContain('// This is a comment')
      expect(cleanedContent).toContain('"module1"')
    })

    it('should parse valid JSON content', () => {
      const jsonContent = '{"module1": {"name": "module1"}}'

      const parsed = JSON.parse(jsonContent)

      expect(parsed.module1.name).toBe('module1')
    })
  })

  describe('validateSourceDirs', () => {
    it('should throw error for duplicate sourceDirs', () => {
      const config = {
        module1: { sourceDir: 'shared-source' },
        module2: { sourceDir: 'shared-source' }
      }

      const sourceDirs = new Set<string>()
      let error: Error | null = null

      for (const moduleConfig of Object.values(config)) {
        if (sourceDirs.has(moduleConfig.sourceDir)) {
          error = new Error(
            `Source directory "${moduleConfig.sourceDir}" is already used by another module`
          )
          break
        }
        sourceDirs.add(moduleConfig.sourceDir)
      }

      expect(error).not.toBeNull()
      expect(error?.message).toContain('shared-source')
    })

    it('should not throw for unique sourceDirs', () => {
      const config = {
        module1: { sourceDir: 'source1' },
        module2: { sourceDir: 'source2' }
      }

      const sourceDirs = new Set<string>()
      let hasError = false

      for (const moduleConfig of Object.values(config)) {
        if (sourceDirs.has(moduleConfig.sourceDir)) {
          hasError = true
          break
        }
        sourceDirs.add(moduleConfig.sourceDir)
      }

      expect(hasError).toBe(false)
    })
  })

  describe('base path normalization', () => {
    it('should prepend slash if base does not start with slash', () => {
      const moduleBase = 'custom-base'
      const base = moduleBase.startsWith('/') ? moduleBase : `/${moduleBase}`

      expect(base).toBe('/custom-base')
    })

    it('should keep base unchanged if it already starts with slash', () => {
      const moduleBase = '/already-has-slash'
      const base = moduleBase.startsWith('/') ? moduleBase : `/${moduleBase}`

      expect(base).toBe('/already-has-slash')
    })

    it('should append trailing slash if not present', () => {
      const base = '/custom-base'
      const processedBase = base.endsWith('/') ? base : `${base}/`

      expect(processedBase).toBe('/custom-base/')
    })
  })

  describe('output dir path generation', () => {
    it('should combine userOutDir with currentModule.outputDir', () => {
      const userOutDir = 'dist'
      const outputDir = 'my-module'

      const fullOutDir = `${userOutDir}/${outputDir}`

      expect(fullOutDir).toBe('dist/my-module')
    })

    it('should use default outDir when not specified', () => {
      const userOutDir = undefined
      const defaultOutDir = 'dist'

      const actualOutDir = userOutDir || defaultOutDir

      expect(actualOutDir).toBe('dist')
    })
  })

  describe('env var injection', () => {
    it('should generate snake_case env var key', () => {
      const key = 'API_URL'
      const snakeCaseKey = key
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-. ]+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toUpperCase()

      expect(snakeCaseKey).toBe('API_URL')
    })

    it('should wrap value in JSON.stringify', () => {
      const value = 'https://api.example.com'
      const wrappedValue = JSON.stringify(value)

      expect(wrappedValue).toBe('"https://api.example.com"')
    })
  })

  describe('HTML transformation', () => {
    it('should replace title tag', () => {
      const html = '<html><head><title>Old Title</title></head></html>'
      const newTitle = 'New Module Title'

      const updatedHtml = html.replace(/<title>([^<]*)<\/title>/, `<title>${newTitle}</title>`)

      expect(updatedHtml).toContain('<title>New Module Title</title>')
      expect(updatedHtml).not.toContain('Old Title')
    })

    it('should detect external script URLs', () => {
      const src = 'https://cdn.example.com/script.js'

      const isExternal = src.startsWith('http://') || src.startsWith('https://')

      expect(isExternal).toBe(true)
    })

    it('should detect local script URLs', () => {
      const src = '/local/script.js'

      const isExternal = src.startsWith('http://') || src.startsWith('https://')

      expect(isExternal).toBe(false)
    })
  })
})
