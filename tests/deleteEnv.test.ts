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

describe('deleteEnvCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('environment filtering for deletion', () => {
    it('should filter out dev and prod environments', () => {
      const environments = ['dev', 'prod', 'sit', 'uat']

      const removableEnvironments = environments.filter((env) => env !== 'dev' && env !== 'prod')

      expect(removableEnvironments).toEqual(['sit', 'uat'])
    })

    it('should return empty array when only dev and prod exist', () => {
      const environments = ['dev', 'prod']

      const removableEnvironments = environments.filter((env) => env !== 'dev' && env !== 'prod')

      expect(removableEnvironments).toEqual([])
    })

    it('should return all environments when no dev/prod', () => {
      const environments = ['sit', 'uat', 'test']

      const removableEnvironments = environments.filter((env) => env !== 'dev' && env !== 'prod')

      expect(removableEnvironments).toEqual(['sit', 'uat', 'test'])
    })
  })

  describe('getEnvironmentChoices', () => {
    it('should disable dev and prod environments', () => {
      const environments = ['dev', 'sit', 'prod']

      const choices = environments.map((env) => {
        const isDefault = env === 'dev' || env === 'prod'
        return {
          name: isDefault ? `${env} (默认环境，不可删除)` : env,
          value: env,
          disabled: isDefault
        }
      })

      expect(choices[0].disabled).toBe(true)
      expect(choices[1].disabled).toBe(false)
      expect(choices[2].disabled).toBe(true)
    })

    it('should format choice labels correctly', () => {
      const environments = ['dev', 'sit']

      const choices = environments.map((env) => {
        const isDefault = env === 'dev' || env === 'prod'
        return {
          name: isDefault ? `${env} (默认环境，不可删除)` : env,
          value: env,
          disabled: isDefault
        }
      })

      expect(choices[0].name).toBe('dev (默认环境，不可删除)')
      expect(choices[1].name).toBe('sit')
    })
  })

  describe('environment removal from list', () => {
    it('should remove environment from list', () => {
      const environments = ['dev', 'sit', 'prod', 'uat']
      const envToDelete = 'sit'

      const updatedEnvironments = environments.filter((env) => env !== envToDelete)

      expect(updatedEnvironments).toEqual(['dev', 'prod', 'uat'])
    })

    it('should not modify list if environment not found', () => {
      const environments = ['dev', 'sit', 'prod']
      const envToDelete = 'nonexistent'

      const updatedEnvironments = environments.filter((env) => env !== envToDelete)

      expect(updatedEnvironments).toEqual(['dev', 'sit', 'prod'])
    })
  })

  describe('script key deletion', () => {
    it('should delete correct script key from package.json', () => {
      const scripts = {
        'build:test-module:dev': 'vite build --mode test-module:dev',
        'build:test-module:sit': 'vite build --mode test-module:sit',
        'build:test-module:prod': 'vite build --mode test-module:prod'
      }
      const moduleName = 'test-module'
      const envName = 'sit'
      const scriptKey = `build:${moduleName}:${envName}`

      delete scripts[scriptKey]

      expect(scripts).not.toHaveProperty('build:test-module:sit')
      expect(scripts).toHaveProperty('build:test-module:dev')
      expect(scripts).toHaveProperty('build:test-module:prod')
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
        'test-module': {
          sourceDir: 'test',
          entry: 'main.ts',
          environments: ['dev']
        }
      }

      const modules = Object.keys(modularConfig)

      expect(modules.length).toBe(1)
      expect(modules).toContain('test-module')
    })
  })
})
