import { createOpenAI } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import {
  getUserLanguageModel,
  getUserAIModels,
  getDefaultModel,
} from "./dynamic-providers";
import {
  getFoundryLanguageModel,
  getFoundryTitleModel,
  getFoundryArtifactModel,
  hasFoundryProject,
} from "@/lib/azure-foundry/model-provider";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Azure OpenAI configuration (legacy fallback)
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

// Check if Azure OpenAI is configured (legacy fallback option)
const isAzureConfigured = !!(AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT);

// Initialize Azure OpenAI client if configured (legacy fallback)
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
 * 2. User's Azure AI Foundry project (NEW - PRIMARY)
 * 3. User's configured models from Firestore (OLD - deprecated)
 * 4. Azure OpenAI from .env (fallback)
 * 5. Error if no models available
 */
export async function getLanguageModel(modelId: string, userId?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  // NEW: Try Azure AI Foundry first (if user has a project configured)
  if (userId) {
    try {
      const hasFoundry = await hasFoundryProject(userId);

      if (hasFoundry) {
        // User has Foundry project - use it
        const { client, deployment } = await getFoundryLanguageModel(
          userId,
          modelId
        );

        // Create a compatibility wrapper for Vercel AI SDK
        // This allows existing streamText() calls to work until Phase 3
        const foundryModel = createOpenAI({
          apiKey: "foundry", // Placeholder - actual auth handled by Foundry client
        })(deployment);

        // Inject the actual Foundry client for use in Phase 3+
        (foundryModel as any).__foundryClient = client;
        (foundryModel as any).__foundryDeployment = deployment;

        if (isReasoningModel) {
          return wrapLanguageModel({
            model: foundryModel,
            middleware: extractReasoningMiddleware({ tagName: "thinking" }),
          });
        }

        return foundryModel;
      }
    } catch (error) {
      console.error("Failed to load Foundry model:", error);
      // Fall through to old system
    }
  }

  // OLD: Try to load from user's configured models (DEPRECATED)
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
      // If user has models configured but this specific one failed, throw error
      const userModels = await getUserAIModels(userId);
      if (userModels.length > 0) {
        throw new Error(
          `Model not found. Please select a valid model from your configured models in Settings.`
        );
      }

      console.warn(`No user models configured, checking fallback options`);
    }
  }

  // Fallback to Azure OpenAI from .env (only if user has no configured models)
  if (azureOpenAI) {
    const azureModelId = modelId.includes("/")
      ? modelId.split("/")[1]
      : modelId;

    const cleanModelId = azureModelId.replace(THINKING_SUFFIX_REGEX, "");

    if (isReasoningModel) {
      return wrapLanguageModel({
        model: azureOpenAI(cleanModelId),
        middleware: extractReasoningMiddleware({ tagName: "thinking" }),
      });
    }

    return azureOpenAI(cleanModelId);
  }

  throw new Error(
    `No AI models configured. Please add an Azure AI Foundry project in Settings, or configure AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in your environment.`
  );
}

export async function getTitleModel(userId?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  // NEW: Try Azure AI Foundry first
  if (userId) {
    try {
      const hasFoundry = await hasFoundryProject(userId);

      if (hasFoundry) {
        const { client, deployment } = await getFoundryTitleModel(userId);

        const foundryModel = createOpenAI({
          apiKey: "foundry",
        })(deployment);

        (foundryModel as any).__foundryClient = client;
        (foundryModel as any).__foundryDeployment = deployment;

        return foundryModel;
      }
    } catch (error) {
      console.error("Failed to load Foundry title model:", error);
    }
  }

  // OLD: Try to use user's first available fast model (DEPRECATED)
  if (userId) {
    try {
      const models = await getUserAIModels(userId);
      const fastModel =
        models.find(
          (m) =>
            m.modelId.toLowerCase().includes("mini") ||
            m.modelId.toLowerCase().includes("flash") ||
            m.modelId.toLowerCase().includes("turbo")
        ) || models[0];

      if (fastModel) {
        return await getUserLanguageModel(userId, fastModel.id);
      }
    } catch (error) {
      console.warn(
        "Failed to load user model for titles, checking fallback:",
        error
      );
    }
  }

  // Fallback to Azure OpenAI from .env
  if (azureOpenAI) {
    return azureOpenAI("gpt-4o-mini");
  }

  throw new Error(
    `No AI models configured for title generation. Please add an Azure AI Foundry project in Settings.`
  );
}

export async function getArtifactModel(userId?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }

  // NEW: Try Azure AI Foundry first
  if (userId) {
    try {
      const hasFoundry = await hasFoundryProject(userId);

      if (hasFoundry) {
        const { client, deployment } = await getFoundryArtifactModel(userId);

        const foundryModel = createOpenAI({
          apiKey: "foundry",
        })(deployment);

        (foundryModel as any).__foundryClient = client;
        (foundryModel as any).__foundryDeployment = deployment;

        return foundryModel;
      }
    } catch (error) {
      console.error("Failed to load Foundry artifact model:", error);
    }
  }

  // OLD: Try to use user's default or first available capable model (DEPRECATED)
  if (userId) {
    try {
      const defaultModel = await getDefaultModel(userId);

      if (defaultModel) {
        return await getUserLanguageModel(userId, defaultModel.id);
      }
    } catch (error) {
      console.warn(
        "Failed to load user model for artifacts, checking fallback:",
        error
      );
    }
  }

  // Fallback to Azure OpenAI from .env
  if (azureOpenAI) {
    return azureOpenAI("gpt-4o");
  }

  throw new Error(
    `No AI models configured for artifacts. Please add an Azure AI Foundry project in Settings.`
  );
}
