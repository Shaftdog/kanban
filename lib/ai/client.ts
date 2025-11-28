import OpenAI from 'openai';

let _openaiClient: OpenAI | null = null;

/**
 * Get the OpenAI client instance (lazy initialization)
 * This ensures the client is only created when actually needed,
 * preventing build-time errors when OPENAI_API_KEY is not set
 */
export function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    _openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openaiClient;
}

export const AI_MODEL = 'gpt-4o' as const;
export const AI_TEMPERATURE = 0.7;
export const AI_MAX_TOKENS = 4000;
