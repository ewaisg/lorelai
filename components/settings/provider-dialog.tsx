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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { AIProvider, ProviderType } from '@/lib/firebase/user-settings-types';
import { parseAzureTargetURI, isAzureTargetURI } from '@/lib/azure-uri-parser';

interface ProviderDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  provider?: AIProvider | null;
}

export function ProviderDialog({ open, onClose, provider }: ProviderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [targetUri, setTargetUri] = useState('');
  const [extractedDeployment, setExtractedDeployment] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'azure-openai' as ProviderType,
    enabled: true,
    azureEndpoint: '',
    azureApiKey: '',
    azureApiVersion: '2024-08-01-preview',
    openaiApiKey: '',
    openaiBaseUrl: 'https://api.openai.com/v1',
    anthropicApiKey: '',
    googleApiKey: '',
    googleProjectId: '',
    customEndpoint: '',
    customApiKey: '',
  });

  // Parse Target URI when it changes
  const handleTargetUriChange = (uri: string) => {
    setTargetUri(uri);

    if (!uri.trim()) {
      setExtractedDeployment('');
      return;
    }

    if (isAzureTargetURI(uri)) {
      const parsed = parseAzureTargetURI(uri);
      if (parsed) {
        setFormData({
          ...formData,
          azureEndpoint: parsed.endpoint,
          azureApiVersion: parsed.apiVersion,
        });
        setExtractedDeployment(parsed.deploymentName);
        toast.success('Target URI parsed successfully');
      } else {
        toast.error('Failed to parse Target URI');
      }
    } else if (uri.trim().length > 10) {
      toast.error('Invalid Azure Target URI format');
    }
  };

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        type: provider.type,
        enabled: provider.enabled,
        azureEndpoint: provider.config.azureEndpoint || '',
        azureApiKey: provider.config.azureApiKey || '',
        azureApiVersion: provider.config.azureApiVersion || '2024-08-01-preview',
        openaiApiKey: provider.config.openaiApiKey || '',
        openaiBaseUrl: provider.config.openaiBaseUrl || 'https://api.openai.com/v1',
        anthropicApiKey: provider.config.anthropicApiKey || '',
        googleApiKey: provider.config.googleApiKey || '',
        googleProjectId: provider.config.googleProjectId || '',
        customEndpoint: provider.config.customEndpoint || '',
        customApiKey: provider.config.customApiKey || '',
      });
      setTargetUri('');
      setExtractedDeployment('');
    } else {
      // Reset form for new provider
      setFormData({
        name: '',
        type: 'azure-openai',
        enabled: true,
        azureEndpoint: '',
        azureApiKey: '',
        azureApiVersion: '2024-08-01-preview',
        openaiApiKey: '',
        openaiBaseUrl: 'https://api.openai.com/v1',
        anthropicApiKey: '',
        googleApiKey: '',
        googleProjectId: '',
        customEndpoint: '',
        customApiKey: '',
      });
      setTargetUri('');
      setExtractedDeployment('');
    }
  }, [provider, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config: any = {};

      if (formData.type === 'azure-openai') {
        config.azureEndpoint = formData.azureEndpoint;
        config.azureApiKey = formData.azureApiKey;
        config.azureApiVersion = formData.azureApiVersion;
      } else if (formData.type === 'openai') {
        config.openaiApiKey = formData.openaiApiKey;
        config.openaiBaseUrl = formData.openaiBaseUrl;
      } else if (formData.type === 'anthropic') {
        config.anthropicApiKey = formData.anthropicApiKey;
      } else if (formData.type === 'google') {
        config.googleApiKey = formData.googleApiKey;
        config.googleProjectId = formData.googleProjectId;
      } else if (formData.type === 'custom') {
        config.customEndpoint = formData.customEndpoint;
        config.customApiKey = formData.customApiKey;
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        enabled: formData.enabled,
        config,
      };

      let response;
      if (provider) {
        // Update existing provider
        response = await fetch(`/api/providers/${provider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new provider
        response = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const savedProvider = await response.json();
        toast.success(provider ? 'Provider updated' : 'Provider created');

        // Automatically create a model if deployment name was extracted from Target URI
        if (!provider && extractedDeployment && savedProvider.id) {
          try {
            const modelPayload = {
              providerId: savedProvider.id,
              modelId: extractedDeployment,
              name: extractedDeployment,
              deploymentName: extractedDeployment,
              enabled: true,
              description: 'Auto-created from Target URI',
            };

            const modelResponse = await fetch('/api/models', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(modelPayload),
            });

            if (modelResponse.ok) {
              toast.success(`Model "${extractedDeployment}" created automatically`);
            }
          } catch (modelError) {
            console.error('Failed to auto-create model:', modelError);
            // Don't show error to user, provider was created successfully
          }
        }

        onClose(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save provider');
      }
    } catch (error) {
      toast.error('Failed to save provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
          <DialogDescription>
            Configure your AI provider credentials and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Azure OpenAI"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Provider Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as ProviderType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="azure-openai">Azure OpenAI</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google AI</SelectItem>
                  <SelectItem value="custom">Custom Provider</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Azure OpenAI Fields */}
            {formData.type === 'azure-openai' && (
              <>
                <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <Label htmlFor="targetUri" className="text-base font-semibold">
                    Quick Setup: Paste Target URI (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Paste the Target URI from Azure AI Foundry to automatically extract endpoint, API version, and deployment name
                  </p>
                  <Input
                    id="targetUri"
                    placeholder="https://resource.cognitiveservices.azure.com/openai/deployments/deployment-name/chat/completions?api-version=2024-05-01-preview"
                    value={targetUri}
                    onChange={(e) => handleTargetUriChange(e.target.value)}
                    className="font-mono text-xs"
                  />
                  {extractedDeployment && (
                    <div className="mt-2 rounded-md bg-green-100 p-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Extracted deployment: <strong>{extractedDeployment}</strong>
                      <br />
                      <span className="text-xs">A model will be automatically created after saving the provider</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="azureEndpoint">Azure Endpoint</Label>
                  <Input
                    id="azureEndpoint"
                    placeholder="https://your-resource.cognitiveservices.azure.com"
                    value={formData.azureEndpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, azureEndpoint: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azureApiKey">API Key</Label>
                  <Input
                    id="azureApiKey"
                    type="password"
                    placeholder="Your Azure API key"
                    value={formData.azureApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, azureApiKey: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azureApiVersion">API Version</Label>
                  <Input
                    id="azureApiVersion"
                    placeholder="2024-08-01-preview"
                    value={formData.azureApiVersion}
                    onChange={(e) =>
                      setFormData({ ...formData, azureApiVersion: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* OpenAI Fields */}
            {formData.type === 'openai' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">API Key</Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    placeholder="sk-..."
                    value={formData.openaiApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, openaiApiKey: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openaiBaseUrl">Base URL (Optional)</Label>
                  <Input
                    id="openaiBaseUrl"
                    placeholder="https://api.openai.com/v1"
                    value={formData.openaiBaseUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, openaiBaseUrl: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Anthropic Fields */}
            {formData.type === 'anthropic' && (
              <div className="space-y-2">
                <Label htmlFor="anthropicApiKey">API Key</Label>
                <Input
                  id="anthropicApiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={formData.anthropicApiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, anthropicApiKey: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Google Fields */}
            {formData.type === 'google' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="googleApiKey">API Key</Label>
                  <Input
                    id="googleApiKey"
                    type="password"
                    placeholder="Your Google AI API key"
                    value={formData.googleApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, googleApiKey: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleProjectId">Project ID (Optional)</Label>
                  <Input
                    id="googleProjectId"
                    placeholder="your-project-id"
                    value={formData.googleProjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, googleProjectId: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Custom Provider Fields */}
            {formData.type === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customEndpoint">Endpoint URL</Label>
                  <Input
                    id="customEndpoint"
                    placeholder="https://your-api-endpoint.com"
                    value={formData.customEndpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, customEndpoint: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customApiKey">API Key</Label>
                  <Input
                    id="customApiKey"
                    type="password"
                    placeholder="Your API key"
                    value={formData.customApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, customApiKey: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : provider ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
