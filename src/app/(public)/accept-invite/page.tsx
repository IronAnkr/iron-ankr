"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const supabase = getSupabaseBrowserClient();
  
  const [status, setStatus] = useState('Verifying your session...');
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useCallback(async (authToken: string) => {
    setStatus('Accepting your invitation...');
    try {
      const response = await fetch('/api/teams/accept-invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Pass the token for server-side validation
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation.');
      }

      setStatus('Success! You have joined the team.');
      
      setTimeout(() => {
        router.push('/account');
      }, 3000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invitation failed.');
      setStatus('Invitation failed.');
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) {
      setStatus('No invitation token found.');
      setError('Please make sure you are using a valid invitation link.');
      return;
    }

    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        // Wait for the auth state to change, which happens after magic link redirect
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            authListener.subscription.unsubscribe();
            acceptInvite(session.access_token);
          }
        });
      } else {
        // User already had a session, proceed directly
        acceptInvite(session.access_token);
      }
    };

    handleAuth();
  }, [token, supabase, acceptInvite]);

  return (
    <div className="min-h-[60vh] grid place-content-center p-6 text-white">
      <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-8 text-center">
        <h1 className="text-xl font-semibold">{status}</h1>
        {error ? (
          <div className="mt-4 text-rose-300">
            <p>{error}</p>
            <Link href="/account" className="mt-6 inline-block text-blue-400 hover:underline">
              Go to your account
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-white/70">
            Please wait while we update your team membership. You will be redirected shortly.
          </p>
        )}
      </div>
    </div>
  );
}
