import { z } from "zod";
import { sheetPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { streamFoundryObject } from "@/lib/azure-foundry/streaming";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const sheetDocumentHandler = createDocumentHandler<"sheet">({
  kind: "sheet",
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = "";

    const model = await getArtifactModel(session.user.id);
    const foundryClient = (model as any).__foundryClient;
    const foundryDeployment = (model as any).__foundryDeployment;

    if (foundryClient && foundryDeployment) {
      // Use native OpenAI SDK via Foundry
      const stream = streamFoundryObject<{ csv: string }>({
        client: foundryClient,
        deployment: foundryDeployment,
        system: sheetPrompt,
        prompt: title,
      });

      for await (const delta of stream) {
        if (delta.type === "object") {
          const { csv } = delta.object;

          if (csv) {
            dataStream.write({
              type: "data-sheetDelta",
              data: csv,
              transient: true,
            });

            draftContent = csv;
          }
        }
      }

      dataStream.write({
        type: "data-sheetDelta",
        data: draftContent,
        transient: true,
      });
    } else {
      // Fallback to legacy Vercel AI SDK
      const { streamObject } = await import("ai");
      const { fullStream } = streamObject({
        model,
        system: sheetPrompt,
        prompt: title,
        schema: z.object({
          csv: z.string().describe("CSV data"),
        }),
      });

      for await (const delta of fullStream) {
        if (delta.type === "object") {
          const { csv } = (delta as any).object;

          if (csv) {
            dataStream.write({
              type: "data-sheetDelta",
              data: csv,
              transient: true,
            });

            draftContent = csv;
          }
        }
      }

      dataStream.write({
        type: "data-sheetDelta",
        data: draftContent,
        transient: true,
      });
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
      const stream = streamFoundryObject<{ csv: string }>({
        client: foundryClient,
        deployment: foundryDeployment,
        system: updateDocumentPrompt(document.content, "sheet"),
        prompt: description,
      });

      for await (const delta of stream) {
        if (delta.type === "object") {
          const { csv } = delta.object;

          if (csv) {
            dataStream.write({
              type: "data-sheetDelta",
              data: csv,
              transient: true,
            });

            draftContent = csv;
          }
        }
      }
    } else {
      // Fallback to legacy Vercel AI SDK
      const { streamObject } = await import("ai");
      const { fullStream } = streamObject({
        model,
        system: updateDocumentPrompt(document.content, "sheet"),
        prompt: description,
        schema: z.object({
          csv: z.string(),
        }),
      });

      for await (const delta of fullStream) {
        if (delta.type === "object") {
          const { csv } = (delta as any).object;

          if (csv) {
            dataStream.write({
              type: "data-sheetDelta",
              data: csv,
              transient: true,
            });

            draftContent = csv;
          }
        }
      }
    }

    return draftContent;
  },
});
