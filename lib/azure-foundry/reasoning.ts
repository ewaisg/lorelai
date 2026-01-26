/**
 * Reasoning extraction utilities
 * Handles extraction of reasoning/thinking content from model responses
 */

/**
 * Extract reasoning content from text
 * Supports both Anthropic <thinking> tags and OpenAI o1/o3 reasoning
 */
export function extractReasoningFromContent(content: string): {
  reasoning: string | null;
  text: string;
} {
  // Check for Anthropic-style <thinking> tags
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
  const matches = content.match(thinkingRegex);

  if (matches && matches.length > 0) {
    // Extract all thinking content
    const reasoning = matches
      .map((match) => match.replace(/<\/?thinking>/g, "").trim())
      .join("\n\n");

    // Remove thinking tags from text
    const text = content.replace(thinkingRegex, "").trim();

    return { reasoning, text };
  }

  // For OpenAI o1/o3 models, reasoning is handled separately by the API
  // No extraction needed here - it comes in separate chunks
  return { reasoning: null, text: content };
}

/**
 * Check if a model is a reasoning model
 */
export function isReasoningModel(modelId: string): boolean {
  return (
    modelId.includes("reasoning") ||
    modelId.includes("thinking") ||
    modelId.includes("o1") ||
    modelId.includes("o3")
  );
}
