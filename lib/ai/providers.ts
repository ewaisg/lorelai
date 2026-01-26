import { gateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { getUserLanguageModel, getUserAIModels, getDefaultModel } from "./dynamic-providers";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Azure OpenAI configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

// Check if Azure OpenAI is configured (primary option)
const isAzureConfigured = !!(AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT);

// Initialize Azure OpenAI client if configured
const azureOpenAI = isAzureConfigured
  ? createOpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/v1`,
      headers: {
        "api-key": AZURE_OPENAI_API_KEY,
      },
    })
  : null;

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

/**
 * Get language model based on configuration priority:
 * 1. Test environment mock models
 * 2. User's configured models from Firestore (PRIMARY)
 * 3. Azure OpenAI from .env (fallback)
 * 4. Vercel AI Gateway (fallback)
 */
export async function getLanguageModel(modelId: string, userId?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  // Try to load from user's configured models (PRIMARY)
  if (userId) {
    try {
      const model = await getUserLanguageModel(userId, modelId);

      if (isReasoningModel) {
        return wrapLanguageModel({
          model,
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        });
      }

      return model;
    } catch (error) {
      console.warn(`Failed to load user model ${modelId}, falling back:`, error);
      // Fall through to fallback options
    }
  }

  // Fallback to Azure OpenAI from .env
  if (azureOpenAI) {
    // For Azure, we need to extract just the model/deployment name
    // If modelId is in format "provider/model", extract just "model"
    const azureModelId = modelId.includes("/")
      ? modelId.split("/")[1]
      : modelId;

    // Remove thinking suffix for Azure
    const cleanModelId = azureModelId.replace(THINKING_SUFFIX_REGEX, "");

    if (isReasoningModel) {
      return wrapLanguageModel({
        model: azureOpenAI(cleanModelId),
        middleware: extractReasoningMiddleware({ tagName: "thinking" }),
      });
    }

    return azureOpenAI(cleanModelId);
  }

  // Vercel AI Gateway (final fallback)
  if (isReasoningModel) {
    const gatewayModelId = modelId.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: gateway.languageModel(gatewayModelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return gateway.languageModel(modelId);
}

export async function getTitleModel(userId?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  // Try to use user's first available fast model
  if (userId) {
    try {
      const models = await getUserAIModels(userId);
      // Try to find a fast/mini model for title generation
      const fastModel = models.find(m =>
        m.modelId.toLowerCase().includes('mini') ||
        m.modelId.toLowerCase().includes('flash') ||
        m.modelId.toLowerCase().includes('turbo')
      ) || models[0];

      if (fastModel) {
        return await getUserLanguageModel(userId, fastModel.id);
      }
    } catch (error) {
      console.warn('Failed to load user model for titles, falling back:', error);
    }
  }

  // Fallback to Azure OpenAI from .env
  if (azureOpenAI) {
    return azureOpenAI("gpt-4o-mini");
  }

  // Vercel AI Gateway (final fallback)
  return gateway.languageModel("google/gemini-2.5-flash-lite");
}

export async function getArtifactModel(userId?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }

  // Try to use user's default or first available capable model
  if (userId) {
    try {
      const defaultModel = await getDefaultModel(userId);

      if (defaultModel) {
        return await getUserLanguageModel(userId, defaultModel.id);
      }
    } catch (error) {
      console.warn('Failed to load user model for artifacts, falling back:', error);
    }
  }

  // Fallback to Azure OpenAI from .env
  if (azureOpenAI) {
    return azureOpenAI("gpt-4o");
  }

  // Vercel AI Gateway (final fallback)
  return gateway.languageModel("anthropic/claude-haiku-4.5");
}
