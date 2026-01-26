'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { SessionUser } from '@/lib/firebase/types';
import { Badge } from '@/components/ui/badge';

interface ProfileContentProps {
  user: SessionUser;
}

export function ProfileContent({ user }: ProfileContentProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user.id} disabled className="font-mono text-sm" />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email || 'No email'} disabled />
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <div>
                <Badge variant={user.type === 'guest' ? 'secondary' : 'default'}>
                  {user.type === 'guest' ? 'Guest Account' : 'Regular Account'}
                </Badge>
              </div>
            </div>

            {user.name && (
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={user.name} disabled />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your account information and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground">Firebase Authentication</p>
              </div>
            </div>

            {user.type === 'guest' && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You are using a guest account with limited features. Register for a full account
                  to unlock unlimited access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Information</CardTitle>
            <CardDescription>Your usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Usage statistics and analytics will be available here in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
