/**
 * LLM Configuration and Environment Setup
 * Handles API keys, model availability, and fallback strategies
 */

import { type ModelKey, MODELS } from "./router";

export type LLMConfig = {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  maxRetries: number;
  timeoutMs: number;
  enableTelemetry: boolean;
  batchSize: number;
  cacheEnabled: boolean;
};

export type ModelAvailability = {
  [K in ModelKey]: {
    available: boolean;
    fallback?: ModelKey;
    maxTokens: number;
    costPer1KTokens: number;
  };
};

// Default configuration
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  organization: process.env.OPENAI_ORG,
  maxRetries: 3,
  timeoutMs: 120000, // 2 minutes
  enableTelemetry: true,
  batchSize: 20,
  cacheEnabled: true
};

// Model availability and characteristics
export const MODEL_AVAILABILITY: ModelAvailability = {
  nano: {
    available: false, // Not yet available, fallback to mini
    fallback: "mini",
    maxTokens: 4096,
    costPer1KTokens: 0.0001
  },
  mini: {
    available: true,
    maxTokens: 128000,
    costPer1KTokens: 0.00015
  },
  base: {
    available: true,
    maxTokens: 128000,
    costPer1KTokens: 0.0025
  },
  thinking: {
    available: true,
    fallback: "base", // Fallback if thinking mode not available
    maxTokens: 128000,
    costPer1KTokens: 0.025
  }
};

// Parameter presets from GPT Model Selection Playbook
export const MODEL_PRESETS = {
  sceneTaggers: {
    model: "mini" as ModelKey,
    reasoning_effort: "low",
    temperature: 0.2,
    max_output_tokens: 1000
  },
  beatsAndSubplots: {
    model: "base" as ModelKey,
    reasoning_effort: "medium",
    temperature: 0.3,
    max_output_tokens: 2000
  },
  legalReview: {
    model: "thinking" as ModelKey,
    reasoning_effort: "high",
    temperature: 0.1,
    max_output_tokens: 1500
  },
  coverageProse: {
    model: "base" as ModelKey,
    verbosity: "high",
    temperature: 0.6,
    max_output_tokens: 1500
  }
} as const;

/**
 * Get the actual model to use, handling fallbacks for unavailable models
 */
export function getAvailableModel(requestedModel: ModelKey): ModelKey {
  const modelInfo = MODEL_AVAILABILITY[requestedModel];

  if (modelInfo.available) {
    return requestedModel;
  }

  if (modelInfo.fallback) {
    console.warn(`Model ${requestedModel} not available, using fallback: ${modelInfo.fallback}`);
    return getAvailableModel(modelInfo.fallback);
  }

  // Ultimate fallback
  console.warn(`No fallback available for ${requestedModel}, using base model`);
  return "base";
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(config: Partial<LLMConfig> = {}): LLMConfig {
  const mergedConfig = { ...DEFAULT_LLM_CONFIG, ...config };

  if (!mergedConfig.apiKey) {
    throw new Error("OpenAI API key is required. Set OPENAI_API_KEY environment variable.");
  }

  return mergedConfig;
}

/**
 * Estimate token cost for an operation
 */
export function estimateTokenCost(model: ModelKey, inputTokens: number, outputTokens: number): number {
  const modelInfo = MODEL_AVAILABILITY[model];
  const totalTokens = inputTokens + outputTokens;
  return (totalTokens / 1000) * modelInfo.costPer1KTokens;
}

/**
 * Get recommended batch size based on model and operation type
 */
export function getRecommendedBatchSize(model: ModelKey, operationType: "scene_tagging" | "cross_scene" | "escalation"): number {
  const baseSize = DEFAULT_LLM_CONFIG.batchSize;

  switch (operationType) {
    case "scene_tagging":
      return model === "mini" || model === "nano" ? baseSize * 2 : baseSize;
    case "cross_scene":
      return model === "base" ? Math.floor(baseSize / 2) : baseSize;
    case "escalation":
      return model === "thinking" ? Math.floor(baseSize / 4) : baseSize;
    default:
      return baseSize;
  }
}

/**
 * Check if a model supports specific features
 */
export function supportsFeature(model: ModelKey, feature: "structured_outputs" | "function_calling" | "vision" | "batch_api"): boolean {
  // All models in our setup support structured outputs and function calling
  // This would be expanded based on actual model capabilities
  switch (feature) {
    case "structured_outputs":
    case "function_calling":
      return true;
    case "vision":
      return model === "base" || model === "thinking";
    case "batch_api":
      return true;
    default:
      return false;
  }
}

/**
 * Generate system prompts with caching hints
 */
export function createCachedSystemPrompt(
  basePrompt: string,
  schema?: object,
  style?: "analytical" | "creative" | "legal"
): string {
  let prompt = basePrompt;

  // Add style-specific instructions
  if (style === "analytical") {
    prompt += "\n\nBe precise, objective, and data-driven in your analysis.";
  } else if (style === "creative") {
    prompt += "\n\nProvide creative, engaging insights while maintaining professionalism.";
  } else if (style === "legal") {
    prompt += "\n\nIMPORTANT: This analysis does not constitute legal advice. Consult qualified legal counsel.";
  }

  // Add schema instructions if provided
  if (schema) {
    prompt += "\n\nReturn JSON matching the exact schema. Do not include explanatory text outside the JSON.";
  }

  return prompt;
}

/**
 * Create model-specific request parameters
 */
export function createRequestParams(
  model: ModelKey,
  preset?: keyof typeof MODEL_PRESETS,
  overrides?: Partial<{
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  }>
) {
  const actualModel = getAvailableModel(model);
  const modelInfo = MODEL_AVAILABILITY[actualModel];

  let baseParams = {
    model: MODELS[actualModel],
    max_tokens: Math.min(2000, modelInfo.maxTokens),
    temperature: actualModel === "mini" || actualModel === "nano" ? 0.2 : 0.3,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  // Apply preset if specified
  if (preset) {
    const presetConfig = MODEL_PRESETS[preset];
    baseParams = {
      ...baseParams,
      model: MODELS[getAvailableModel(presetConfig.model)],
      temperature: presetConfig.temperature,
      max_tokens: presetConfig.max_output_tokens
    };
  }

  // Apply overrides
  if (overrides) {
    baseParams = { ...baseParams, ...overrides };
  }

  return baseParams;
}

export { MODEL_PRESETS as PRESETS };