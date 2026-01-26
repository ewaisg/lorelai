/**
 * Parse Azure Target URI to extract configuration details
 *
 * Supports two formats:
 *
 * 1. Azure AI Foundry format (openai.azure.com):
 *    https://projectowl-ai-foundry-resource.openai.azure.com/openai/v1/
 *    Uses model name as parameter, no api-version needed
 *
 * 2. Traditional Azure OpenAI format (cognitiveservices.azure.com):
 *    https://resource.cognitiveservices.azure.com/openai/deployments/deployment-name/chat/completions?api-version=2024-05-01-preview
 *    Deployment name in path, requires api-version
 *
 * Extracts:
 * - endpoint: Full base URL including path
 * - deploymentName: Deployment/model name
 * - apiVersion: API version (optional, only for cognitiveservices format)
 */

export interface AzureTargetURIParts {
  endpoint: string;
  deploymentName: string;
  apiVersion?: string;
}

export function parseAzureTargetURI(targetUri: string): AzureTargetURIParts | null {
  try {
    const url = new URL(targetUri);

    // Check if this is Azure AI Foundry format (openai.azure.com)
    if (url.host.includes('.openai.azure.com')) {
      // Extract base endpoint with /openai/v1/ path
      const endpoint = `${url.protocol}//${url.host}/openai/v1/`;

      // For AI Foundry, deployment name is in the path after /deployments/
      // But often the endpoint URL itself is just the base, and model is passed separately
      // Try to extract deployment name from path if present
      const pathMatch = url.pathname.match(/\/deployments\/([^/]+)/);
      const deploymentName = pathMatch ? pathMatch[1] : '';

      return {
        endpoint,
        deploymentName,
        apiVersion: undefined, // AI Foundry doesn't use api-version
      };
    }

    // Traditional cognitiveservices format
    const endpoint = `${url.protocol}//${url.host}`;

    // Extract API version from query parameters
    const apiVersion = url.searchParams.get('api-version');
    if (!apiVersion) {
      return null;
    }

    // Extract deployment name from path
    // Expected path format: /openai/deployments/{deployment-name}/...
    const pathMatch = url.pathname.match(/\/openai\/deployments\/([^/]+)/);
    if (!pathMatch || !pathMatch[1]) {
      return null;
    }

    const deploymentName = pathMatch[1];

    return {
      endpoint,
      deploymentName,
      apiVersion,
    };
  } catch (error) {
    // Invalid URL format
    return null;
  }
}

/**
 * Validate if a string looks like an Azure Target URI
 */
export function isAzureTargetURI(uri: string): boolean {
  try {
    const url = new URL(uri);
    // Azure AI Foundry format OR traditional Azure OpenAI format
    return (
      url.host.includes('.openai.azure.com') ||
      (url.pathname.includes('/openai/deployments/') &&
        url.searchParams.has('api-version'))
    );
  } catch {
    return false;
  }
}
