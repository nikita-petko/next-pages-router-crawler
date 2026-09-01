import { useState } from 'react';

export type ExploreLicensesBrowseView = 'grid' | 'list';

export function useExploreLicensesBrowseView(): {
  view: ExploreLicensesBrowseView;
  setView: (next: ExploreLicensesBrowseView) => void;
} {
  const [view, setView] = useState<ExploreLicensesBrowseView>('grid');

  return { view, setView };
}
