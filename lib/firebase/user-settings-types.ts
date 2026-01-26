// Types for user-specific AI provider and model configurations

export type ProviderType = 'azure-openai' | 'openai' | 'anthropic' | 'google' | 'custom';

export interface AIProvider {
  id: string;
  userId: string;
  name: string; // User-friendly name (e.g., "My Azure OpenAI")
  type: ProviderType;
  enabled: boolean;
  config: ProviderConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderConfig {
  // Azure OpenAI
  azureEndpoint?: string;
  azureApiKey?: string; // Encrypted
  azureApiVersion?: string;

  // OpenAI
  openaiApiKey?: string; // Encrypted
  openaiBaseUrl?: string;

  // Anthropic
  anthropicApiKey?: string; // Encrypted

  // Google
  googleApiKey?: string; // Encrypted
  googleProjectId?: string;

  // Custom/Generic
  customEndpoint?: string;
  customApiKey?: string; // Encrypted
  customHeaders?: Record<string, string>;
}

export interface UserModel {
  id: string;
  userId: string;
  providerId: string; // References AIProvider.id
  modelId: string; // The model identifier (e.g., "gpt-4o", "claude-sonnet-4.5")
  name: string; // User-friendly name
  description?: string;
  enabled: boolean;
  deploymentName?: string; // For Azure deployments
  maxTokens?: number;
  temperature?: number;
  isDefault?: boolean; // Mark one model as default
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  defaultProviderId?: string;
  defaultModelId?: string;
  theme: 'light' | 'dark' | 'system';
  preferences: {
    streamResponse?: boolean;
    showTokenCount?: boolean;
    autoSaveChats?: boolean;
  };
  updatedAt: Date;
}
