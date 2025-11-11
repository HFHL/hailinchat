export const AI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google'
  },
  {
    id: 'gpt-4-0125-preview',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI'
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic'
  }
] as const

export type ModelId = typeof AI_MODELS[number]['id']