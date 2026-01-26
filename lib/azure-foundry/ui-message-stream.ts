/**
 * UI message stream replacement for Vercel AI SDK
 * Creates ReadableStream compatible with existing UI expectations
 */

import type { ChatMessage } from "@/lib/types";

export interface DataStreamWriter {
  write: (chunk: DataStreamChunk) => void;
  merge: (stream: ReadableStream) => void;
}

export type DataStreamChunk =
  | { type: "text-part"; textPart: string }
  | { type: "reasoning-part"; reasoningPart: string }
  | { type: "data-chat-title"; data: string }
  | { type: "data-textDelta"; data: string; transient?: boolean }
  | { type: "finish"; finishReason?: string }
  | { type: "error"; error: string };

// Tool types removed - will be added in Phase 4

export interface CreateUIMessageStreamOptions {
  originalMessages?: ChatMessage[];
  execute: (context: { writer: DataStreamWriter }) => Promise<void>;
  generateId?: () => string;
  onFinish?: (context: { messages: ChatMessage[] }) => Promise<void>;
  onError?: (error: Error) => string;
}

/**
 * Create a UI message stream compatible with existing UI
 * Replaces createUIMessageStream() from Vercel AI SDK
 */
export function createFoundryUIMessageStream(
  options: CreateUIMessageStreamOptions
): ReadableStream {
  const { originalMessages = [], execute, generateId, onFinish, onError } = options;

  let controller: ReadableStreamDefaultController;
  const messages: ChatMessage[] = [...originalMessages];
  let currentMessage: Partial<ChatMessage> | null = null;

  const encoder = new TextEncoder();

  // Helper to write SSE-formatted data
  const writeSSE = (event: string, data: any) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
  };

  // DataStream writer implementation
  const writer: DataStreamWriter = {
    write: (chunk: DataStreamChunk) => {
      switch (chunk.type) {
        case "text-part":
          if (!currentMessage) {
            currentMessage = {
              id: generateId ? generateId() : crypto.randomUUID(),
              role: "assistant",
              parts: [{ type: "text", text: "" }],
            };
          }

          // Append to current text part
          const textPart = currentMessage.parts?.[0];
          if (textPart && textPart.type === "text") {
            textPart.text += chunk.textPart;
          }

          writeSSE("text-delta", { delta: chunk.textPart });
          break;

        case "reasoning-part":
          writeSSE("reasoning-delta", { delta: chunk.reasoningPart });
          break;

        // Tool support removed for Phase 3 - will be added in Phase 4

        case "data-chat-title":
          writeSSE("data", {
            type: "chat-title",
            data: chunk.data,
          });
          break;

        case "data-textDelta":
          writeSSE("data", {
            type: "textDelta",
            data: chunk.data,
            transient: chunk.transient,
          });
          break;

        case "finish":
          if (currentMessage && currentMessage.parts) {
            messages.push(currentMessage as ChatMessage);
          }
          currentMessage = null;
          break;

        case "error":
          writeSSE("error", { error: chunk.error });
          break;
      }
    },

    merge: (stream: ReadableStream) => {
      // Merge another stream into this one
      const reader = stream.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error("Error merging stream:", error);
        }
      };

      pump();
    },
  };

  return new ReadableStream({
    async start(ctrl) {
      controller = ctrl;

      try {
        // Execute the streaming function
        await execute({ writer });

        // Call onFinish if provided
        if (onFinish) {
          await onFinish({ messages });
        }

        // Send finish event
        writeSSE("finish", { finishReason: "stop" });
        controller.close();
      } catch (error) {
        const errorMessage =
          onError?.(error as Error) || "An error occurred during streaming";

        writeSSE("error", { error: errorMessage });
        controller.error(error);
      }
    },

    cancel() {
      // Handle stream cancellation
    },
  });
}

/**
 * Create a Response object from UI message stream
 * Replaces createUIMessageStreamResponse() from Vercel AI SDK
 */
export function createFoundryUIMessageStreamResponse(options: {
  stream: ReadableStream;
  consumeSseStream?: (context: { stream: ReadableStream }) => Promise<void>;
}): Response {
  const { stream, consumeSseStream } = options;

  // If consumeSseStream is provided, tee the stream and consume one branch
  if (consumeSseStream) {
    const [stream1, stream2] = stream.tee();

    // Consume one branch asynchronously
    consumeSseStream({ stream: stream1 }).catch((error) => {
      console.error("Error consuming SSE stream:", error);
    });

    // Return the other branch as response
    return new Response(stream2, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Return stream as response
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
