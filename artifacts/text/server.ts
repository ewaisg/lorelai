import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { streamFoundryText } from "@/lib/azure-foundry/streaming";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = "";

    // Get the Foundry model
    const model = await getArtifactModel(session.user.id);
    const foundryClient = (model as any).__foundryClient;
    const foundryDeployment = (model as any).__foundryDeployment;

    if (foundryClient && foundryDeployment) {
      // Use native OpenAI SDK via Foundry
      const stream = streamFoundryText({
        client: foundryClient,
        deployment: foundryDeployment,
        messages: [{ role: "user", content: title }],
        system:
          "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
      });

      for await (const chunk of stream) {
        if (chunk.type === "text-delta" && chunk.textDelta) {
          draftContent += chunk.textDelta;

          dataStream.write({
            type: "data-textDelta",
            data: chunk.textDelta,
            transient: true,
          });
        }
      }
    } else {
      // Fallback to legacy Vercel AI SDK
      const { streamText, smoothStream } = await import("ai");
      const { fullStream } = streamText({
        model,
        system:
          "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: title,
      });

      for await (const delta of fullStream) {
        if (delta.type === "text-delta") {
          const text = (delta as any).text;
          draftContent += text;

          dataStream.write({
            type: "data-textDelta",
            data: text,
            transient: true,
          });
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = "";

    const model = await getArtifactModel(session.user.id);
    const foundryClient = (model as any).__foundryClient;
    const foundryDeployment = (model as any).__foundryDeployment;

    if (foundryClient && foundryDeployment) {
      // Use native OpenAI SDK via Foundry
      const stream = streamFoundryText({
        client: foundryClient,
        deployment: foundryDeployment,
        messages: [{ role: "user", content: description }],
        system: updateDocumentPrompt(document.content, "text"),
      });

      for await (const chunk of stream) {
        if (chunk.type === "text-delta" && chunk.textDelta) {
          draftContent += chunk.textDelta;

          dataStream.write({
            type: "data-textDelta",
            data: chunk.textDelta,
            transient: true,
          });
        }
      }
    } else {
      // Fallback to legacy Vercel AI SDK
      const { streamText, smoothStream } = await import("ai");
      const { fullStream } = streamText({
        model,
        system: updateDocumentPrompt(document.content, "text"),
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: description,
        providerOptions: {
          openai: {
            prediction: {
              type: "content",
              content: document.content,
            },
          },
        },
      });

      for await (const delta of fullStream) {
        if (delta.type === "text-delta") {
          const text = (delta as any).text;
          draftContent += text;

          dataStream.write({
            type: "data-textDelta",
            data: text,
            transient: true,
          });
        }
      }
    }

    return draftContent;
  },
});
