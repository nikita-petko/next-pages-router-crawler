import type { FunctionComponent, ReactNode, RefObject, TransitionEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@rbx/ui';
import {
  shouldDismissFilterSidePanel,
  shouldDismissMatchSidePanel,
} from './matchesSidePanelDismiss';

const PANEL_SLIDE_DURATION_MS = 225;
/** Matches `Matches.tsx` `classes.drawer`. */
const PANEL_MIN_WIDTH_PX = 320;
const PANEL_WIDTH_PX = 440;

export type MatchesSidePanelDismissMode = 'match' | 'filter';

export interface MatchesSidePanelProps {
  open: boolean;
  onDismiss: () => void;
  testId: string;
  ariaLabel: string;
  dismissMode: MatchesSidePanelDismissMode;
  /** When `dismissMode` is `filter`, clicks on this button do not dismiss the panel. */
  dismissTriggerRef?: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}

/**
 * Non-modal fixed side panel for IPH Matches. Replaces MUI `Drawer` on the Matches page.
 *
 * - Desktop-only for now; placement copied from the existing right-anchored drawer.
 * - Does not move focus on open (non-modal; table and filters remain tabbable).
 */
const MatchesSidePanel: FunctionComponent<MatchesSidePanelProps> = ({
  open,
  onDismiss,
  testId,
  ariaLabel,
  dismissMode,
  dismissTriggerRef,
  children,
}) => {
  const theme = useTheme();
  const panelRef = useRef<HTMLElement>(null);
  const openRef = useRef(open);
  const [isMounted, setIsMounted] = useState(open);
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) {
      const slideOutFrameId = requestAnimationFrame(() => {
        setSlideIn(false);
      });

      return () => {
        cancelAnimationFrame(slideOutFrameId);
      };
    }

    let mountFrameId = 0;
    let slideInFrameId = 0;

    if (!isMounted) {
      mountFrameId = requestAnimationFrame(() => {
        setIsMounted(true);
        slideInFrameId = requestAnimationFrame(() => {
          setSlideIn(true);
        });
      });
    } else {
      slideInFrameId = requestAnimationFrame(() => {
        setSlideIn(true);
      });
    }

    return () => {
      cancelAnimationFrame(mountFrameId);
      cancelAnimationFrame(slideInFrameId);
    };
  }, [isMounted, open]);

  useEffect(() => {
    if (open || !isMounted || slideIn) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (!openRef.current) {
        setIsMounted(false);
      }
    }, PANEL_SLIDE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isMounted, open, slideIn]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const panel = panelRef.current;
      const shouldDismiss =
        dismissMode === 'match'
          ? shouldDismissMatchSidePanel(event, panel)
          : shouldDismissFilterSidePanel(event, panel, dismissTriggerRef?.current ?? null);

      if (shouldDismiss) {
        onDismiss();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [dismissMode, dismissTriggerRef, onDismiss, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss, open]);

  const handleTransitionEnd: TransitionEventHandler<HTMLElement> = (event) => {
    if (event.target !== panelRef.current || event.propertyName !== 'transform') {
      return;
    }

    if (!openRef.current) {
      setIsMounted(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  const panelClassName = [
    'fixed top-[0] right-[0] bottom-[0] [box-sizing:border-box] flex flex-col height-full padding-large bg-surface-100 clip pointer-events-auto',
    'transition-transform duration-[225ms] ease-standard-out',
    slideIn ? '[transform:translateX(0)]' : '[transform:translateX(100%)]',
  ].join(' ');

  return (
    <aside
      ref={panelRef}
      aria-label={ariaLabel}
      aria-hidden={!open}
      data-testid={testId}
      onTransitionEnd={handleTransitionEnd}
      className={panelClassName}
      style={{
        minWidth: PANEL_MIN_WIDTH_PX,
        maxWidth: PANEL_WIDTH_PX,
        width: PANEL_WIDTH_PX,
        zIndex: theme.zIndex.drawer,
        boxShadow: theme.shadows[16],
      }}>
      {children}
    </aside>
  );
};

export default MatchesSidePanel;
