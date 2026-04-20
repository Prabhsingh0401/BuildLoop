import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

/**
 * SSO callback handler for OAuth providers (e.g. Google).
 * Clerk redirects here after the external OAuth flow completes.
 */
export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    handleRedirectCallback({
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard',
    }).catch(() => {
      navigate('/', { replace: true });
    });
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-[#1a1d23]" />
        <p className="text-sm text-[#5a6061] font-medium">Completing sign-in…</p>
      </div>
    </div>
  );
}
