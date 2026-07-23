import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useIsInStudioContext } from '../hooks/useMyStudios';
import { isLocalTh2DevModeEnabled } from '../utils';

type RequireAccountContextProps = {
  context: 'studio' | 'personal';
  children: React.ReactNode;
};

/**
 * Gate for routes that only make sense in a specific account-picker context.
 *
 * - `/hire/my-studio/*` is studio-context only (Manage → My studio).
 * - `/hire/my-profile/*` is personal-context only (Manage → My talent profile).
 *
 * A mismatch can happen two ways:
 * - The user deep-links while on the wrong account.
 * - The user was on a valid page and then flipped accounts via the picker.
 *
 * Both cases redirect to `/hire`. The old behavior (showing a 404) was
 * jarring after an account switch since the page was valid a moment ago;
 * sending users to the Talent Hub home is predictable and keeps their
 * QA/mocks query params.
 */
const RequireAccountContext: React.FC<RequireAccountContextProps> = ({ context, children }) => {
  const router = useRouter();
  const { isInStudioContext, isLoading } = useIsInStudioContext();
  const localMode = isLocalTh2DevModeEnabled();
  const ok = context === 'studio' ? isInStudioContext : !isInStudioContext;

  useEffect(() => {
    if (localMode || isLoading || ok) {
      return;
    }
    const params = new URLSearchParams();
    const { th2, th2m2, mocks, local } = router.query;
    if (typeof th2 === 'string') {
      params.set('th2', th2);
    }
    if (typeof th2m2 === 'string') {
      params.set('th2m2', th2m2);
    }
    if (typeof mocks === 'string') {
      params.set('mocks', mocks);
    }
    if (typeof local === 'string') {
      params.set('local', local);
    }
    const qs = params.toString();
    router.replace(`/hire${qs ? `?${qs}` : ''}`).catch(() => {});
  }, [isLoading, localMode, ok, router]);

  if (localMode) {
    return <>{children}</>;
  }

  if (isLoading || !ok) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAccountContext;
