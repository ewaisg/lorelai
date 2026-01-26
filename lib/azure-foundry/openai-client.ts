/**
 * OpenAI client factory for Azure AI Foundry
 * Creates direct connections to Azure OpenAI
 */

import { AzureOpenAI } from "openai";

/**
 * Get an OpenAI client for Azure OpenAI
 *
 * This creates a direct connection to Azure OpenAI, bypassing the Foundry SDK routing
 * which has known issues with the api-version query parameter.
 *
 * @param projectEndpoint - Full project endpoint (e.g., https://resource.services.ai.azure.com/api/projects/project-name)
 * @param apiKey - API key for authentication
 * @returns OpenAI client instance configured for Azure
 */
export async function getOpenAIClient(
  projectEndpoint: string,
  apiKey?: string
) {
  try {
    // Extract the Azure resource endpoint from the project endpoint
    // Format: https://resource-name.services.ai.azure.com/api/projects/project-name
    // We need: https://resource-name.openai.azure.com
    const url = new URL(projectEndpoint);
    const hostname = url.hostname;

    // Extract resource name from hostname
    // Format: resource-name.services.ai.azure.com -> resource-name
    const resourceName = hostname.split('.')[0];

    // Construct Azure OpenAI endpoint
    const azureEndpoint = `https://${resourceName}.openai.azure.com`;

    if (!apiKey) {
      throw new Error(
        "API key is required for Azure OpenAI connection. Please configure your Foundry project with an API key."
      );
    }

    // Create Azure OpenAI client
    const openaiClient = new AzureOpenAI({
      apiKey,
      endpoint: azureEndpoint,
      apiVersion: "2024-12-01-preview",
    });

    console.log("Azure OpenAI client created with endpoint:", azureEndpoint);

    return openaiClient;
  } catch (error) {
    console.error("Failed to create Azure OpenAI client:", error);
    throw new Error(
      `Failed to initialize OpenAI client: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
