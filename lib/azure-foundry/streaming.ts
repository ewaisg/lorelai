/**
 * Custom streaming infrastructure for Azure AI Foundry
 * Replaces Vercel AI SDK's streamText() with native OpenAI SDK
 */

import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { extractReasoningFromContent } from "./reasoning";

export interface StreamOptions {
  client: OpenAI;
  deployment: string;
  messages: ChatCompletionMessageParam[];
  system?: string;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  activeTools?: string[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  onChunk?: (chunk: StreamChunk) => void;
  onToolCall?: (toolCall: ToolCall) => Promise<any>;
}

export interface StreamChunk {
  type:
    | "text-delta"
    | "tool-call"
    | "tool-result"
    | "reasoning-delta"
    | "finish";
  textDelta?: string;
  reasoningDelta?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  isError?: boolean;
}

/**
 * Stream text from OpenAI-compatible client
 * Yields chunks compatible with existing UI message stream format
 */
export async function* streamFoundryText(
  options: StreamOptions
): AsyncGenerator<StreamChunk> {
  const {
    client,
    deployment,
    messages: inputMessages,
    system,
    tools,
    activeTools,
    temperature,
    maxTokens,
    stopSequences,
    onChunk,
    onToolCall,
  } = options;

  // Prepare messages with system message
  const messages: ChatCompletionMessageParam[] = system
    ? [{ role: "system", content: system }, ...inputMessages]
    : inputMessages;

  // Filter tools if activeTools is specified
  const filteredTools =
    tools && activeTools
      ? tools.filter((tool) => activeTools.includes(tool.function.name))
      : tools;

  try {
    const stream = await client.chat.completions.create({
      model: deployment,
      messages,
      stream: true,
      tools: filteredTools && filteredTools.length > 0 ? filteredTools : undefined,
      temperature,
      max_tokens: maxTokens,
      stop: stopSequences,
    });

    let currentToolCalls: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();
    let textBuffer = "";
    let reasoningBuffer = "";

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;

      // Handle reasoning content (for o1/o3 models)
      if ((delta as any).reasoning_content) {
        const reasoningDelta = (delta as any).reasoning_content;
        reasoningBuffer += reasoningDelta;

        const reasoningChunk: StreamChunk = {
          type: "reasoning-delta",
          reasoningDelta,
        };

        if (onChunk) onChunk(reasoningChunk);
        yield reasoningChunk;
      }

      // Handle text content
      if (delta.content) {
        textBuffer += delta.content;

        // Check for Anthropic-style thinking tags
        const { reasoning, text } = extractReasoningFromContent(delta.content);

        if (reasoning) {
          reasoningBuffer += reasoning;
          const reasoningChunk: StreamChunk = {
            type: "reasoning-delta",
            reasoningDelta: reasoning,
          };
          if (onChunk) onChunk(reasoningChunk);
          yield reasoningChunk;
        }

        if (text) {
          const textChunk: StreamChunk = {
            type: "text-delta",
            textDelta: text,
          };
          if (onChunk) onChunk(textChunk);
          yield textChunk;
        } else if (!reasoning) {
          // No reasoning extracted, yield as-is
          const textChunk: StreamChunk = {
            type: "text-delta",
            textDelta: delta.content,
          };
          if (onChunk) onChunk(textChunk);
          yield textChunk;
        }
      }

      // Handle tool calls
      if (delta.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const index = toolCall.index;
          const existing = currentToolCalls.get(index);

          if (toolCall.id) {
            // New tool call
            currentToolCalls.set(index, {
              id: toolCall.id,
              name: toolCall.function?.name || "",
              arguments: toolCall.function?.arguments || "",
            });
          } else if (existing && toolCall.function?.arguments) {
            // Append to existing tool call arguments
            existing.arguments += toolCall.function.arguments;
          }
        }
      }

      // Handle finish reason
      if (choice.finish_reason) {
        // Process completed tool calls
        if (
          choice.finish_reason === "tool_calls" &&
          currentToolCalls.size > 0
        ) {
          for (const [_, toolCall] of currentToolCalls) {
            const toolCallChunk: StreamChunk = {
              type: "tool-call",
              toolCall: {
                id: toolCall.id,
                type: "function",
                function: {
                  name: toolCall.name,
                  arguments: toolCall.arguments,
                },
              },
            };

            if (onChunk) onChunk(toolCallChunk);
            yield toolCallChunk;

            // Execute tool if handler provided
            if (onToolCall) {
              try {
                const result = await onToolCall(toolCallChunk.toolCall!);
                const toolResultChunk: StreamChunk = {
                  type: "tool-result",
                  toolResult: {
                    toolCallId: toolCall.id,
                    result,
                    isError: false,
                  },
                };
                if (onChunk) onChunk(toolResultChunk);
                yield toolResultChunk;
              } catch (error) {
                const toolResultChunk: StreamChunk = {
                  type: "tool-result",
                  toolResult: {
                    toolCallId: toolCall.id,
                    result:
                      error instanceof Error ? error.message : "Tool execution failed",
                    isError: true,
                  },
                };
                if (onChunk) onChunk(toolResultChunk);
                yield toolResultChunk;
              }
            }
          }
        }

        // Final chunk with finish reason and usage
        const finishChunk: StreamChunk = {
          type: "finish",
          finishReason: choice.finish_reason,
          usage: chunk.usage
            ? {
                promptTokens: chunk.usage.prompt_tokens,
                completionTokens: chunk.usage.completion_tokens,
                totalTokens: chunk.usage.total_tokens,
              }
            : undefined,
        };

        if (onChunk) onChunk(finishChunk);
        yield finishChunk;
      }
    }
  } catch (error) {
    console.error("Streaming error:", error);
    throw error;
  }
}

/**
 * Simple non-streaming text generation
 * Equivalent to generateText() from Vercel AI SDK
 */
export async function generateFoundryText(options: {
  client: OpenAI;
  deployment: string;
  messages: ChatCompletionMessageParam[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ text: string; usage?: any }> {
  const { client, deployment, messages: inputMessages, system, temperature, maxTokens } = options;

  const messages: ChatCompletionMessageParam[] = system
    ? [{ role: "system", content: system }, ...inputMessages]
    : inputMessages;

  const response = await client.chat.completions.create({
    model: deployment,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const text = response.choices[0]?.message?.content || "";

  return {
    text,
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Stream structured object output from OpenAI
 * Equivalent to streamObject() from Vercel AI SDK
 */
export async function* streamFoundryObject<T = any>(options: {
  client: OpenAI;
  deployment: string;
  messages?: ChatCompletionMessageParam[];
  system?: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
}): AsyncGenerator<{ type: "object"; object: Partial<T> } | { type: "finish" }> {
  const {
    client,
    deployment,
    messages: inputMessages,
    system,
    prompt,
    temperature,
    maxTokens,
  } = options;

  // Build messages
  const messages: ChatCompletionMessageParam[] = [];
  if (system) {
    messages.push({ role: "system", content: system });
  }
  if (inputMessages) {
    messages.push(...inputMessages);
  }
  if (prompt) {
    messages.push({ role: "user", content: prompt });
  }

  try {
    const stream = await client.chat.completions.create({
      model: deployment,
      messages,
      stream: true,
      response_format: { type: "json_object" },
      temperature,
      max_tokens: maxTokens,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;

      // Accumulate content
      if (delta.content) {
        fullContent += delta.content;

        // Try to parse partial JSON
        try {
          const parsed = JSON.parse(fullContent);
          yield { type: "object", object: parsed };
        } catch {
          // Not yet valid JSON, continue accumulating
        }
      }

      // Handle finish
      if (choice.finish_reason) {
        // Final parse
        try {
          const parsed = JSON.parse(fullContent);
          yield { type: "object", object: parsed };
        } catch (error) {
          console.error("Failed to parse final JSON:", error);
        }

        yield { type: "finish" };
      }
    }
  } catch (error) {
    console.error("Structured streaming error:", error);
    throw error;
  }
}
