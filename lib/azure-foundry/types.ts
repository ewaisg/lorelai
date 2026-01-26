/**
 * Azure AI Foundry types for project-based configuration
 */

export interface FoundryProject {
  id: string;
  userId: string;
  name: string; // User-friendly name (e.g., "My AI Project")
  endpoint: string; // https://resource.services.ai.azure.com/api/projects/project-name
  apiKey?: string; // Optional - can use Entra ID instead
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoundryDeployment {
  id: string;
  projectId: string; // References FoundryProject.id
  deploymentName: string; // e.g., "gpt-4o", "gpt-4o-mini"
  modelName: string; // e.g., "gpt-4o"
  modelPublisher?: string; // e.g., "openai", "meta"
  capabilities?: string[]; // e.g., ["chat", "completion"]
  isDefault?: boolean; // Mark one deployment as default
  maxTokens?: number;
  temperature?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoundryModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface FoundryConnection {
  id: string;
  projectId: string;
  name: string;
  connectionType: string; // e.g., "AzureOpenAI", "AzureAISearch"
  properties: Record<string, any>;
}
