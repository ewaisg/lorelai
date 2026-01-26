import { geolocation } from "@vercel/functions";
import { generateId } from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/lib/firebase/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  createFoundryUIMessageStream,
  createFoundryUIMessageStreamResponse,
} from "@/lib/azure-foundry/ui-message-stream";
import { zodToJsonSchema } from "@/lib/azure-foundry/tools";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/firebase/queries";
import type { DBMessage } from "@/lib/firebase/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

/**
 * Convert UI messages to OpenAI format (simplified - text only)
 * Tool support will be added in Phase 4
 */
function convertToOpenAIMessages(
  uiMessages: ChatMessage[]
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [];

  for (const msg of uiMessages) {
    if (msg.role === "user") {
      // Combine all text parts
      const textContent = msg.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as any).text)
        .join("\n");

      messages.push({
        role: "user",
        content: textContent,
      });
    } else if (msg.role === "assistant") {
      // For now, just extract text parts
      // Tool calls will be handled in Phase 4
      const textContent = msg.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as any).text)
        .join("\n");

      if (textContent) {
        messages.push({
          role: "assistant",
          content: textContent,
        });
      }
    }
  }

  return messages;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message, userId: session.user.id });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes("reasoning") ||
      selectedChatModel.includes("thinking");

    // Get the model
    let model;
    try {
      model = await getLanguageModel(selectedChatModel, session.user.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load AI model. Please check your model configuration in Settings.";

      // Return error response
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const foundryClient = (model as any).__foundryClient;
    const foundryDeployment = (model as any).__foundryDeployment;

    // Check if we should use Foundry or fall back to Vercel SDK
    const useFoundry = Boolean(foundryClient && foundryDeployment);

    if (useFoundry) {
      // USE NEW FOUNDRY STREAMING
      const stream = createFoundryUIMessageStream({
        originalMessages: isToolApprovalFlow ? uiMessages : undefined,
        execute: async ({ writer: dataStream }) => {
          try {
            const openaiMessages = convertToOpenAIMessages(uiMessages);

            // Create tool definitions for Foundry (OpenAI format)
            // Note: Tools require approval, which is handled at the UI level
            const toolDefinitions = isReasoningModel
              ? undefined
              : [
                  {
                    type: "function" as const,
                    function: {
                      name: "getWeather",
                      description: getWeather.description || "",
                      parameters: zodToJsonSchema((getWeather as any).inputSchema),
                    },
                  },
                  {
                    type: "function" as const,
                    function: {
                      name: "createDocument",
                      description:
                        "Create a document for writing or content creation activities",
                      parameters: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          kind: {
                            type: "string",
                            enum: ["text", "code", "sheet"],
                          },
                        },
                        required: ["title", "kind"],
                      },
                    },
                  },
                  {
                    type: "function" as const,
                    function: {
                      name: "updateDocument",
                      description: "Update an existing document",
                      parameters: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          description: { type: "string" },
                        },
                        required: ["id", "description"],
                      },
                    },
                  },
                  {
                    type: "function" as const,
                    function: {
                      name: "requestSuggestions",
                      description: "Request suggestions for the conversation",
                      parameters: {
                        type: "object",
                        properties: {
                          documentId: { type: "string" },
                        },
                        required: ["documentId"],
                      },
                    },
                  },
                ];

            // Stream from OpenAI with tools
            const completionStream = await foundryClient.chat.completions.create({
              model: foundryDeployment,
              messages: [
                {
                  role: "system",
                  content: systemPrompt({ selectedChatModel, requestHints }),
                },
                ...openaiMessages,
              ],
              stream: true,
              tools: toolDefinitions,
            });

            let currentToolCalls: Map<
              number,
              { id: string; name: string; arguments: string }
            > = new Map();

            for await (const chunk of completionStream) {
              const choice = chunk.choices[0];
              if (!choice) continue;

              const delta = choice.delta;

              // Handle text content
              if (delta.content) {
                dataStream.write({
                  type: "text-part",
                  textPart: delta.content,
                });
              }

              // Handle tool calls (accumulate as they stream)
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
                    // Append arguments to existing tool call
                    existing.arguments += toolCall.function.arguments;
                  }
                }
              }

              // Handle finish with tool calls
              // (Tool execution will happen after the stream completes)
            }

            // Execute tools if the model requested them
            if (currentToolCalls.size > 0) {
              const toolResults: Array<{
                tool_call_id: string;
                role: "tool";
                content: string;
              }> = [];

              // Execute each tool
              for (const [_, toolCall] of currentToolCalls) {
                try {
                  let result: any;
                  const args = JSON.parse(toolCall.arguments);

                  // Create context object for tool execution
                  const toolContext = {
                    abortSignal: undefined,
                    messages: uiMessages,
                  };

                  // Wrap dataStream to match UIMessageStreamWriter interface
                  const wrappedDataStream = {
                    ...dataStream,
                    onError: (error: unknown) => {
                      console.error("Tool stream error:", error);
                    },
                  };

                  // Execute the appropriate tool
                  switch (toolCall.name) {
                    case "getWeather":
                      result = await (getWeather.execute as any)(args, toolContext);
                      break;
                    case "createDocument":
                      const createDocTool = createDocument({
                        session,
                        dataStream: wrappedDataStream as any,
                      });
                      result = await (createDocTool.execute as any)(args, toolContext);
                      break;
                    case "updateDocument":
                      const updateDocTool = updateDocument({
                        session,
                        dataStream: wrappedDataStream as any,
                      });
                      result = await (updateDocTool.execute as any)(args, toolContext);
                      break;
                    case "requestSuggestions":
                      const suggestTool = requestSuggestions({
                        session,
                        dataStream: wrappedDataStream as any,
                      });
                      result = await (suggestTool.execute as any)(args, toolContext);
                      break;
                    default:
                      result = { error: `Unknown tool: ${toolCall.name}` };
                  }

                  toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: JSON.stringify(result),
                  });
                } catch (error) {
                  // If tool execution fails, report the error
                  toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: JSON.stringify({
                      error: error instanceof Error ? error.message : "Tool execution failed",
                    }),
                  });
                }
              }

              // Build continuation messages with tool results
              const systemMessage = {
                role: "system" as const,
                content: systemPrompt({ selectedChatModel, requestHints }),
              };

              // Create assistant message with tool calls
              const assistantToolMessage: ChatCompletionMessageParam = {
                role: "assistant" as const,
                tool_calls: Array.from(currentToolCalls.values()).map((tc) => ({
                  id: tc.id,
                  type: "function" as const,
                  function: {
                    name: tc.name,
                    arguments: tc.arguments,
                  },
                })),
              };

              // Make continuation call with tool results
              const continuationMessages: ChatCompletionMessageParam[] = [
                systemMessage,
                ...openaiMessages,
                assistantToolMessage,
                ...toolResults,
              ];

              const continuationStream = await foundryClient.chat.completions.create({
                model: foundryDeployment,
                messages: continuationMessages,
                stream: true,
                tools: toolDefinitions,
              });

              // Reset tool calls for potential multi-turn
              currentToolCalls.clear();

              // Stream the continuation response
              for await (const continuationChunk of continuationStream) {
                const continuationChoice = continuationChunk.choices[0];
                if (!continuationChoice) continue;

                const continuationDelta = continuationChoice.delta;

                // Handle text content from continuation
                if (continuationDelta.content) {
                  dataStream.write({
                    type: "text-part",
                    textPart: continuationDelta.content,
                  });
                }

                // Handle potential additional tool calls (multi-turn)
                if (continuationDelta.tool_calls) {
                  for (const toolCall of continuationDelta.tool_calls) {
                    const index = toolCall.index;
                    const existing = currentToolCalls.get(index);

                    if (toolCall.id) {
                      currentToolCalls.set(index, {
                        id: toolCall.id,
                        name: toolCall.function?.name || "",
                        arguments: toolCall.function?.arguments || "",
                      });
                    } else if (existing && toolCall.function?.arguments) {
                      existing.arguments += toolCall.function.arguments;
                    }
                  }
                }

                // If continuation also needs tools, signal to UI
                // (Full multi-turn will be handled in Phase 5 with approval UI)
                if (
                  continuationChoice.finish_reason === "tool_calls" &&
                  currentToolCalls.size > 0
                ) {
                  for (const [_, toolCall] of currentToolCalls) {
                    dataStream.write({
                      type: "text-part",
                      textPart: `\n\n[Additional Tool: ${toolCall.name} - Requires Approval]\n`,
                    });
                  }
                }
              }
            }

            // Handle title generation
            if (titlePromise) {
              const title = await titlePromise;
              dataStream.write({ type: "data-chat-title", data: title });
              updateChatTitleById({ chatId: id, title });
            }

            dataStream.write({ type: "finish" });
          } catch (error) {
            console.error("Streaming error:", error);
            dataStream.write({
              type: "error",
              error: error instanceof Error ? error.message : "Streaming failed",
            });
          }
        },
        generateId: generateUUID,
        onFinish: async ({ messages: finishedMessages }) => {
          if (isToolApprovalFlow) {
            for (const finishedMsg of finishedMessages) {
              const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
              if (existingMsg) {
                await updateMessage({
                  id: finishedMsg.id,
                  parts: finishedMsg.parts,
                  chatId: id,
                });
              } else {
                await saveMessages({
                  messages: [
                    {
                      id: finishedMsg.id,
                      role: finishedMsg.role,
                      parts: finishedMsg.parts,
                      createdAt: new Date(),
                      attachments: [],
                      chatId: id,
                    },
                  ],
                });
              }
            }
          } else if (finishedMessages.length > 0) {
            await saveMessages({
              messages: finishedMessages.map((currentMessage) => ({
                id: currentMessage.id,
                role: currentMessage.role,
                parts: currentMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              })),
            });
          }
        },
        onError: () => "Oops, an error occurred!",
      });

      return createFoundryUIMessageStreamResponse({
        stream,
        async consumeSseStream({ stream: sseStream }) {
          if (!process.env.REDIS_URL) {
            return;
          }
          try {
            const streamContext = getStreamContext();
            if (streamContext) {
              const streamId = generateId();
              await createStreamId({ streamId, chatId: id });
              await streamContext.createNewResumableStream(
                streamId,
                () => sseStream
              );
            }
          } catch (_) {
            // ignore redis errors
          }
        },
      });
    } else {
      // FALLBACK TO LEGACY VERCEL AI SDK
      const {
        convertToModelMessages,
        createUIMessageStream,
        createUIMessageStreamResponse,
        streamText,
        stepCountIs,
      } = await import("ai");

      const modelMessages = await convertToModelMessages(uiMessages);

      const stream = createUIMessageStream({
        originalMessages: isToolApprovalFlow ? uiMessages : undefined,
        execute: async ({ writer: dataStream }) => {
          const result = streamText({
            model,
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: modelMessages,
            stopWhen: stepCountIs(5),
            experimental_activeTools: isReasoningModel
              ? []
              : [
                  "getWeather",
                  "createDocument",
                  "updateDocument",
                  "requestSuggestions",
                ],
            providerOptions: isReasoningModel
              ? {
                  anthropic: {
                    thinking: { type: "enabled", budgetTokens: 10_000 },
                  },
                }
              : undefined,
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({ session, dataStream }),
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: "stream-text",
            },
          });

          dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

          if (titlePromise) {
            const title = await titlePromise;
            dataStream.write({ type: "data-chat-title", data: title });
            updateChatTitleById({ chatId: id, title });
          }
        },
        generateId: generateUUID,
        onFinish: async ({ messages: finishedMessages }) => {
          if (isToolApprovalFlow) {
            for (const finishedMsg of finishedMessages) {
              const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
              if (existingMsg) {
                await updateMessage({
                  id: finishedMsg.id,
                  parts: finishedMsg.parts,
                  chatId: id,
                });
              } else {
                await saveMessages({
                  messages: [
                    {
                      id: finishedMsg.id,
                      role: finishedMsg.role,
                      parts: finishedMsg.parts,
                      createdAt: new Date(),
                      attachments: [],
                      chatId: id,
                    },
                  ],
                });
              }
            }
          } else if (finishedMessages.length > 0) {
            await saveMessages({
              messages: finishedMessages.map((currentMessage) => ({
                id: currentMessage.id,
                role: currentMessage.role,
                parts: currentMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              })),
            });
          }
        },
        onError: () => "Oops, an error occurred!",
      });

      return createUIMessageStreamResponse({
        stream,
        async consumeSseStream({ stream: sseStream }) {
          if (!process.env.REDIS_URL) {
            return;
          }
          try {
            const streamContext = getStreamContext();
            if (streamContext) {
              const streamId = generateId();
              await createStreamId({ streamId, chatId: id });
              await streamContext.createNewResumableStream(
                streamId,
                () => sseStream
              );
            }
          } catch (_) {
            // ignore redis errors
          }
        },
      });
    }
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
