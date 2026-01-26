'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AIProvider } from '@/lib/firebase/user-settings-types';
import { ProviderDialog } from './provider-dialog';

export function ProvidersTab() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider? All associated models will also be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Provider deleted');
        fetchProviders();
      } else {
        toast.error('Failed to delete provider');
      }
    } catch (error) {
      toast.error('Failed to delete provider');
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProvider(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setEditingProvider(null);
    if (refresh) {
      fetchProviders();
    }
  };

  if (loading) {
    return <div>Loading providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Providers</h2>
          <p className="text-sm text-muted-foreground">
            Configure your AI provider credentials and settings
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          Add Provider
        </Button>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No providers configured yet</p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 size-4" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {provider.name}
                      {provider.enabled ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <X className="size-4 text-red-600" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {provider.type === 'azure-openai' && 'Azure OpenAI'}
                      {provider.type === 'openai' && 'OpenAI'}
                      {provider.type === 'anthropic' && 'Anthropic'}
                      {provider.type === 'google' && 'Google'}
                      {provider.type === 'custom' && 'Custom Provider'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(provider)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {provider.type === 'azure-openai' && provider.config.azureEndpoint && (
                    <div>
                      <span className="text-muted-foreground">Endpoint: </span>
                      <span className="font-mono text-xs">{provider.config.azureEndpoint}</span>
                    </div>
                  )}
                  {provider.type === 'custom' && provider.config.customEndpoint && (
                    <div>
                      <span className="text-muted-foreground">Endpoint: </span>
                      <span className="font-mono text-xs">{provider.config.customEndpoint}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(provider.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProviderDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        provider={editingProvider}
      />
    </div>
  );
}
