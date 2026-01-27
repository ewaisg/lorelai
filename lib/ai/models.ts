// Foundry-only: model selection maps to Foundry deployment names.
// This default uses the user's configured default deployment on the server.
// Foundry-only app: chat uses a deployment name. This sentinel means
// "use the user's default Foundry deployment".
export const DEFAULT_CHAT_MODEL = "foundry/default";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: DEFAULT_CHAT_MODEL,
    name: "Default (Foundry)",
    provider: "azure",
    description: "Uses your default Foundry deployment",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
