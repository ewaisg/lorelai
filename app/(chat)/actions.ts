"use server";

import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";
import { generateFoundryText } from "@/lib/azure-foundry/streaming";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/firebase/queries";
import { getTextFromMessage } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
  userId,
}: {
  message: ChatMessage;
  userId?: string;
}) {
  // Get the Foundry model (returns { client, deployment })
  const model = await getTitleModel(userId);

  // Extract Foundry client if available
  const foundryClient = (model as any).__foundryClient;
  const foundryDeployment = (model as any).__foundryDeployment;

  let text: string;

  if (foundryClient && foundryDeployment) {
    // Use native OpenAI SDK via Foundry
    const result = await generateFoundryText({
      client: foundryClient,
      deployment: foundryDeployment,
      messages: [{ role: "user", content: getTextFromMessage(message) }],
      system: titlePrompt,
    });
    text = result.text;
  } else {
    // Fallback to legacy model system
    // This uses Vercel AI SDK temporarily until all users migrate
    const { generateText } = await import("ai");
    const result = await generateText({
      model,
      system: titlePrompt,
      prompt: getTextFromMessage(message),
    });
    text = result.text;
  }

  return text
    .replace(/^[#*"\s]+/, "")
    .replace(/["]+$/, "")
    .trim();
}

export async function deleteTrailingMessages({
  chatId,
  messageId
}: {
  chatId: string;
  messageId: string;
}) {
  const message = await getMessageById({ chatId, messageId });

  if (!message) {
    throw new Error('Message not found');
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
