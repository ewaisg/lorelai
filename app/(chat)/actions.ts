"use server";

import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel, type FoundryResolvedModel } from "@/lib/ai/providers";
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
  const resolved = await getTitleModel(userId);

  // This app is configured for Foundry-only in non-test environments.
  const { client, deployment } = resolved as FoundryResolvedModel;

  const result = await generateFoundryText({
    client,
    deployment,
    messages: [{ role: "user", content: getTextFromMessage(message) }],
    system: titlePrompt,
  });

  const text = result.text;

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
