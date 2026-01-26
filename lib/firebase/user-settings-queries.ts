'use server';

import { adminDb } from './config';
import { FieldValue } from 'firebase-admin/firestore';
import type { AIProvider, UserModel, UserSettings } from './user-settings-types';

// ========================================
// AI Provider Operations
// ========================================

export async function getUserProviders(userId: string): Promise<AIProvider[]> {
  try {
    const providersSnapshot = await adminDb
      .collection('userProviders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return providersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as AIProvider;
    });
  } catch (error) {
    console.error('Failed to get user providers:', error);
    return [];
  }
}

export async function getProviderById(providerId: string): Promise<AIProvider | null> {
  try {
    const providerDoc = await adminDb.collection('userProviders').doc(providerId).get();

    if (!providerDoc.exists) {
      return null;
    }

    const data = providerDoc.data();
    return {
      id: providerDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() || new Date(),
      updatedAt: data?.updatedAt?.toDate?.() || new Date(),
    } as AIProvider;
  } catch (error) {
    console.error('Failed to get provider by ID:', error);
    return null;
  }
}

export async function createProvider(provider: Omit<AIProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await adminDb.collection('userProviders').add({
      ...provider,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Failed to create provider:', error);
    throw new Error('Failed to create provider');
  }
}

export async function updateProvider(providerId: string, updates: Partial<AIProvider>): Promise<void> {
  try {
    await adminDb.collection('userProviders').doc(providerId).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update provider:', error);
    throw new Error('Failed to update provider');
  }
}

export async function deleteProvider(providerId: string): Promise<void> {
  try {
    // Delete all models associated with this provider
    const modelsSnapshot = await adminDb
      .collection('userModels')
      .where('providerId', '==', providerId)
      .get();

    const batch = adminDb.batch();
    modelsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the provider
    batch.delete(adminDb.collection('userProviders').doc(providerId));

    await batch.commit();
  } catch (error) {
    console.error('Failed to delete provider:', error);
    throw new Error('Failed to delete provider');
  }
}

// ========================================
// User Model Operations
// ========================================

export async function getUserModels(userId: string): Promise<UserModel[]> {
  try {
    const modelsSnapshot = await adminDb
      .collection('userModels')
      .where('userId', '==', userId)
      .where('enabled', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return modelsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as UserModel;
    });
  } catch (error) {
    console.error('Failed to get user models:', error);
    return [];
  }
}

export async function getModelsByProvider(providerId: string): Promise<UserModel[]> {
  try {
    const modelsSnapshot = await adminDb
      .collection('userModels')
      .where('providerId', '==', providerId)
      .orderBy('createdAt', 'desc')
      .get();

    return modelsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as UserModel;
    });
  } catch (error) {
    console.error('Failed to get models by provider:', error);
    return [];
  }
}

export async function getModelById(modelId: string): Promise<UserModel | null> {
  try {
    const modelDoc = await adminDb.collection('userModels').doc(modelId).get();

    if (!modelDoc.exists) {
      return null;
    }

    const data = modelDoc.data();
    return {
      id: modelDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() || new Date(),
      updatedAt: data?.updatedAt?.toDate?.() || new Date(),
    } as UserModel;
  } catch (error) {
    console.error('Failed to get model by ID:', error);
    return null;
  }
}

export async function createModel(model: Omit<UserModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await adminDb.collection('userModels').add({
      ...model,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Failed to create model:', error);
    throw new Error('Failed to create model');
  }
}

export async function updateModel(modelId: string, updates: Partial<UserModel>): Promise<void> {
  try {
    await adminDb.collection('userModels').doc(modelId).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update model:', error);
    throw new Error('Failed to update model');
  }
}

export async function deleteModel(modelId: string): Promise<void> {
  try {
    await adminDb.collection('userModels').doc(modelId).delete();
  } catch (error) {
    console.error('Failed to delete model:', error);
    throw new Error('Failed to delete model');
  }
}

// ========================================
// User Settings Operations
// ========================================

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const settingsDoc = await adminDb.collection('userSettings').doc(userId).get();

    if (!settingsDoc.exists) {
      // Create default settings
      const defaultSettings: UserSettings = {
        userId,
        theme: 'system',
        preferences: {
          streamResponse: true,
          showTokenCount: false,
          autoSaveChats: true,
        },
        updatedAt: new Date(),
      };

      await adminDb.collection('userSettings').doc(userId).set({
        ...defaultSettings,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return defaultSettings;
    }

    const data = settingsDoc.data();
    return {
      ...data,
      updatedAt: data?.updatedAt?.toDate?.() || new Date(),
    } as UserSettings;
  } catch (error) {
    console.error('Failed to get user settings:', error);
    return null;
  }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  try {
    await adminDb.collection('userSettings').doc(userId).set(
      {
        ...settings,
        userId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw new Error('Failed to update user settings');
  }
}
