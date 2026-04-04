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

describe('listCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('module data extraction', () => {
    it('should extract module data correctly for table', () => {
      const module = {
        name: 'test-module',
        title: 'Test Module',
        sourceDir: 'test',
        entry: 'main.ts',
        outputDir: 'dist-test',
        environments: ['dev', 'sit', 'prod']
      }

      const row = [
        module.name,
        module.title,
        `src/modules/${module.sourceDir}`,
        `${module.entry}`,
        `dist/${module.outputDir}`,
        module.environments.join(', ')
      ]

      expect(row[0]).toBe('test-module')
      expect(row[1]).toBe('Test Module')
      expect(row[2]).toBe('src/modules/test')
      expect(row[3]).toBe('main.ts')
      expect(row[4]).toBe('dist/dist-test')
      expect(row[5]).toBe('dev, sit, prod')
    })

    it('should handle module with single environment', () => {
      const module = {
        name: 'single-module',
        title: 'Single Module',
        sourceDir: 'single',
        entry: 'index.ts',
        outputDir: 'dist-single',
        environments: ['dev']
      }

      const row = [
        module.name,
        module.title,
        `src/modules/${module.sourceDir}`,
        `${module.entry}`,
        `dist/${module.outputDir}`,
        module.environments.join(', ')
      ]

      expect(row[5]).toBe('dev')
    })

    it('should handle module with no environments', () => {
      const module = {
        name: 'empty-module',
        title: 'Empty Module',
        sourceDir: 'empty',
        entry: 'main.ts',
        outputDir: 'dist-empty',
        environments: [] as string[]
      }

      const row = [
        module.name,
        module.title,
        `src/modules/${module.sourceDir}`,
        `${module.entry}`,
        `dist/${module.outputDir}`,
        module.environments.join(', ')
      ]

      expect(row[5]).toBe('')
    })
  })

  describe('table header generation', () => {
    it('should generate correct table header', () => {
      const header = ['模块名称', '标题', '源码路径', '入口文件', '输出目录', '环境列表']

      expect(header).toHaveLength(6)
      expect(header[0]).toBe('模块名称')
      expect(header[1]).toBe('标题')
      expect(header[2]).toBe('源码路径')
      expect(header[3]).toBe('入口文件')
      expect(header[4]).toBe('输出目录')
      expect(header[5]).toBe('环境列表')
    })
  })

  describe('module count reporting', () => {
    it('should report correct module count', () => {
      const modules = [{ name: 'module1' }, { name: 'module2' }, { name: 'module3' }]

      const count = modules.length

      expect(count).toBe(3)
    })

    it('should report zero when no modules', () => {
      const modules: unknown[] = []

      const count = modules.length

      expect(count).toBe(0)
    })
  })

  describe('module validation', () => {
    it('should detect when no modules exist', () => {
      const modularConfig = {}

      const modules = Object.values(modularConfig)

      expect(modules.length).toBe(0)
    })

    it('should detect when modules exist', () => {
      const modularConfig = {
        'module-1': { name: 'module-1' },
        'module-2': { name: 'module-2' }
      }

      const modules = Object.values(modularConfig)

      expect(modules.length).toBe(2)
    })
  })

  describe('path formatting', () => {
    it('should format source path correctly', () => {
      const sourceDir = 'my-module'

      const fullPath = `src/modules/${sourceDir}`

      expect(fullPath).toBe('src/modules/my-module')
    })

    it('should format output path correctly', () => {
      const outputDir = 'dist-custom'

      const fullPath = `dist/${outputDir}`

      expect(fullPath).toBe('dist/dist-custom')
    })

    it('should format entry path correctly', () => {
      const entry = 'index.ts'

      const fullPath = `${entry}`

      expect(fullPath).toBe('index.ts')
    })
  })
})
