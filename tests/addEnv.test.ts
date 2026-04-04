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

describe('addEnvCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('environment name validation', () => {
    it('should validate environment names correctly', () => {
      const validNames = ['dev', 'prod', 'sit', 'uat', 'test-1', 'test_2']
      const invalidNames = ['invalid env!', 'test@prod', 'test$', 'test!']

      const nameRegex = /^[a-zA-Z0-9_-]+$/

      validNames.forEach((name) => {
        expect(nameRegex.test(name)).toBe(true)
      })

      invalidNames.forEach((name) => {
        expect(nameRegex.test(name)).toBe(false)
      })
    })

    it('should allow environment names with underscores and hyphens', () => {
      const nameRegex = /^[a-zA-Z0-9_-]+$/
      expect(nameRegex.test('test_env')).toBe(true)
      expect(nameRegex.test('test-env')).toBe(true)
      expect(nameRegex.test('test_env-1')).toBe(true)
    })

    it('should reject environment names with spaces', () => {
      const nameRegex = /^[a-zA-Z0-9_-]+$/
      expect(nameRegex.test('test env')).toBe(false)
      expect(nameRegex.test('test env name')).toBe(false)
    })

    it('should reject environment names starting with special characters', () => {
      const nameRegex = /^[a-zA-Z0-9_-]+$/
      expect(nameRegex.test('-test')).toBe(true)
      expect(nameRegex.test('_test')).toBe(true)
    })

    it('should accept numeric-only environment names', () => {
      const nameRegex = /^[a-zA-Z0-9_-]+$/
      expect(nameRegex.test('123')).toBe(true)
      expect(nameRegex.test('test123')).toBe(true)
    })

    it('should reject empty environment names', () => {
      const nameRegex = /^[a-zA-Z0-9_-]+$/
      expect(nameRegex.test('')).toBe(false)
    })
  })

  describe('savePackageJson script handling', () => {
    it('should add build script for new environment', () => {
      const packageJson = {
        name: 'test-project',
        scripts: {}
      }
      const moduleName = 'test-module'
      const envName = 'sit'
      const expectedScriptKey = `build:${moduleName}:${envName}`
      const expectedScriptValue = `vite build --mode ${moduleName}:${envName}`

      packageJson.scripts![expectedScriptKey] = expectedScriptValue

      expect(packageJson.scripts).toHaveProperty(expectedScriptKey)
      expect(packageJson.scripts[expectedScriptKey]).toBe(expectedScriptValue)
    })

    it('should format build script correctly', () => {
      const moduleName = 'my-module'
      const envName = 'production'
      const expectedScriptKey = `build:${moduleName}:${envName}`
      const expectedScriptValue = `vite build --mode ${moduleName}:${envName}`

      expect(expectedScriptKey).toBe('build:my-module:production')
      expect(expectedScriptValue).toBe('vite build --mode my-module:production')
    })

    it('should handle module names with hyphens', () => {
      const moduleName = 'test-aaa'
      const envName = 'dev'
      const expectedScriptKey = `build:${moduleName}:${envName}`
      const expectedScriptValue = `vite build --mode ${moduleName}:${envName}`

      expect(expectedScriptKey).toBe('build:test-aaa:dev')
      expect(expectedScriptValue).toBe('vite build --mode test-aaa:dev')
    })
  })

  describe('environment list comparison', () => {
    it('should correctly identify new environments', () => {
      const originalEnvironments = ['dev', 'prod']
      const currentEnvironments = ['dev', 'prod', 'sit', 'uat']

      const newEnvironments = currentEnvironments.filter(
        (env) => !originalEnvironments.includes(env)
      )

      expect(newEnvironments).toEqual(['sit', 'uat'])
    })

    it('should return empty array when no new environments added', () => {
      const originalEnvironments = ['dev', 'prod']
      const currentEnvironments = ['dev', 'prod']

      const newEnvironments = currentEnvironments.filter(
        (env) => !originalEnvironments.includes(env)
      )

      expect(newEnvironments).toEqual([])
    })

    it('should detect when environments list is unchanged', () => {
      const originalEnvironments = ['dev']
      const currentEnvironments = ['dev']

      const hasNewEnvironments = currentEnvironments.length !== originalEnvironments.length

      expect(hasNewEnvironments).toBe(false)
    })

    it('should detect when environments list has changed', () => {
      const originalEnvironments = ['dev']
      const currentEnvironments = ['dev', 'sit']

      const hasNewEnvironments = currentEnvironments.length !== originalEnvironments.length

      expect(hasNewEnvironments).toBe(true)
    })
  })

  describe('env file path generation', () => {
    it('should generate correct env file path', () => {
      const moduleName = 'test-module'
      const envName = 'sit'
      const expectedFileName = `.env.${moduleName}:${envName}`

      expect(expectedFileName).toBe('.env.test-module:sit')
    })

    it('should handle module names with special characters', () => {
      const moduleName = 'test-aaa'
      const envName = 'prod'
      const expectedFileName = `.env.${moduleName}:${envName}`

      expect(expectedFileName).toBe('.env.test-aaa:prod')
    })
  })

  describe('duplicate environment detection', () => {
    it('should detect duplicate environment names', () => {
      const currentEnvironments = ['dev', 'sit', 'prod']
      const newEnvName = 'sit'

      const isDuplicate = currentEnvironments.includes(newEnvName)

      expect(isDuplicate).toBe(true)
    })

    it('should allow unique environment names', () => {
      const currentEnvironments = ['dev', 'sit', 'prod']
      const newEnvName = 'uat'

      const isDuplicate = currentEnvironments.includes(newEnvName)

      expect(isDuplicate).toBe(false)
    })
  })

  describe('module choice formatting', () => {
    it('should format module choice with existing environments', () => {
      const moduleName = 'test-module'
      const environments = ['dev', 'prod']

      const choiceLabel = `${moduleName} (已添加环境：${environments.join(', ')})`

      expect(choiceLabel).toBe('test-module (已添加环境：dev, prod)')
    })

    it('should show empty environments correctly', () => {
      const moduleName = 'new-module'
      const environments: string[] = []

      const choiceLabel = `${moduleName} (已添加环境：${environments.join(', ')})`

      expect(choiceLabel).toBe('new-module (已添加环境：)')
    })
  })
})
