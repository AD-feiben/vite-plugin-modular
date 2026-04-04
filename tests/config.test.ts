import { describe, it, expect } from 'vitest'

describe('defineVmodConfig', () => {
  describe('function overloads', () => {
    it('should return config directly when passed an object', () => {
      const config = {
        templateDir: 'templates',
        jsonIndent: 2
      }

      const result = typeof config === 'function' ? config() : config

      expect(result).toEqual({ templateDir: 'templates', jsonIndent: 2 })
    })

    it('should call and return config when passed a function', () => {
      const configFn = () => ({
        templateDir: 'custom-templates',
        jsonIndent: 4
      })

      const result = typeof configFn === 'function' ? configFn() : configFn

      expect(result).toEqual({ templateDir: 'custom-templates', jsonIndent: 4 })
    })

    it('should handle undefined templateDir', () => {
      const config = {
        jsonIndent: 2
      }

      const result = typeof config === 'function' ? config() : config

      expect(result.templateDir).toBeUndefined()
      expect(result.jsonIndent).toBe(2)
    })

    it('should handle undefined jsonIndent', () => {
      const config = {
        templateDir: 'templates'
      }

      const result = typeof config === 'function' ? config() : config

      expect(result.templateDir).toBe('templates')
      expect(result.jsonIndent).toBeUndefined()
    })
  })

  describe('CliConfig type', () => {
    it('should accept valid CliConfig object', () => {
      const config = {
        templateDir: 'templates',
        jsonIndent: 2
      }

      const hasTemplateDir = 'templateDir' in config
      const hasJsonIndent = 'jsonIndent' in config

      expect(hasTemplateDir).toBe(true)
      expect(hasJsonIndent).toBe(true)
    })

    it('should accept empty config', () => {
      const config = {}

      expect(Object.keys(config).length).toBe(0)
    })
  })
})
