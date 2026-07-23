import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';

/** Auto-dismiss the NUX tooltip after this many milliseconds */
const COLLAPSE_NUX_AUTO_DISMISS_MS = 3000;

type CollapseNuxResult = {
  isSidebarCollapsed: boolean;
  showCollapseNux: boolean;
  handleCollapseSidebar: () => void;
  handleExpandSidebar: () => void;
};

const useCollapseNux = (): CollapseNuxResult => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage(
    'exploreModeSidebarCollapsed',
    false,
  );
  const [hasSeenCollapseNux, setHasSeenCollapseNux] = useLocalStorage(
    'exploreModeSidebarCollapseNuxSeen',
    false,
  );
  const [showCollapseNux, setShowCollapseNux] = useState(false);
  const nuxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (nuxTimeoutRef.current) {
        clearTimeout(nuxTimeoutRef.current);
      }
    },
    [],
  );

  const startNuxTimer = useCallback(() => {
    if (nuxTimeoutRef.current) {
      clearTimeout(nuxTimeoutRef.current);
    }
    nuxTimeoutRef.current = setTimeout(() => {
      setShowCollapseNux(false);
      setHasSeenCollapseNux(true);
    }, COLLAPSE_NUX_AUTO_DISMISS_MS);
  }, [setHasSeenCollapseNux]);

  useEffect(() => {
    if (isSidebarCollapsed && !hasSeenCollapseNux && !showCollapseNux) {
      setShowCollapseNux(true);
      startNuxTimer();
    }
  }, [isSidebarCollapsed, hasSeenCollapseNux, showCollapseNux, startNuxTimer]);

  const handleCollapseSidebar = useCallback(() => {
    setIsSidebarCollapsed(true);
    if (!hasSeenCollapseNux) {
      setShowCollapseNux(true);
      startNuxTimer();
    }
  }, [hasSeenCollapseNux, setIsSidebarCollapsed, startNuxTimer]);

  const handleExpandSidebar = useCallback(() => {
    setIsSidebarCollapsed(false);
    setShowCollapseNux(false);
    if (!hasSeenCollapseNux) {
      setHasSeenCollapseNux(true);
    }
    if (nuxTimeoutRef.current) {
      clearTimeout(nuxTimeoutRef.current);
    }
  }, [hasSeenCollapseNux, setHasSeenCollapseNux, setIsSidebarCollapsed]);

  return { isSidebarCollapsed, showCollapseNux, handleCollapseSidebar, handleExpandSidebar };
};

export default useCollapseNux;
