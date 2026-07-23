import { useCallback, useEffect, useState } from 'react';

export type ExploreLicensesBrowseView = 'grid' | 'list';

const STORAGE_KEY = 'explore-licenses-browse-view';

function readStoredView(): ExploreLicensesBrowseView {
  if (typeof window === 'undefined') {
    return 'grid';
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'grid' || stored === 'list') {
      return stored;
    }
  } catch {
    // sessionStorage unavailable
  }
  return 'grid';
}

export function useExploreLicensesBrowseView(): {
  view: ExploreLicensesBrowseView;
  setView: (next: ExploreLicensesBrowseView) => void;
} {
  const [view, setViewState] = useState<ExploreLicensesBrowseView>('grid');

  useEffect(() => {
    setViewState(readStoredView());
  }, []);

  const setView = useCallback((next: ExploreLicensesBrowseView) => {
    setViewState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  return { view, setView };
}
