import { sheetPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { streamFoundryObject } from "@/lib/azure-foundry/streaming";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const sheetDocumentHandler = createDocumentHandler<"sheet">({
  kind: "sheet",
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = "";

    const { client, deployment } = (await getArtifactModel(
      session.user.id
    )) as any;

    const stream = streamFoundryObject<{ csv: string }>({
      client,
      deployment,
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

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = "";

    const { client, deployment } = (await getArtifactModel(
      session.user.id
    )) as any;

    const stream = streamFoundryObject<{ csv: string }>({
      client,
      deployment,
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

    return draftContent;
  },
});
