import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/auth';
import {
  getUserModels,
  createModel,
} from '@/lib/firebase/user-settings-queries';
import type { UserModel } from '@/lib/firebase/user-settings-types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    let models: UserModel[];

    if (providerId) {
      const { getModelsByProvider } = await import('@/lib/firebase/user-settings-queries');
      models = await getModelsByProvider(providerId);
    } else {
      models = await getUserModels(session.user.id);
    }

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.providerId || !body.modelId || !body.name) {
      return NextResponse.json(
        { error: 'ProviderId, modelId, and name are required' },
        { status: 400 }
      );
    }

    const modelData: Omit<UserModel, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: session.user.id,
      providerId: body.providerId,
      modelId: body.modelId,
      name: body.name,
      description: body.description,
      enabled: body.enabled ?? true,
      deploymentName: body.deploymentName,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      isDefault: body.isDefault ?? false,
    };

    const modelId = await createModel(modelData);

    return NextResponse.json({ id: modelId, ...modelData }, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    );
  }
}
