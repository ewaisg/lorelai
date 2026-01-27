/**
 * OpenAI client factory for Microsoft Foundry Models (models-only).
 *
 * Uses the OpenAI Azure client so API key auth works.
 * The Settings UI stores a per-user endpoint + apiKey. The endpoint may be:
 * - Resource endpoint: https://<resource>.services.ai.azure.com
 * - Project endpoint:  https://<resource>.services.ai.azure.com/api/projects/<project>
 *
 * For model inference, we normalize project endpoints to the resource host.
 */

import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";

function normalizeFoundryResourceEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  const projectIdx = trimmed.indexOf("/api/projects/");
  if (projectIdx !== -1) {
    return trimmed.slice(0, projectIdx);
  }
  // If user provided an OpenAI v1 base URL already, try to normalize back to resource host.
  // Examples: https://<resource>.services.ai.azure.com/openai/v1/
  //           https://<resource>.openai.azure.com/openai/v1/
  return trimmed
    .replace(/\/openai\/v1\/?$/i, "")
    .replace(/\/openai\/?$/i, "");
}

/**
 * Get an OpenAI client configured for Foundry Models.
 *
 * @param endpoint - Foundry resource or project endpoint.
 * @param apiKey - Optional API key. If omitted, uses Entra ID token provider.
 */
export async function getOpenAIClient(endpoint: string, apiKey?: string) {
  if (!endpoint) {
    throw new Error("Missing Foundry endpoint. Please configure it in Settings.");
  }

  if (apiKey !== undefined && typeof apiKey !== "string") {
    throw new Error(
      "Invalid Foundry apiKey value stored for this user. Please re-save your Foundry Settings."
    );
  }

  const cleanedApiKey = apiKey?.trim();

  const resourceEndpoint = normalizeFoundryResourceEndpoint(endpoint);

  // This matches the Foundry Models docs examples.
  const apiVersion = process.env.OPENAI_API_VERSION || "2024-10-21";

  try {
    if (cleanedApiKey) {
      return new AzureOpenAI({
        endpoint: resourceEndpoint,
        apiKey: cleanedApiKey,
        apiVersion,
      });
    }

    // Keyless auth (Entra ID) - optional.
    const tokenProvider = getBearerTokenProvider(
      new DefaultAzureCredential(),
      "https://cognitiveservices.azure.com/.default"
    );

    return new AzureOpenAI({
      endpoint: resourceEndpoint,
      azureADTokenProvider: tokenProvider,
      apiVersion,
    });
  } catch (error) {
    console.error("Failed to create Foundry OpenAI client:", error);
    throw new Error(
      `Failed to initialize Foundry OpenAI client: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
