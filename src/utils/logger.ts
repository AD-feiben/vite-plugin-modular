import chalk from 'chalk'

// 显式启用颜色支持
chalk.level = 3 // 0: 禁用颜色, 1: 基本颜色, 2: 256 色, 3: 16M 色

// 耗时统计接口
interface Timer {
  startTime: number
  name: string
}

class Logger {
  private timers: Map<string, Timer> = new Map()

  /**
   * 信息日志
   * @param message 日志消息
   * @param prefix 可选前缀
   */
  info(message: string, prefix: string = ''): void {
    const prefixStr = prefix ? `[${prefix}] ` : ''
    console.log(`${chalk.blue('ℹ')} ${prefixStr}${message}`)
  }

  /**
   * 成功日志
   * @param message 日志消息
   * @param prefix 可选前缀
   */
  success(message: string, prefix: string = ''): void {
    const prefixStr = prefix ? `[${prefix}] ` : ''
    console.log(`${chalk.green('✓')} ${prefixStr}${chalk.green(message)}`)
  }

  /**
   * 警告日志
   * @param message 日志消息
   * @param prefix 可选前缀
   */
  warning(message: string, prefix: string = ''): void {
    const prefixStr = prefix ? `[${prefix}] ` : ''
    console.log(`${chalk.yellow('⚠')} ${prefixStr}${chalk.yellow(message)}`)
  }

  /**
   * 错误日志
   * @param message 日志消息
   * @param prefix 可选前缀
   */
  error(message: string, prefix: string = ''): void {
    const prefixStr = prefix ? `[${prefix}] ` : ''
    console.error(`${chalk.red('✗')} ${prefixStr}${chalk.red(message)}`)
  }

  /**
   * 开始计时
   * @param name 计时器名称
   */
  startTimer(name: string): void {
    this.timers.set(name, {
      startTime: Date.now(),
      name
    })
  }

  /**
   * 结束计时并返回耗时
   * @param name 计时器名称
   * @returns 耗时（毫秒）
   */
  endTimer(name: string): number {
    const timer = this.timers.get(name)
    if (!timer) {
      this.warning(`未找到计时器: ${name}`)
      return 0
    }

    const endTime = Date.now()
    const duration = endTime - timer.startTime
    this.timers.delete(name)

    return duration
  }

  /**
   * 打印命令执行开始
   * @param command 命令名称
   */
  commandStart(command: string): void {
    this.startTimer(command)
  }

  /**
   * 打印命令执行结束
   * @param command 命令名称
   */
  commandEnd(command: string): void {
    const duration = this.endTimer(command)
    const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`
    this.success(`${command} (${durationStr})`)
  }

  /**
   * 打印成功消息
   * @param message 成功消息
   */
  successMessage(message: string): void {
    console.log(chalk.green(`✅ ${message}`))
  }

  /**
   * 打印错误消息
   * @param message 错误消息
   */
  errorMessage(message: string): void {
    console.log(chalk.red(`❌ ${message}`))
  }

  /**
   * 打印警告消息
   * @param message 警告消息
   */
  warningMessage(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`))
  }

  /**
   * 打印信息消息
   * @param message 信息消息
   */
  infoMessage(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`))
  }
}

// 导出单例实例
export const logger = new Logger()
