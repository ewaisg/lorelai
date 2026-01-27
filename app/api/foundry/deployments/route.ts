import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/auth';
import {
  deleteDeployment,
  getProjectDeployments,
  getUserFoundryProject,
  setDefaultDeployment,
  upsertDeployment,
} from '@/lib/firebase/foundry-project-queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getUserFoundryProject(session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'No Foundry project configured' }, { status: 400 });
    }

    const deployments = await getProjectDeployments(project.id);
    return NextResponse.json({ deployments });
  } catch (error) {
    console.error('Error fetching Foundry deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Foundry deployments' },
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

    const project = await getUserFoundryProject(session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'No Foundry project configured' }, { status: 400 });
    }

    const body = await request.json();

    const deploymentName = typeof body?.deploymentName === 'string' ? body.deploymentName.trim() : '';
    const modelName = typeof body?.modelName === 'string' ? body.modelName.trim() : '';

    if (!deploymentName) {
      return NextResponse.json({ error: 'deploymentName is required' }, { status: 400 });
    }

    const id = await upsertDeployment({
      projectId: project.id,
      deploymentName,
      modelName: modelName || deploymentName,
      isDefault: Boolean(body?.isDefault) || false,
      maxTokens: typeof body?.maxTokens === 'number' ? body.maxTokens : undefined,
      temperature: typeof body?.temperature === 'number' ? body.temperature : undefined,
      capabilities: Array.isArray(body?.capabilities)
        ? body.capabilities.filter((x: unknown) => typeof x === 'string')
        : undefined,
      modelPublisher: typeof body?.modelPublisher === 'string' ? body.modelPublisher : undefined,
    } as any);

    // If requested as default, ensure uniqueness.
    if (body?.isDefault) {
      await setDefaultDeployment(project.id, id);
    }

    return NextResponse.json({ success: true, deploymentId: id });
  } catch (error) {
    console.error('Error saving Foundry deployment:', error);
    return NextResponse.json(
      { error: 'Failed to save Foundry deployment' },
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

    const project = await getUserFoundryProject(session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'No Foundry project configured' }, { status: 400 });
    }

    const body = await request.json();
    const deploymentId = typeof body?.deploymentId === 'string' ? body.deploymentId : '';

    if (!deploymentId) {
      return NextResponse.json({ error: 'deploymentId is required' }, { status: 400 });
    }

    await setDefaultDeployment(project.id, deploymentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default deployment:', error);
    return NextResponse.json(
      { error: 'Failed to set default deployment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getUserFoundryProject(session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'No Foundry project configured' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json({ error: 'deploymentId is required' }, { status: 400 });
    }

    await deleteDeployment(deploymentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Foundry deployment:', error);
    return NextResponse.json(
      { error: 'Failed to delete Foundry deployment' },
      { status: 500 }
    );
  }
}
