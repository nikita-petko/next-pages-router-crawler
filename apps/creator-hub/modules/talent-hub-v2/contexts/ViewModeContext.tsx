import { useRouter } from 'next/router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthentication } from '@modules/authentication/providers';

export type ViewMode = 'studio' | 'applicant';

type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isStudioView: boolean;
};

const STORAGE_KEY = 'th2-view-mode';

const STUDIO_ONLY_ROUTES = ['/hire/inbox'];

function getInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') {
    return 'applicant';
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'studio' || stored === 'applicant') {
      return stored;
    }
  } catch {
    // SSR or storage unavailable
  }

  return 'applicant';
}

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: 'applicant',
  setViewMode: () => {},
  isStudioView: false,
});

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(getInitialViewMode);
  const { user } = useAuthentication();
  const router = useRouter();
  const effectiveViewMode: ViewMode = user ? viewMode : 'applicant';

  useEffect(() => {
    if (effectiveViewMode === 'applicant' && STUDIO_ONLY_ROUTES.includes(router.pathname)) {
      router.replace('/hire');
    }
  }, [effectiveViewMode, router.pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- router.replace is stable, only react to viewMode/pathname changes

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      sessionStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // storage unavailable
    }
  }, []);

  const value = useMemo<ViewModeContextValue>(
    () => ({
      viewMode: effectiveViewMode,
      setViewMode,
      isStudioView: effectiveViewMode === 'studio',
    }),
    [effectiveViewMode, setViewMode],
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
};

export function useViewMode(): ViewModeContextValue {
  return useContext(ViewModeContext);
}

export default ViewModeContext;
