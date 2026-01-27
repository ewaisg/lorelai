import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/auth';
import {
  createFoundryProject,
  getUserFoundryProject,
  updateFoundryProject,
} from '@/lib/firebase/foundry-project-queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getUserFoundryProject(session.user.id);
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching Foundry project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Foundry project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
    const apiKeyRaw = typeof body?.apiKey === 'string' ? body.apiKey : '';
    const enabled = body?.enabled === undefined ? true : Boolean(body.enabled);

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    // Only store apiKey if provided (avoid writing empty strings)
    const apiKey = apiKeyRaw.trim() ? apiKeyRaw.trim() : undefined;

    const existing = await getUserFoundryProject(session.user.id);

    if (existing) {
      await updateFoundryProject(existing.id, {
        endpoint,
        apiKey,
        enabled,
      });
      return NextResponse.json({ success: true, projectId: existing.id });
    }

    const projectId = await createFoundryProject({
      userId: session.user.id,
      name: 'Default',
      endpoint,
      apiKey,
      enabled,
    } as any);

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error('Error saving Foundry project:', error);
    return NextResponse.json(
      { error: 'Failed to save Foundry project' },
      { status: 500 }
    );
  }
}
