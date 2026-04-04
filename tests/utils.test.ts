import { describe, it, expect, vi, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { getProjectIndent } from '../src/utils'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn()
  }
})

// 模拟 path 模块
vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path')>('path')
  return {
    ...actual,
    join: vi.fn()
  }
})

describe('Utils', () => {
  describe('getProjectIndent', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return 2 when package.json does not exist', () => {
      // 模拟 existsSync 返回 false
      ;(existsSync as any).mockReturnValue(false)

      const result = getProjectIndent()
      expect(result).toBe(2)
    })

    it('should return 2 when package.json exists but has no indentation', () => {
      // 模拟 existsSync 返回 true
      ;(existsSync as any).mockReturnValue(true)
      // 模拟 readFileSync 返回没有缩进的内容
      ;(readFileSync as any).mockReturnValue('{"name": "test"}')

      const result = getProjectIndent()
      expect(result).toBe(2)
    })

    it('should return 2 when package.json has 2-space indentation', () => {
      // 模拟 existsSync 返回 true
      ;(existsSync as any).mockReturnValue(true)
      // 模拟 readFileSync 返回有 2 空格缩进的内容
      ;(readFileSync as any).mockReturnValue('{\n  "name": "test"\n}')

      const result = getProjectIndent()
      expect(result).toBe(2)
    })

    it('should return 4 when package.json has 4-space indentation', () => {
      // 模拟 existsSync 返回 true
      ;(existsSync as any).mockReturnValue(true)
      // 模拟 readFileSync 返回有 4 空格缩进的内容
      ;(readFileSync as any).mockReturnValue('{\n    "name": "test"\n}')

      const result = getProjectIndent()
      expect(result).toBe(4)
    })

    it('should return 1 when package.json has tab indentation', () => {
      // 模拟 existsSync 返回 true
      ;(existsSync as any).mockReturnValue(true)
      // 模拟 readFileSync 返回有制表符缩进的内容
      ;(readFileSync as any).mockReturnValue('{\n\t"name": "test"\n}')

      const result = getProjectIndent()
      expect(result).toBe(1)
    })
  })
})
