import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel, type FoundryResolvedModel } from "@/lib/ai/providers";
import { streamFoundryObject } from "@/lib/azure-foundry/streaming";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const codeDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = "";

    const resolved = await getArtifactModel(session.user.id);
    const { client, deployment } = resolved as FoundryResolvedModel;

    // Use native OpenAI-compatible client via Foundry
    const stream = streamFoundryObject<{ code: string }>({
      client,
      deployment,
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

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = "";

    const resolved = await getArtifactModel(session.user.id);
    const { client, deployment } = resolved as FoundryResolvedModel;

    // Use native OpenAI-compatible client via Foundry
    const stream = streamFoundryObject<{ code: string }>({
      client,
      deployment,
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

    return draftContent;
  },
});
