/**
 * Azure AI Foundry client factory
 * Manages AIProjectClient instances with caching
 */

import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import type { TokenCredential } from "@azure/core-auth";

// Cache clients per project endpoint to avoid recreating them
const clientCache = new Map<string, AIProjectClient>();

/**
 * Get or create an AIProjectClient for a Foundry project
 *
 * @param projectEndpoint - Full project endpoint (e.g., https://resource.services.ai.azure.com/api/projects/project-name)
 * @param apiKey - Optional API key. If not provided, uses Entra ID (DefaultAzureCredential)
 * @returns AIProjectClient instance
 */
export async function getFoundryProjectClient(
  projectEndpoint: string,
  apiKey?: string
): Promise<AIProjectClient> {
  // Validate endpoint format
  if (!projectEndpoint || !projectEndpoint.includes("/api/projects/")) {
    throw new Error(
      `Invalid Foundry project endpoint: ${projectEndpoint}. Expected format: https://resource.services.ai.azure.com/api/projects/project-name`
    );
  }

  // Create cache key
  const cacheKey = `${projectEndpoint}:${apiKey ? "key" : "entra"}`;

  // Return cached client if exists
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  // Create credential based on authentication method
  let credential: TokenCredential;
  if (apiKey) {
    // Use API key authentication
    // Create a custom TokenCredential that returns the API key
    credential = {
      getToken: async () => ({
        token: apiKey,
        expiresOnTimestamp: Date.now() + 3600000, // 1 hour from now
      }),
    };
  } else {
    // Use Entra ID (Azure AD) authentication
    // This requires the service to be running in an Azure environment
    // or with Azure CLI logged in for local development
    credential = new DefaultAzureCredential();
  }

  // Create new client
  // Note: The SDK should automatically add the required api-version query parameter
  // If you see "Missing required query parameter: api-version" errors,
  // it may indicate an SDK version issue or authentication problem
  const client = new AIProjectClient(projectEndpoint, credential);

  // Cache the client
  clientCache.set(cacheKey, client);

  return client;
}

/**
 * List all deployments available in a Foundry project
 *
 * @param projectEndpoint - Full project endpoint
 * @param apiKey - Optional API key
 * @returns Array of deployment information
 */
export async function listDeployments(
  projectEndpoint: string,
  apiKey?: string
): Promise<
  Array<{
    name: string;
    model: string;
    publisher?: string;
    version?: string;
    type?: string;
  }>
> {
  try {
    const client = await getFoundryProjectClient(projectEndpoint, apiKey);

    const deployments = await client.deployments.list();

    const result = [];
    for await (const deployment of deployments) {
      // Type guard to check if this is a ModelDeployment
      if (
        deployment.type === "ModelDeployment" &&
        "modelName" in deployment
      ) {
        result.push({
          name: deployment.name,
          model: deployment.modelName,
          publisher: deployment.modelPublisher,
          version: deployment.modelVersion,
          type: deployment.type,
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to list deployments:", error);
    throw new Error(
      `Failed to list deployments from Foundry project: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Test connection to a Foundry project
 *
 * @param projectEndpoint - Full project endpoint
 * @param apiKey - Optional API key
 * @returns Object with connection status and details
 */
export async function testConnection(
  projectEndpoint: string,
  apiKey?: string
): Promise<{
  success: boolean;
  deploymentsCount: number;
  deployments: Array<{ name: string; model: string }>;
  error?: string;
}> {
  try {
    const deployments = await listDeployments(projectEndpoint, apiKey);

    return {
      success: true,
      deploymentsCount: deployments.length,
      deployments: deployments.map((d) => ({
        name: d.name,
        model: d.model,
      })),
    };
  } catch (error) {
    return {
      success: false,
      deploymentsCount: 0,
      deployments: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clear the client cache
 * Useful for testing or when credentials change
 */
export function clearClientCache(): void {
  clientCache.clear();
}

/**
 * Get a specific deployment by name
 *
 * @param projectEndpoint - Full project endpoint
 * @param deploymentName - Name of the deployment
 * @param apiKey - Optional API key
 * @returns Deployment information or null if not found
 */
export async function getDeployment(
  projectEndpoint: string,
  deploymentName: string,
  apiKey?: string
): Promise<{
  name: string;
  model: string;
  publisher?: string;
  version?: string;
} | null> {
  try {
    const client = await getFoundryProjectClient(projectEndpoint, apiKey);

    const deployment = await client.deployments.get(deploymentName);

    if (deployment.type === "ModelDeployment" && "modelName" in deployment) {
      return {
        name: deployment.name,
        model: deployment.modelName,
        publisher: deployment.modelPublisher,
        version: deployment.modelVersion,
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to get deployment ${deploymentName}:`, error);
    return null;
  }
}
