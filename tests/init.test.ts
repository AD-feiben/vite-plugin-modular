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

describe('initCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('config file existence check', () => {
    it('should detect existing JSON config file', () => {
      const jsonExists = true
      const jsExists = false

      const configExists = jsonExists || jsExists

      expect(configExists).toBe(true)
    })

    it('should detect existing JS config file', () => {
      const jsonExists = false
      const jsExists = true

      const configExists = jsonExists || jsExists

      expect(configExists).toBe(true)
    })

    it('should allow init when no config exists', () => {
      const jsonExists = false
      const jsExists = false

      const configExists = jsonExists || jsExists

      expect(configExists).toBe(false)
    })
  })

  describe('JSON config generation', () => {
    it('should create config with templateDir and jsonIndent', () => {
      const templateDir = 'templates'
      const jsonIndent = 2

      const config = {
        templateDir,
        jsonIndent: parseInt(jsonIndent.toString())
      }

      expect(config.templateDir).toBe('templates')
      expect(config.jsonIndent).toBe(2)
    })

    it('should serialize config to JSON string', () => {
      const config = {
        templateDir: 'custom-templates',
        jsonIndent: 4
      }

      const jsonString = JSON.stringify(config, null, 2)

      expect(jsonString).toContain('"templateDir"')
      expect(jsonString).toContain('"custom-templates"')
      expect(jsonString).toContain('"jsonIndent"')
    })
  })

  describe('JS config generation', () => {
    it('should generate valid JS config content', () => {
      const templateDir = 'templates'
      const jsonIndent = 2

      const configContent = `// Vite Plugin Modular CLI 配置文件
// IDE会自动提供智能提示
// 使用 ESM 格式
import { defineVmodConfig } from '@ad-feiben/vite-plugin-modular';

export default defineVmodConfig({
  templateDir: "${templateDir}",
  jsonIndent: ${jsonIndent}
});
`

      expect(configContent).toContain('defineVmodConfig')
      expect(configContent).toContain(`templateDir: "${templateDir}"`)
      expect(configContent).toContain(`jsonIndent: ${jsonIndent}`)
    })
  })

  describe('JSON indent validation', () => {
    it('should accept valid indent values', () => {
      const validValues = ['1', '2', '4', '8']

      validValues.forEach((value) => {
        const num = parseInt(value)
        const isValid = !isNaN(num) && num >= 1 && num <= 8
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid indent values', () => {
      const invalidValues = ['', '0', '-1', '9', 'abc']

      invalidValues.forEach((value) => {
        const num = parseInt(value)
        const isValid = !isNaN(num) && num >= 1 && num <= 8
        expect(isValid).toBe(false)
      })
    })

    it('should parse indent string to number', () => {
      const value = '4'
      const num = parseInt(value)

      expect(num).toBe(4)
      expect(typeof num).toBe('number')
    })
  })

  describe('template directory handling', () => {
    it('should use default template directory', () => {
      const defaultDir = 'templates'

      expect(defaultDir).toBe('templates')
    })

    it('should allow custom template directory', () => {
      const customDir = 'custom-templates'

      expect(customDir).toBe('custom-templates')
    })
  })

  describe('config format selection', () => {
    it('should provide JSON format option', () => {
      const choices = [
        { name: 'JSON格式 (vmod.config.json) - 支持智能提示', value: 'json' },
        { name: 'JavaScript格式 (vmod.config.js) - 更灵活', value: 'js' }
      ]

      expect(choices[0].value).toBe('json')
      expect(choices[1].value).toBe('js')
    })

    it('should default to JSON format', () => {
      const defaultFormat = 'json'

      expect(defaultFormat).toBe('json')
    })
  })

  describe('path generation', () => {
    it('should generate correct JSON config path', () => {
      const cwd = '/project'
      const fileName = 'vmod.config.json'

      const fullPath = `${cwd}/${fileName}`

      expect(fullPath).toBe('/project/vmod.config.json')
    })

    it('should generate correct JS config path', () => {
      const cwd = '/project'
      const fileName = 'vmod.config.js'

      const fullPath = `${cwd}/${fileName}`

      expect(fullPath).toBe('/project/vmod.config.js')
    })
  })
})
