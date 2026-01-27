import { tool, type UIMessageStreamWriter } from "ai";
import type { FirebaseSession as Session } from "@/lib/firebase/types";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/lib/firebase/queries";
import type { Suggestion } from "@/lib/firebase/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { getArtifactModel } from "../providers";
import { streamFoundryObject } from "@/lib/azure-foundry/streaming";

type RequestSuggestionsProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const requestSuggestions = ({
  session,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description:
      "Request writing suggestions for an existing document artifact. Only use this when the user explicitly asks to improve or get suggestions for a document they have already created. Never use for general questions.",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe(
          "The UUID of an existing document artifact that was previously created with createDocument"
        ),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        return {
          error: "Document not found",
        };
      }

      const suggestions: Omit<
        Suggestion,
        "userId" | "createdAt" | "documentCreatedAt"
      >[] = [];

      const { client, deployment } = (await getArtifactModel(
        session.user.id
      )) as any;

      const stream = streamFoundryObject<{
        suggestions: Array<{
          originalSentence: string;
          suggestedSentence: string;
          description: string;
        }>;
      }>({
        client,
        deployment,
        system:
          "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.\n\nReturn a JSON object with a 'suggestions' array. Each item must have: originalSentence, suggestedSentence, description.",
        prompt: document.content,
      });

      for await (const delta of stream) {
        if (delta.type !== "object") continue;

        const items = delta.object?.suggestions;
        if (!Array.isArray(items)) continue;

        for (const element of items) {
          if (
            !element?.originalSentence ||
            !element?.suggestedSentence ||
            !element?.description
          ) {
            continue;
          }

          const suggestion = {
            originalText: element.originalSentence,
            suggestedText: element.suggestedSentence,
            description: element.description,
            id: generateUUID(),
            documentId,
            isResolved: false,
          };

          dataStream.write({
            type: "data-suggestion",
            data: suggestion as Suggestion,
            transient: true,
          });

          suggestions.push(suggestion);
        }
      }

      if (session.user?.id) {
        const userId = session.user.id;

        await saveSuggestions({
          documentId,
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            userId,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
          })),
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: "Suggestions have been added to the document",
      };
    },
  });
