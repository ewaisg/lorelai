import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/auth';
import {
  getUserProviders,
  createProvider,
} from '@/lib/firebase/user-settings-queries';
import type { AIProvider } from '@/lib/firebase/user-settings-types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await getUserProviders(session.user.id);

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
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
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const providerData: Omit<AIProvider, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: session.user.id,
      name: body.name,
      type: body.type,
      enabled: body.enabled ?? true,
      config: body.config || {},
    };

    const providerId = await createProvider(providerData);

    return NextResponse.json({ id: providerId, ...providerData }, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}
