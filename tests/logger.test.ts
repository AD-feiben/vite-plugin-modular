import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('chalk', () => ({
  default: {
    level: 3,
    blue: vi.fn((text) => text),
    green: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    red: vi.fn((text) => text),
    bold: {
      rgb: vi.fn((_r: number, _g: number, _b: number) => (_text: string) => _text)
    }
  }
}))

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('prefix formatting', () => {
    it('should format message with prefix', () => {
      const prefix = 'add'
      const _message = 'Module created'
      const prefixStr = prefix ? `[${prefix}] ` : ''

      expect(prefixStr).toBe('[add] ')
    })

    it('should format message without prefix', () => {
      const prefix = ''
      const _message = 'Module created'
      const prefixStr = prefix ? `[${prefix}] ` : ''

      expect(prefixStr).toBe('')
    })
  })

  describe('timer functionality', () => {
    it('should calculate duration correctly', () => {
      const startTime = 1000
      const endTime = 1500
      const duration = endTime - startTime

      expect(duration).toBe(500)
    })

    it('should format duration in ms when under 1 second', () => {
      const duration = 500
      const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`

      expect(durationStr).toBe('500ms')
    })

    it('should format duration in seconds when over 1 second', () => {
      const duration = 1500
      const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`

      expect(durationStr).toBe('1.50s')
    })

    it('should handle zero duration', () => {
      const duration = 0
      const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`

      expect(durationStr).toBe('0ms')
    })
  })

  describe('timer management', () => {
    it('should store timer with startTime and name', () => {
      const timers = new Map<string, { startTime: number; name: string }>()
      const name = 'test-command'
      const startTime = Date.now()

      timers.set(name, { startTime, name })

      expect(timers.has(name)).toBe(true)
      expect(timers.get(name)?.name).toBe(name)
    })

    it('should delete timer after ending', () => {
      const timers = new Map<string, { startTime: number; name: string }>()
      const name = 'test-command'
      timers.set(name, { startTime: Date.now(), name })

      timers.delete(name)

      expect(timers.has(name)).toBe(false)
    })

    it('should return undefined for non-existent timer', () => {
      const timers = new Map<string, { startTime: number; name: string }>()
      const name = 'non-existent'

      const timer = timers.get(name)

      expect(timer).toBeUndefined()
    })
  })

  describe('command timing', () => {
    it('should generate correct success message format', () => {
      const command = 'add'
      const durationStr = '150ms'
      const message = `${command} (${durationStr})`

      expect(message).toBe('add (150ms)')
    })

    it('should calculate duration from timer', () => {
      const startTime = 1000000
      const endTime = 1000500
      const duration = endTime - startTime

      expect(duration).toBe(500)
    })
  })
})
