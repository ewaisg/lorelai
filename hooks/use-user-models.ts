'use client';

import { useEffect, useState } from 'react';
import type { AIProvider, UserModel } from '@/lib/firebase/user-settings-types';

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  providerName: string; // Display name
  description: string;
}

export function useUserModels() {
  const [models, setModels] = useState<ChatModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both providers and models in parallel
        const [providersResponse, modelsResponse] = await Promise.all([
          fetch('/api/providers'),
          fetch('/api/models'),
        ]);

        if (!providersResponse.ok || !modelsResponse.ok) {
          throw new Error('Failed to fetch providers or models');
        }

        const providersData: AIProvider[] = await providersResponse.json();
        const modelsData: UserModel[] = await modelsResponse.json();

        // Filter only enabled models
        const enabledModels = modelsData.filter((model) => model.enabled);

        // Transform to ChatModel format
        const transformedModels: ChatModel[] = enabledModels.map((model) => {
          const provider = providersData.find((p) => p.id === model.providerId);

          return {
            id: model.id,
            name: model.name,
            provider: provider?.type || 'custom',
            providerName: provider?.name || 'Unknown Provider',
            description: model.description || '',
          };
        });

        setProviders(providersData);
        setModels(transformedModels);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error fetching user models:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group models by provider name for UI
  const modelsByProvider = models.reduce(
    (acc, model) => {
      const key = model.providerName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(model);
      return acc;
    },
    {} as Record<string, ChatModel[]>
  );

  return {
    models,
    providers,
    modelsByProvider,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Trigger re-fetch by re-mounting
    },
  };
}
