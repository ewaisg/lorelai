/**
 * Azure AI Foundry model provider
 * Provides OpenAI clients configured for user's Foundry projects
 */

import { getOpenAIClient } from "./openai-client";
import {
  getUserFoundryProject,
  getDefaultDeployment,
  getProjectDeployments,
} from "@/lib/firebase/foundry-project-queries";

/**
 * Get a configured OpenAI client for a user's Foundry project
 *
 * @param userId - User ID to get project for
 * @param deploymentName - Optional specific deployment name to use
 * @returns Object with OpenAI client and deployment name
 * @throws Error if no project configured or deployment not found
 */
export async function getFoundryLanguageModel(
  userId: string,
  deploymentName?: string
): Promise<{ client: any; deployment: string }> {
  // Get user's Foundry project
  const project = await getUserFoundryProject(userId);

  if (!project || !project.enabled) {
    throw new Error(
      "No Azure AI Foundry project configured. Please add a project in Settings."
    );
  }

  // Get OpenAI client from the project
  const client = await getOpenAIClient(project.endpoint, project.apiKey);

  // Determine which deployment to use
  let deployment = deploymentName;

  if (!deployment) {
    // Try to get default deployment
    const defaultDep = await getDefaultDeployment(project.id);

    if (defaultDep) {
      deployment = defaultDep.deploymentName;
    } else {
      // No default set, try to get first available deployment
      const deployments = await getProjectDeployments(project.id);

      if (deployments.length > 0) {
        deployment = deployments[0].deploymentName;
      } else {
        // Fallback to a common model name
        deployment = "gpt-4o";
      }
    }
  }

  return { client, deployment };
}

/**
 * Get model for title generation (prefers fast models like gpt-4o-mini)
 *
 * @param userId - User ID to get project for
 * @returns Object with OpenAI client and deployment name
 */
export async function getFoundryTitleModel(
  userId: string
): Promise<{ client: any; deployment: string }> {
  const project = await getUserFoundryProject(userId);

  if (!project || !project.enabled) {
    throw new Error(
      "No Azure AI Foundry project configured. Please add a project in Settings."
    );
  }

  const client = await getOpenAIClient(project.endpoint, project.apiKey);

  // Try to find a fast model for titles
  const deployments = await getProjectDeployments(project.id);

  // Preferred fast models for title generation (in order of preference)
  const preferredModels = [
    "gpt-4o-mini",
    "gpt-35-turbo",
    "gpt-3.5-turbo",
    "gpt-4o",
  ];

  // Try to find a preferred model
  for (const preferredModel of preferredModels) {
    const found = deployments.find(
      (d) =>
        d.deploymentName.includes(preferredModel) ||
        d.modelName?.includes(preferredModel)
    );

    if (found) {
      return { client, deployment: found.deploymentName };
    }
  }

  // Fallback to default or first deployment
  const defaultDep = await getDefaultDeployment(project.id);
  if (defaultDep) {
    return { client, deployment: defaultDep.deploymentName };
  }

  if (deployments.length > 0) {
    return { client, deployment: deployments[0].deploymentName };
  }

  // Ultimate fallback
  return { client, deployment: "gpt-4o-mini" };
}

/**
 * Get model for artifact generation
 * Uses the same logic as language model
 *
 * @param userId - User ID to get project for
 * @returns Object with OpenAI client and deployment name
 */
export async function getFoundryArtifactModel(
  userId: string
): Promise<{ client: any; deployment: string }> {
  // For artifact generation, use the same as language model
  // You could implement different logic here if needed
  return getFoundryLanguageModel(userId);
}

/**
 * Check if a user has a Foundry project configured
 *
 * @param userId - User ID to check
 * @returns True if user has an enabled Foundry project
 */
export async function hasFoundryProject(userId: string): Promise<boolean> {
  try {
    const project = await getUserFoundryProject(userId);
    return project !== null && project.enabled;
  } catch {
    return false;
  }
}

/**
 * Get project endpoint and API key for a user
 * Useful for direct API access
 *
 * @param userId - User ID to get credentials for
 * @returns Project endpoint and optional API key
 */
export async function getFoundryCredentials(
  userId: string
): Promise<{ endpoint: string; apiKey?: string } | null> {
  const project = await getUserFoundryProject(userId);

  if (!project || !project.enabled) {
    return null;
  }

  return {
    endpoint: project.endpoint,
    apiKey: project.apiKey,
  };
}
