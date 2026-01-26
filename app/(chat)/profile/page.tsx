import { Suspense } from 'react';
import { auth } from '@/lib/firebase/auth';
import { redirect } from 'next/navigation';
import { ProfileContent } from '@/components/profile/profile-content';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-dvh w-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information
        </p>
      </div>
      <Suspense fallback={<div className="flex-1 p-6">Loading profile...</div>}>
        <ProfileContent user={session.user} />
      </Suspense>
    </div>
  );
}
