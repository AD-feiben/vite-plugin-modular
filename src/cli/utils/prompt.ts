import { createPromptModule } from 'inquirer'

type PromptFunction = ReturnType<typeof createPromptModule>

const prompt: PromptFunction = createPromptModule()

export type { PromptFunction }

export function getPrompt(): PromptFunction {
  return prompt
}
