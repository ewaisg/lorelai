import { z } from "zod";
import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { streamFoundryObject } from "@/lib/azure-foundry/streaming";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const codeDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = "";

    const model = await getArtifactModel(session.user.id);
    const foundryClient = (model as any).__foundryClient;
    const foundryDeployment = (model as any).__foundryDeployment;

    if (foundryClient && foundryDeployment) {
      // Use native OpenAI SDK via Foundry
      const stream = streamFoundryObject<{ code: string }>({
        client: foundryClient,
        deployment: foundryDeployment,
        system: codePrompt,
        prompt: title,
      });

      for await (const delta of stream) {
        if (delta.type === "object") {
          const { code } = delta.object;

          if (code) {
            dataStream.write({
              type: "data-codeDelta",
              data: code,
              transient: true,
            });

            draftContent = code;
          }
        }
      }
    } else {
      // Fallback to legacy Vercel AI SDK
      const { streamObject } = await import("ai");
      const { fullStream } = streamObject({
        model,
        system: codePrompt,
        prompt: title,
        schema: z.object({
          code: z.string(),
        }),
      });

      for await (const delta of fullStream) {
        if (delta.type === "object") {
          const { code } = (delta as any).object;

          if (code) {
            dataStream.write({
              type: "data-codeDelta",
              data: code ?? "",
              transient: true,
            });

            draftContent = code;
          }
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
      const stream = streamFoundryObject<{ code: string }>({
        client: foundryClient,
        deployment: foundryDeployment,
        system: updateDocumentPrompt(document.content, "code"),
        prompt: description,
      });

      for await (const delta of stream) {
        if (delta.type === "object") {
          const { code } = delta.object;

          if (code) {
            dataStream.write({
              type: "data-codeDelta",
              data: code,
              transient: true,
            });

            draftContent = code;
          }
        }
      }
    } else {
      // Fallback to legacy Vercel AI SDK
      const { streamObject } = await import("ai");
      const { fullStream } = streamObject({
        model,
        system: updateDocumentPrompt(document.content, "code"),
        prompt: description,
        schema: z.object({
          code: z.string(),
        }),
      });

      for await (const delta of fullStream) {
        if (delta.type === "object") {
          const { code } = (delta as any).object;

          if (code) {
            dataStream.write({
              type: "data-codeDelta",
              data: code ?? "",
              transient: true,
            });

            draftContent = code;
          }
        }
      }
    }

    return draftContent;
  },
});
