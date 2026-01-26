'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { UserModel, AIProvider } from '@/lib/firebase/user-settings-types';

interface ModelDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  model?: UserModel | null;
  providers: AIProvider[];
}

export function ModelDialog({ open, onClose, model, providers }: ModelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    providerId: '',
    modelId: '',
    name: '',
    description: '',
    enabled: true,
    deploymentName: '',
    maxTokens: '',
    temperature: '',
    isDefault: false,
  });

  useEffect(() => {
    if (model) {
      setFormData({
        providerId: model.providerId,
        modelId: model.modelId,
        name: model.name,
        description: model.description || '',
        enabled: model.enabled,
        deploymentName: model.deploymentName || '',
        maxTokens: model.maxTokens?.toString() || '',
        temperature: model.temperature?.toString() || '',
        isDefault: model.isDefault || false,
      });
    } else {
      // Reset form for new model
      setFormData({
        providerId: providers.length > 0 ? providers[0].id : '',
        modelId: '',
        name: '',
        description: '',
        enabled: true,
        deploymentName: '',
        maxTokens: '',
        temperature: '',
        isDefault: false,
      });
    }
  }, [model, open, providers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        providerId: formData.providerId,
        modelId: formData.modelId,
        name: formData.name,
        description: formData.description || undefined,
        enabled: formData.enabled,
        deploymentName: formData.deploymentName || undefined,
        maxTokens: formData.maxTokens ? parseInt(formData.maxTokens) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        isDefault: formData.isDefault,
      };

      let response;
      if (model) {
        // Update existing model
        response = await fetch(`/api/models/${model.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new model
        response = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(model ? 'Model updated' : 'Model created');
        onClose(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save model');
      }
    } catch (error) {
      toast.error('Failed to save model');
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = providers.find((p) => p.id === formData.providerId);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{model ? 'Edit Model' : 'Add Model'}</DialogTitle>
          <DialogDescription>
            Configure a model for your AI provider
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="providerId">Provider</Label>
              <Select
                value={formData.providerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, providerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="e.g., GPT-4o"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelId">Model ID</Label>
              <Input
                id="modelId"
                placeholder={
                  selectedProvider?.type === 'azure-openai'
                    ? 'e.g., gpt-4o, gpt-4o-mini'
                    : 'e.g., gpt-4o, claude-sonnet-4.5'
                }
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {selectedProvider?.type === 'azure-openai'
                  ? 'The base model name (not the deployment name)'
                  : 'The model identifier from the provider'}
              </p>
            </div>

            {selectedProvider?.type === 'azure-openai' && (
              <div className="space-y-2">
                <Label htmlFor="deploymentName">Deployment Name</Label>
                <Input
                  id="deploymentName"
                  placeholder="e.g., gpt-4o-deployment"
                  value={formData.deploymentName}
                  onChange={(e) =>
                    setFormData({ ...formData, deploymentName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Your Azure deployment name (if different from model ID)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this model"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens (Optional)</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  placeholder="e.g., 4096"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTokens: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (Optional)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  placeholder="e.g., 0.7"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDefault">Set as Default Model</Label>
                <p className="text-xs text-muted-foreground">
                  This model will be selected by default in new chats
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : model ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
