import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { streamFoundryText } from "@/lib/azure-foundry/streaming";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = "";

    const { client, deployment } = await getArtifactModel(session.user.id);

    const stream = streamFoundryText({
      client,
      deployment,
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

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = "";

    const { client, deployment } = await getArtifactModel(session.user.id);

    const stream = streamFoundryText({
      client,
      deployment,
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

    return draftContent;
  },
});
