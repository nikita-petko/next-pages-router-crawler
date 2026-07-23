import { useState, useEffect } from 'react';
import { ageVerificationClient, usersClient } from '@modules/clients';

type AgeVerificationState = {
  isVerified: boolean;
  isLoading: boolean;
};

function getQaAgeVerificationOverride(): boolean | null {
  if (typeof window === 'undefined') return null;

  const targetEnvironment = (process.env.targetEnvironment ?? '').toLowerCase();
  const isProductionTarget = targetEnvironment === 'production';
  const isSitetestHost = window.location.hostname.toLowerCase().includes('sitetest');

  // Temporary QA override for sitetest/non-production validation.
  // TODO: Remove after st1 verification wraps up.
  if (isProductionTarget && !isSitetestHost) {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('th2Age')?.trim().toLowerCase();

    if (!value) return null;
    if (['verified', '1', 'true'].includes(value)) return true;
    if (['unverified', '0', 'false'].includes(value)) return false;
  } catch {
    return null;
  }

  return null;
}

export default function useAgeVerification(enabled = true): AgeVerificationState {
  const [state, setState] = useState<AgeVerificationState>({
    isVerified: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ isVerified: false, isLoading: false });
      return undefined;
    }

    const qaOverride = getQaAgeVerificationOverride();
    if (qaOverride != null) {
      setState({ isVerified: qaOverride, isLoading: false });
      return undefined;
    }

    let cancelled = false;

    async function check() {
      try {
        const [ageResponse, bracketResponse] = await Promise.all([
          ageVerificationClient.isUserAgeVerified(),
          usersClient.getAgeBracket(),
        ]);

        if (!cancelled) {
          const verified = bracketResponse.ageBracket !== 1 && ageResponse.isVerified === true;
          setState({ isVerified: verified, isLoading: false });
        }
      } catch {
        if (!cancelled) {
          setState({ isVerified: false, isLoading: false });
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
