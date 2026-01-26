import { Suspense } from 'react';
import { SettingsContent } from '@/components/settings/settings-content';

export default function SettingsPage() {
  return (
    <div className="flex h-dvh w-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your AI providers, models, and preferences
        </p>
      </div>
      <Suspense fallback={<div className="flex-1 p-6">Loading settings...</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
