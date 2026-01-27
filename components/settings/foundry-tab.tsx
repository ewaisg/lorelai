'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type FoundryProjectDto = {
  id?: string;
  endpoint: string;
  apiKey?: string;
  enabled: boolean;
};

type FoundryDeploymentDto = {
  id: string;
  deploymentName: string;
  modelName?: string;
  isDefault?: boolean;
};

export function FoundryTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [deployments, setDeployments] = useState<FoundryDeploymentDto[]>([]);

  const [enabled, setEnabled] = useState(true);
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  const [newDeploymentName, setNewDeploymentName] = useState('');
  const [newModelName, setNewModelName] = useState('');

  const canSave = useMemo(() => endpoint.trim().length > 0 && !saving, [endpoint, saving]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/foundry/project');
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = (await res.json()) as { project: FoundryProjectDto | null };
        if (data.project) {
          setEnabled(Boolean(data.project.enabled));
          setEndpoint(data.project.endpoint ?? '');
          setApiKey(data.project.apiKey ?? '');
        }

        // Load deployments (best-effort)
        setDeploymentsLoading(true);
        const depRes = await fetch('/api/foundry/deployments');
        if (depRes.ok) {
          const depData = (await depRes.json()) as { deployments: FoundryDeploymentDto[] };
          setDeployments(Array.isArray(depData.deployments) ? depData.deployments : []);
        }
      } catch {
        // ignore
      } finally {
        setDeploymentsLoading(false);
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    if (!endpoint.trim()) {
      toast.error('Project endpoint is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/foundry/project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          endpoint: endpoint.trim(),
          apiKey: apiKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        toast.error(msg?.error ?? 'Failed to save Foundry settings');
        return;
      }

      toast.success('Foundry settings saved');
    } catch {
      toast.error('Failed to save Foundry settings');
    } finally {
      setSaving(false);
    }
  };

  const refreshDeployments = async () => {
    setDeploymentsLoading(true);
    try {
      const res = await fetch('/api/foundry/deployments');
      if (!res.ok) return;
      const data = (await res.json()) as { deployments: FoundryDeploymentDto[] };
      setDeployments(Array.isArray(data.deployments) ? data.deployments : []);
    } finally {
      setDeploymentsLoading(false);
    }
  };

  const onAddDeployment = async () => {
    const deploymentName = newDeploymentName.trim();
    const modelName = newModelName.trim();

    if (!deploymentName) {
      toast.error('Deployment name is required');
      return;
    }

    try {
      const res = await fetch('/api/foundry/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentName,
          modelName: modelName || deploymentName,
          isDefault: deployments.length === 0,
        }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        toast.error(msg?.error ?? 'Failed to add deployment');
        return;
      }

      setNewDeploymentName('');
      setNewModelName('');
      await refreshDeployments();
      toast.success('Deployment saved');
    } catch {
      toast.error('Failed to add deployment');
    }
  };

  const onSetDefault = async (deploymentId: string) => {
    try {
      const res = await fetch('/api/foundry/deployments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentId }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        toast.error(msg?.error ?? 'Failed to set default');
        return;
      }

      await refreshDeployments();
      toast.success('Default deployment updated');
    } catch {
      toast.error('Failed to set default');
    }
  };

  const onDeleteDeployment = async (deploymentId: string) => {
    try {
      const res = await fetch(`/api/foundry/deployments?deploymentId=${encodeURIComponent(deploymentId)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        toast.error(msg?.error ?? 'Failed to delete deployment');
        return;
      }

      await refreshDeployments();
      toast.success('Deployment deleted');
    } catch {
      toast.error('Failed to delete deployment');
    }
  };

  if (loading) {
    return <div>Loading Foundry settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Azure AI Foundry</h2>
        <p className="text-sm text-muted-foreground">
          Configure your Foundry project endpoint and authentication.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
          <CardDescription>
            The project endpoint is used to create an OpenAI-compatible client via Azure AI Foundry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="foundry-enabled">Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Disable to prevent this account from making Foundry calls.
              </p>
            </div>
            <Switch
              id="foundry-enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foundry-endpoint">Project endpoint</Label>
            <Input
              id="foundry-endpoint"
              placeholder="https://<your-project>.<region>.ai.azure.com"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <p className="text-xs text-muted-foreground">
              This is stored per-user in Firestore.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foundry-api-key">API key (optional)</Label>
            <Input
              id="foundry-api-key"
              type="password"
              placeholder="Paste API key (leave empty to use Entra ID)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <p className="text-xs text-muted-foreground">
              If empty, the server will attempt Entra ID auth (DefaultAzureCredential).
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={!canSave}>
              {saving ? 'Saving...' : 'Save Foundry Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
          <CardDescription>
            Add the deployment names you created in Foundry. The app will use the default deployment for chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="foundry-deployment-name">Deployment name</Label>
              <Input
                id="foundry-deployment-name"
                placeholder="e.g. gpt-4o-mini (must match your deployment name)"
                value={newDeploymentName}
                onChange={(e) => setNewDeploymentName(e.target.value)}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foundry-model-name">Model name (optional)</Label>
              <Input
                id="foundry-model-name"
                placeholder="e.g. gpt-4o-mini"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              In OpenAI SDK calls, the deployment name is passed as <code>model</code>.
            </p>
            <Button
              variant="secondary"
              onClick={onAddDeployment}
              disabled={!newDeploymentName.trim() || deploymentsLoading}
            >
              Add deployment
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Configured deployments</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void refreshDeployments()}
                disabled={deploymentsLoading}
              >
                Refresh
              </Button>
            </div>

            {deploymentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading deployments...</div>
            ) : deployments.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No deployments configured yet. Add one above.
              </div>
            ) : (
              <div className="space-y-2">
                {deployments.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {d.deploymentName}{' '}
                        {d.isDefault ? (
                          <span className="text-xs text-muted-foreground">(default)</span>
                        ) : null}
                      </div>
                      {d.modelName ? (
                        <div className="truncate text-xs text-muted-foreground">Model: {d.modelName}</div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void onSetDefault(d.id)}
                        disabled={Boolean(d.isDefault) || deploymentsLoading}
                      >
                        Set default
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void onDeleteDeployment(d.id)}
                        disabled={deploymentsLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
