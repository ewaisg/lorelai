'use server';

import { adminDb } from './config';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ArtifactKind } from '@/components/artifact';

// ========================================
// Type Definitions
// ========================================

export type DBMessage = {
  id: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: Date;
};

export type Chat = {
  id: string;
  userId: string;
  title: string;
  visibility: 'public' | 'private';
  createdAt: Date;
};

export type Document = {
  id: string;
  userId: string;
  title: string;
  content: string;
  kind: ArtifactKind;
  createdAt: Date;
};

export type Suggestion = {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
};

export type Vote = {
  messageId: string;
  chatId: string;
  isUpvoted: boolean;
  createdAt: Date;
};

// ========================================
// User Operations
// ========================================

export async function getFirebaseUser(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Failed to get user:', error);
    throw new Error('Failed to get user');
  }
}

export async function getFirebaseUserByEmail(email: string) {
  try {
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return null;
    }

    const userDoc = usersSnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Failed to get user by email:', error);
    throw new Error('Failed to get user by email');
  }
}

// ========================================
// Chat Operations
// ========================================

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: 'public' | 'private';
}) {
  try {
    await adminDb
      .collection('chats')
      .doc(id)
      .set({
        userId,
        title,
        visibility,
        createdAt: FieldValue.serverTimestamp(),
      });

    return { id };
  } catch (error) {
    console.error('Failed to save chat:', error);
    throw new Error('Failed to save chat');
  }
}

export async function getChatById({ id }: { id: string }): Promise<Chat | null> {
  try {
    const chatDoc = await adminDb.collection('chats').doc(id).get();

    if (!chatDoc.exists) {
      return null;
    }

    const data = chatDoc.data();
    return {
      id: chatDoc.id,
      userId: data?.userId as string,
      title: data?.title as string,
      visibility: data?.visibility as 'public' | 'private',
      createdAt: data?.createdAt?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('Failed to get chat by ID:', error);
    throw new Error('Failed to get chat by ID');
  }
}

export async function getChatsByUserId({
  id,
  limit = 50,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit?: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}) {
  try {
    let query = adminDb
      .collection('chats')
      .where('userId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(limit + 1); // Fetch one extra to check if there are more

    if (startingAfter) {
      const startDoc = await adminDb.collection('chats').doc(startingAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    } else if (endingBefore) {
      const endDoc = await adminDb.collection('chats').doc(endingBefore).get();
      if (endDoc.exists) {
        query = query.endBefore(endDoc);
      }
    }

    const chatsSnapshot = await query.get();
    const chats = chatsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });

    const hasMore = chats.length > limit;
    return {
      chats: hasMore ? chats.slice(0, limit) : chats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user ID:', error);
    throw new Error('Failed to get chats by user ID');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const batch = adminDb.batch();

    // Delete messages subcollection
    const messagesSnapshot = await adminDb
      .collection('chats')
      .doc(id)
      .collection('messages')
      .get();

    messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete votes subcollection
    const votesSnapshot = await adminDb
      .collection('chats')
      .doc(id)
      .collection('votes')
      .get();

    votesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete streams subcollection
    const streamsSnapshot = await adminDb
      .collection('chats')
      .doc(id)
      .collection('streams')
      .get();

    streamsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete chat document
    const chatRef = adminDb.collection('chats').doc(id);
    batch.delete(chatRef);

    await batch.commit();

    return { id };
  } catch (error) {
    console.error('Failed to delete chat by ID:', error);
    throw new Error('Failed to delete chat by ID');
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const chatsSnapshot = await adminDb
      .collection('chats')
      .where('userId', '==', userId)
      .get();

    if (chatsSnapshot.empty) {
      return { deletedCount: 0 };
    }

    // Delete each chat (this will also delete subcollections)
    const deletePromises = chatsSnapshot.docs.map((doc) =>
      deleteChatById({ id: doc.id })
    );

    await Promise.all(deletePromises);

    return { deletedCount: chatsSnapshot.size };
  } catch (error) {
    console.error('Failed to delete all chats by user ID:', error);
    throw new Error('Failed to delete all chats by user ID');
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    await adminDb.collection('chats').doc(chatId).update({ visibility });
    return { success: true };
  } catch (error) {
    console.error('Failed to update chat visibility:', error);
    throw new Error('Failed to update chat visibility');
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    await adminDb.collection('chats').doc(chatId).update({ title });
    return { success: true };
  } catch (error) {
    console.error('Failed to update chat title:', error);
    return { success: false };
  }
}

// ========================================
// Message Operations
// ========================================

export async function saveMessages({
  messages,
}: {
  messages: DBMessage[];
}) {
  try {
    const batch = adminDb.batch();

    messages.forEach((message) => {
      const { chatId, ...messageData } = message;
      const messageRef = adminDb
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(message.id);

      batch.set(messageRef, {
        ...messageData,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Failed to save messages:', error);
    throw new Error('Failed to save messages');
  }
}

export async function updateMessage({
  id,
  parts,
  chatId,
}: {
  id: string;
  parts: any;
  chatId?: string;
}) {
  try {
    // If chatId is not provided, we need to find the message to get its chatId
    // For now, we require chatId to be passed for efficiency
    if (!chatId) {
      throw new Error('chatId is required for updateMessage');
    }

    await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(id)
      .update({ parts });

    return { success: true };
  } catch (error) {
    console.error('Failed to update message:', error);
    throw new Error('Failed to update message');
  }
}

export async function getMessagesByChatId({ id }: { id: string }): Promise<DBMessage[]> {
  try {
    const messagesSnapshot = await adminDb
      .collection('chats')
      .doc(id)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    return messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        chatId: id,
        role: data.role as string,
        parts: data.parts,
        attachments: data.attachments || [],
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });
  } catch (error) {
    console.error('Failed to get messages by chat ID:', error);
    throw new Error('Failed to get messages by chat ID');
  }
}

export async function getMessageById({ chatId, messageId }: { chatId: string; messageId: string }) {
  try {
    const messageDoc = await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      return null;
    }

    const data = messageDoc.data();
    return {
      id: messageDoc.id,
      chatId: chatId,
      ...data,
      createdAt: data?.createdAt?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('Failed to get message by ID:', error);
    throw new Error('Failed to get message by ID');
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesSnapshot = await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .where('createdAt', '>=', Timestamp.fromDate(timestamp))
      .get();

    if (messagesSnapshot.empty) {
      return { success: true };
    }

    const batch = adminDb.batch();

    // Delete associated votes
    for (const messageDoc of messagesSnapshot.docs) {
      const voteDoc = await adminDb
        .collection('chats')
        .doc(chatId)
        .collection('votes')
        .doc(messageDoc.id)
        .get();

      if (voteDoc.exists) {
        batch.delete(voteDoc.ref);
      }

      batch.delete(messageDoc.ref);
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Failed to delete messages after timestamp:', error);
    throw new Error('Failed to delete messages after timestamp');
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const hoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    // Get all chats by user
    const chatsSnapshot = await adminDb
      .collection('chats')
      .where('userId', '==', id)
      .get();

    if (chatsSnapshot.empty) {
      return 0;
    }

    let count = 0;

    // Count messages across all chats
    for (const chatDoc of chatsSnapshot.docs) {
      const messagesSnapshot = await adminDb
        .collection('chats')
        .doc(chatDoc.id)
        .collection('messages')
        .where('createdAt', '>=', Timestamp.fromDate(hoursAgo))
        .where('role', '==', 'user')
        .get();

      count += messagesSnapshot.size;
    }

    return count;
  } catch (error) {
    console.error('Failed to get message count by user ID:', error);
    throw new Error('Failed to get message count by user ID');
  }
}

// ========================================
// Vote Operations
// ========================================

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('votes')
      .doc(messageId)
      .set(
        {
          messageId,
          isUpvoted: type === 'up',
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return { success: true };
  } catch (error) {
    console.error('Failed to vote message:', error);
    throw new Error('Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const votesSnapshot = await adminDb
      .collection('chats')
      .doc(id)
      .collection('votes')
      .get();

    return votesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        messageId: doc.id,
        chatId: id,
        ...data,
      };
    });
  } catch (error) {
    console.error('Failed to get votes by chat ID:', error);
    throw new Error('Failed to get votes by chat ID');
  }
}

// ========================================
// Document Operations
// ========================================

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const docRef = adminDb.collection('documents').doc(id);

    await docRef.set({
      title,
      kind,
      content,
      userId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return [{ id }];
  } catch (error) {
    console.error('Failed to save document:', error);
    throw new Error('Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }): Promise<Document[]> {
  try {
    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('id', '==', id)
      .orderBy('createdAt', 'asc')
      .get();

    return documentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId as string,
        title: data.title as string,
        content: data.content as string,
        kind: data.kind as ArtifactKind,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });
  } catch (error) {
    console.error('Failed to get documents by ID:', error);
    throw new Error('Failed to get documents by ID');
  }
}

export async function getDocumentById({ id }: { id: string }): Promise<Document | null> {
  try {
    const docSnapshot = await adminDb.collection('documents').doc(id).get();

    if (!docSnapshot.exists) {
      return null;
    }

    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      userId: data?.userId || '',
      title: data?.title || '',
      content: data?.content || '',
      kind: data?.kind || 'text',
      createdAt: data?.createdAt?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('Failed to get document by ID:', error);
    throw new Error('Failed to get document by ID');
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    // This would require a composite query which isn't efficient in Firestore
    // Instead, we'll delete documents client-side after fetching
    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('id', '==', id)
      .get();

    const batch = adminDb.batch();

    documentsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const docCreatedAt = data.createdAt?.toDate?.() || new Date(0);

      if (docCreatedAt > timestamp) {
        batch.delete(doc.ref);

        // Delete suggestions for this document
        adminDb
          .collection('documents')
          .doc(doc.id)
          .collection('suggestions')
          .get()
          .then((suggestionsSnapshot) => {
            suggestionsSnapshot.docs.forEach((suggestionDoc) => {
              batch.delete(suggestionDoc.ref);
            });
          });
      }
    });

    await batch.commit();
    return documentsSnapshot.docs.length;
  } catch (error) {
    console.error('Failed to delete documents after timestamp:', error);
    throw new Error('Failed to delete documents after timestamp');
  }
}

// ========================================
// Suggestion Operations
// ========================================

export async function saveSuggestions({
  documentId,
  suggestions,
}: {
  documentId: string;
  suggestions: any[];
}) {
  try {
    const batch = adminDb.batch();

    suggestions.forEach((suggestion) => {
      const suggestionRef = adminDb
        .collection('documents')
        .doc(documentId)
        .collection('suggestions')
        .doc(suggestion.id);

      batch.set(suggestionRef, {
        ...suggestion,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Failed to save suggestions:', error);
    throw new Error('Failed to save suggestions');
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  try {
    const suggestionsSnapshot = await adminDb
      .collection('documents')
      .doc(documentId)
      .collection('suggestions')
      .get();

    return suggestionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        documentId: data.documentId as string,
        documentCreatedAt: data.documentCreatedAt?.toDate?.() || new Date(),
        originalText: data.originalText as string,
        suggestedText: data.suggestedText as string,
        description: data.description || null,
        isResolved: data.isResolved || false,
        userId: data.userId as string,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });
  } catch (error) {
    console.error('Failed to get suggestions by document ID:', error);
    throw new Error('Failed to get suggestions by document ID');
  }
}

// ========================================
// Stream Operations
// ========================================

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('streams')
      .doc(streamId)
      .set({
        chatId,
        createdAt: FieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    console.error('Failed to create stream ID:', error);
    throw new Error('Failed to create stream ID');
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamsSnapshot = await adminDb
      .collection('chats')
      .doc(chatId)
      .collection('streams')
      .orderBy('createdAt', 'asc')
      .get();

    return streamsSnapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error('Failed to get stream IDs by chat ID:', error);
    throw new Error('Failed to get stream IDs by chat ID');
  }
}
