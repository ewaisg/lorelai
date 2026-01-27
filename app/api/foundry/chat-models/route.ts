import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/auth';
import {
  getProjectDeployments,
  getUserFoundryProject,
} from '@/lib/firebase/foundry-project-queries';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getUserFoundryProject(session.user.id);
    if (!project) {
      return NextResponse.json({ models: [] });
    }

    const deployments = await getProjectDeployments(project.id);

    const models = [
      {
        id: DEFAULT_CHAT_MODEL,
        name: 'Default deployment',
        provider: 'azure',
        providerName: 'Azure AI Foundry',
        description: 'Uses your default Foundry deployment from Settings',
        isDefault: true,
      },
      ...deployments.map((d) => ({
        id: d.deploymentName,
        name: d.deploymentName,
        provider: 'azure',
        providerName: 'Azure AI Foundry',
        description: d.modelName
          ? `Deployment for ${d.modelName}`
          : 'Foundry deployment',
        isDefault: Boolean(d.isDefault),
      })),
    ];

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error listing Foundry chat models:', error);
    return NextResponse.json(
      { error: 'Failed to list Foundry models', models: [] },
      { status: 500 }
    );
  }
}
