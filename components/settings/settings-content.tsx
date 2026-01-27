'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PreferencesTab } from './preferences-tab';
import { FoundryTab } from './foundry-tab';

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState('foundry');

  return (
    <div className="flex-1 overflow-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="foundry">Foundry</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="foundry" className="mt-6">
          <FoundryTab />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
