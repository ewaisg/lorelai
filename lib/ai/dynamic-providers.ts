'use server';

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getUserProviders, getUserModels } from "@/lib/firebase/user-settings-queries";
import type { AIProvider, UserModel } from "@/lib/firebase/user-settings-types";

// Cache for initialized providers per user
const providerCache = new Map<string, Map<string, any>>();

/**
 * Get all enabled providers for a user
 */
export async function getUserAIProviders(userId: string): Promise<AIProvider[]> {
  const providers = await getUserProviders(userId);
  return providers.filter((p) => p.enabled);
}

/**
 * Get all enabled models for a user
 */
export async function getUserAIModels(userId: string): Promise<UserModel[]> {
  const models = await getUserModels(userId);
  return models.filter((m) => m.enabled);
}

/**
 * Get the default model for a user
 */
export async function getDefaultModel(userId: string): Promise<UserModel | null> {
  const models = await getUserAIModels(userId);
  const defaultModel = models.find((m) => m.isDefault);
  return defaultModel || models[0] || null;
}

/**
 * Initialize a provider SDK based on its configuration
 */
function initializeProvider(provider: AIProvider): any {
  const { type, config } = provider;

  switch (type) {
    case 'azure-openai':
      if (!config.azureEndpoint || !config.azureApiKey) {
        throw new Error(`Azure OpenAI provider ${provider.name} missing endpoint or API key`);
      }

      // Use OpenAI SDK configured for Azure
      // This supports the traditional Azure OpenAI API with date-based versions
      const endpoint = config.azureEndpoint.replace(/\/$/, '');

      return createOpenAI({
        apiKey: config.azureApiKey,
        baseURL: `${endpoint}/openai/deployments`,
        headers: {
          'api-key': config.azureApiKey,
        },
      });

    case 'openai':
      if (!config.openaiApiKey) {
        throw new Error(`OpenAI provider ${provider.name} missing API key`);
      }
      return createOpenAI({
        apiKey: config.openaiApiKey,
        baseURL: config.openaiBaseUrl || 'https://api.openai.com/v1',
      });

    case 'anthropic':
      if (!config.anthropicApiKey) {
        throw new Error(`Anthropic provider ${provider.name} missing API key`);
      }
      return createAnthropic({
        apiKey: config.anthropicApiKey,
      });

    case 'google':
      if (!config.googleApiKey) {
        throw new Error(`Google provider ${provider.name} missing API key`);
      }
      return createGoogleGenerativeAI({
        apiKey: config.googleApiKey,
      });

    case 'custom':
      if (!config.customEndpoint || !config.customApiKey) {
        throw new Error(`Custom provider ${provider.name} missing endpoint or API key`);
      }
      // Use OpenAI SDK for custom endpoints (most are OpenAI-compatible)
      return createOpenAI({
        apiKey: config.customApiKey,
        baseURL: config.customEndpoint,
        headers: config.customHeaders || {},
      });

    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

/**
 * Get or initialize a provider SDK instance with caching
 */
export async function getProviderInstance(userId: string, providerId: string): Promise<any> {
  // Check cache first
  if (!providerCache.has(userId)) {
    providerCache.set(userId, new Map());
  }

  const userCache = providerCache.get(userId)!;

  if (userCache.has(providerId)) {
    return userCache.get(providerId);
  }

  // Load and initialize provider
  const providers = await getUserAIProviders(userId);
  const provider = providers.find((p) => p.id === providerId);

  if (!provider) {
    throw new Error(`Provider ${providerId} not found or not enabled`);
  }

  const instance = initializeProvider(provider);
  userCache.set(providerId, instance);

  return instance;
}

/**
 * Get a language model instance for a user's configured model
 */
export async function getUserLanguageModel(userId: string, modelId: string) {
  const models = await getUserAIModels(userId);
  const model = models.find((m) => m.id === modelId);

  if (!model) {
    throw new Error(`Model ${modelId} not found or not enabled`);
  }

  // Get provider details to check type
  const providers = await getUserProviders(userId);
  const provider = providers.find((p) => p.id === model.providerId);

  if (!provider) {
    throw new Error(`Provider ${model.providerId} not found`);
  }

  // For Azure, create a model-specific instance
  if (provider.type === 'azure-openai') {
    const endpoint = provider.config.azureEndpoint?.replace(/\/$/, '') || '';
    const deploymentName = model.deploymentName || model.modelId;

    // Check if this is Azure AI Foundry format (.openai.azure.com)
    const isAIFoundry = endpoint.includes('.openai.azure.com');

    if (isAIFoundry) {
      // Azure AI Foundry format: https://resource.openai.azure.com/openai/v1/
      // No api-version needed, deployment name passed as model parameter
      const baseURL = endpoint.includes('/openai/v1')
        ? endpoint
        : `${endpoint}/openai/v1/`;

      const azureProvider = createOpenAI({
        apiKey: provider.config.azureApiKey!,
        baseURL,
      });

      // Pass deployment name as the model parameter
      // Model settings (maxTokens, temperature) are applied in the actual API calls (streamText, generateText)
      return azureProvider(deploymentName);
    } else {
      // Traditional Azure OpenAI format: https://resource.cognitiveservices.azure.com
      // Requires api-version in URL and deployment in path
      const apiVersion = provider.config.azureApiVersion || '2024-08-01-preview';
      const baseURLWithVersion = `${endpoint}/openai/deployments/${deploymentName}?api-version=${apiVersion}`;

      const azureProvider = createOpenAI({
        apiKey: provider.config.azureApiKey!,
        baseURL: baseURLWithVersion,
        headers: {
          'api-key': provider.config.azureApiKey!,
        },
      });

      // Empty string as model name since deployment is in the URL
      return azureProvider('');
    }
  }

  // For non-Azure providers, use the cached provider instance
  const providerInstance = await getProviderInstance(userId, model.providerId);
  const actualModelId = model.modelId;

  // Model settings (maxTokens, temperature) are applied in the actual API calls (streamText, generateText)
  return providerInstance(actualModelId);
}

/**
 * Clear provider cache for a user (call when providers are updated)
 */
export async function clearProviderCache(userId: string) {
  providerCache.delete(userId);
}

/**
 * Clear all provider caches
 */
export async function clearAllProviderCaches() {
  providerCache.clear();
}
