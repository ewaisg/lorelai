import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { DEFAULT_CHAT_MODEL } from "./models";
import {
  getFoundryLanguageModel,
  getFoundryTitleModel,
  getFoundryArtifactModel,
  hasFoundryProject,
} from "@/lib/azure-foundry/model-provider";

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

export type FoundryResolvedModel = {
  client: any;
  deployment: string;
};

type TestLanguageModel = typeof myProvider extends {
  languageModels: Record<string, infer LM>;
}
  ? LM
  : never;

/**
 * Resolve a Foundry model for chat.
 *
 * NOTE: This project is being cleaned to Foundry-only; legacy multi-provider
 * support and environment fallbacks have been removed.
 */
export async function getLanguageModel(
  modelId: string,
  userId?: string
): Promise<FoundryResolvedModel | TestLanguageModel> {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId) as TestLanguageModel;
  }

  if (!userId) {
    throw new Error(
      "Missing userId. Azure AI Foundry requires a user-scoped project configuration."
    );
  }

  const hasFoundry = await hasFoundryProject(userId);
  if (!hasFoundry) {
    throw new Error(
      "No Azure AI Foundry project configured. Please add a Foundry project in Settings."
    );
  }

  // If the UI hasn't selected a deployment yet, use the user's default.
  // We also treat legacy cookie values (provider-prefixed) as "use default".
  const shouldUseDefaultDeployment =
    !modelId ||
    modelId === DEFAULT_CHAT_MODEL ||
    modelId.includes("/");

  return getFoundryLanguageModel(userId, shouldUseDefaultDeployment ? undefined : modelId);
}

export async function getTitleModel(userId?: string): Promise<FoundryResolvedModel | TestLanguageModel> {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model") as TestLanguageModel;
  }

  if (!userId) {
    throw new Error(
      "Missing userId. Azure AI Foundry requires a user-scoped project configuration."
    );
  }

  const hasFoundry = await hasFoundryProject(userId);
  if (!hasFoundry) {
    throw new Error(
      "No Azure AI Foundry project configured. Please add a Foundry project in Settings."
    );
  }

  return getFoundryTitleModel(userId);
}

export async function getArtifactModel(userId?: string): Promise<FoundryResolvedModel | TestLanguageModel> {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model") as TestLanguageModel;
  }

  if (!userId) {
    throw new Error(
      "Missing userId. Azure AI Foundry requires a user-scoped project configuration."
    );
  }

  const hasFoundry = await hasFoundryProject(userId);
  if (!hasFoundry) {
    throw new Error(
      "No Azure AI Foundry project configured. Please add a Foundry project in Settings."
    );
  }

  return getFoundryArtifactModel(userId);
}
