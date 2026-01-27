/**
 * Firestore queries for Azure AI Foundry projects (Firebase Admin SDK)
 */

import { adminDb } from "./config";
import { FieldValue } from "firebase-admin/firestore";
import type { FoundryProject, FoundryDeployment } from "@/lib/azure-foundry/types";

const FOUNDRY_PROJECTS_COLLECTION = "foundryProjects";
const FOUNDRY_DEPLOYMENTS_COLLECTION = "foundryDeployments";

/**
 * Get user's Foundry project (returns first enabled project)
 */
export async function getUserFoundryProject(
  userId: string
): Promise<FoundryProject | null> {
  // Avoid composite index requirements by not combining filters + orderBy.
  // We fetch and pick the newest enabled project in-memory.
  const snapshot = await adminDb
    .collection(FOUNDRY_PROJECTS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  if (snapshot.empty) return null;

  const projects = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? undefined,
      updatedAt: data.updatedAt?.toDate?.() ?? undefined,
    } as FoundryProject;
  });

  const enabledProjects = projects.filter((p) => p.enabled);
  const candidates = enabledProjects.length > 0 ? enabledProjects : projects;

  candidates.sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });

  return candidates[0] ?? null;
}

/**
 * Get all Foundry projects for a user
 */
export async function getUserFoundryProjects(
  userId: string
): Promise<FoundryProject[]> {
  const snapshot = await adminDb
    .collection(FOUNDRY_PROJECTS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const projects = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? undefined,
      updatedAt: data.updatedAt?.toDate?.() ?? undefined,
    } as FoundryProject;
  });

  projects.sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });

  return projects;
}

/**
 * Create a new Foundry project
 */
export async function createFoundryProject(
  data: Omit<FoundryProject, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const cleaned = removeUndefined({ ...data });
  const docRef = await adminDb.collection(FOUNDRY_PROJECTS_COLLECTION).add({
    ...cleaned,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update a Foundry project
 */
export async function updateFoundryProject(
  projectId: string,
  data: Partial<Omit<FoundryProject, "id" | "userId" | "createdAt">>
): Promise<void> {
  const cleaned = removeUndefined({ ...data });
  await adminDb
    .collection(FOUNDRY_PROJECTS_COLLECTION)
    .doc(projectId)
    .update({
      ...cleaned,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Delete a Foundry project
 */
export async function deleteFoundryProject(projectId: string): Promise<void> {
  await adminDb.collection(FOUNDRY_PROJECTS_COLLECTION).doc(projectId).delete();

  // Also delete associated deployments
  const snapshot = await adminDb
    .collection(FOUNDRY_DEPLOYMENTS_COLLECTION)
    .where("projectId", "==", projectId)
    .get();

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

/**
 * Get deployments for a project
 */
export async function getProjectDeployments(
  projectId: string
): Promise<FoundryDeployment[]> {
  const snapshot = await adminDb
    .collection(FOUNDRY_DEPLOYMENTS_COLLECTION)
    .where("projectId", "==", projectId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as FoundryDeployment[];
}

/**
 * Remove undefined values from an object for Firestore compatibility.
 * Firestore doesn't accept undefined values, so we filter them out.
 */
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Get default deployment for a project
 */
export async function getDefaultDeployment(
  projectId: string
): Promise<FoundryDeployment | null> {
  const snapshot = await adminDb
    .collection(FOUNDRY_DEPLOYMENTS_COLLECTION)
    .where("projectId", "==", projectId)
    .where("isDefault", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as FoundryDeployment;
}

/**
 * Create or update a deployment
 */
export async function upsertDeployment(
  data: Omit<FoundryDeployment, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const cleaned = removeUndefined({ ...data });

  // Check if deployment already exists
  const snapshot = await adminDb
    .collection(FOUNDRY_DEPLOYMENTS_COLLECTION)
    .where("projectId", "==", data.projectId)
    .where("deploymentName", "==", data.deploymentName)
    .get();

  if (!snapshot.empty) {
    // Update existing deployment
    const existingDoc = snapshot.docs[0];
    await existingDoc.ref.update({
      ...cleaned,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return existingDoc.id;
  } else {
    // Create new deployment
    const docRef = await adminDb.collection(FOUNDRY_DEPLOYMENTS_COLLECTION).add({
      ...cleaned,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }
}

/**
 * Set a deployment as default (unsets all other defaults for the project)
 */
export async function setDefaultDeployment(
  projectId: string,
  deploymentId: string
): Promise<void> {
  const snapshot = await adminDb
    .collection(FOUNDRY_DEPLOYMENTS_COLLECTION)
    .where("projectId", "==", projectId)
    .get();

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isDefault: doc.id === deploymentId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Delete a deployment
 */
export async function deleteDeployment(deploymentId: string): Promise<void> {
  await adminDb
    .collection(FOUNDRY_DEPLOYMENTS_COLLECTION)
    .doc(deploymentId)
    .delete();
}
