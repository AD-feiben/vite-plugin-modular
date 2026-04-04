import { logger } from '../../utils'

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/
const NAME_PATTERN_MESSAGE = '名称只能包含字母、数字、下划线和连字符'

export function validateName(name: string, fieldName: string = '名称'): boolean {
  if (!name) {
    logger.warningMessage(`${fieldName}不能为空`)
    return false
  }
  if (!NAME_PATTERN.test(name)) {
    logger.warningMessage(`${fieldName}${NAME_PATTERN_MESSAGE}，请重新输入`)
    return false
  }
  return true
}

export function validateNameNotExists(
  name: string,
  existsList: string[],
  fieldName: string = '名称'
): boolean {
  if (existsList.includes(name)) {
    logger.warningMessage(`${fieldName}已存在，请使用其他名称`)
    return false
  }
  return true
}

export function isValidName(name: string): boolean {
  return NAME_PATTERN.test(name)
}
