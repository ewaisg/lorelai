'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { UserModel, AIProvider } from '@/lib/firebase/user-settings-types';
import { ModelDialog } from './model-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ModelsTab() {
  const [models, setModels] = useState<UserModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<UserModel | null>(null);
  const [filterProvider, setFilterProvider] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/providers'),
      ]);

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData);
      }

      if (providersRes.ok) {
        const providersData = await providersRes.json();
        setProviders(providersData);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Model deleted');
        fetchData();
      } else {
        toast.error('Failed to delete model');
      }
    } catch (error) {
      toast.error('Failed to delete model');
    }
  };

  const handleEdit = (model: UserModel) => {
    setEditingModel(model);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingModel(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setEditingModel(null);
    if (refresh) {
      fetchData();
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || 'Unknown Provider';
  };

  const filteredModels =
    filterProvider === 'all'
      ? models
      : models.filter((m) => m.providerId === filterProvider);

  if (loading) {
    return <div>Loading models...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Models</h2>
          <p className="text-sm text-muted-foreground">
            Configure models for your AI providers
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={providers.length === 0}>
            <Plus className="mr-2 size-4" />
            Add Model
          </Button>
        </div>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">
              Please add a provider first before adding models
            </p>
          </CardContent>
        </Card>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No models configured yet</p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 size-4" />
              Add Your First Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <Card key={model.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {model.name}
                      {model.isDefault && (
                        <Star className="size-4 fill-yellow-500 text-yellow-500" />
                      )}
                      {model.enabled ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <X className="size-4 text-red-600" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getProviderName(model.providerId)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(model)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model ID: </span>
                    <span className="font-mono text-xs">{model.modelId}</span>
                  </div>
                  {model.deploymentName && (
                    <div>
                      <span className="text-muted-foreground">Deployment: </span>
                      <span className="font-mono text-xs">{model.deploymentName}</span>
                    </div>
                  )}
                  {model.description && (
                    <div className="text-xs text-muted-foreground">
                      {model.description}
                    </div>
                  )}
                  {model.maxTokens && (
                    <div className="text-xs text-muted-foreground">
                      Max tokens: {model.maxTokens}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModelDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        model={editingModel}
        providers={providers}
      />
    </div>
  );
}
