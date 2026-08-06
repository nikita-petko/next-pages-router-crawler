import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Router from 'next/router';
import {
  EducationalTooltip,
  EducationalTooltipBody,
  EducationalTooltipContent,
  EducationalTooltipDescription,
  EducationalTooltipTitle,
  EducationalTooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { PRIMARY_RAIL_Z_INDEX, RAIL_SIDEBAR_TOGGLE_TOOLTIP_SEEN_KEY } from '../../layout/constants';

const ANIMATION_MS = 100;
/** Extra gap beyond EducationalTooltip's default sideOffset so the beak clears the rail edge. */
const TOOLTIP_RIGHT_OFFSET_PX = 16;
const TOOLTIP_Z_INDEX = String(PRIMARY_RAIL_Z_INDEX);
const CONTENT_MARKER_CLASS = 'sidebar-toggle-edu-tooltip';

type TPhase = 'hidden' | 'entering' | 'open' | 'exiting';

type TSidebarToggleTooltipProps = {
  enabled: boolean;
  /** When true (icon-only / collapsed rail), dismisses the tooltip. */
  collapsed: boolean;
  children: React.ReactElement;
};

function applyPhaseStyles(element: HTMLElement, phase: TPhase): void {
  // Nudge past the primary nav edge (EducationalTooltip hardcodes sideOffset=6).
  element.style.marginLeft = `${TOOLTIP_RIGHT_OFFSET_PX}px`;
  element.style.zIndex = TOOLTIP_Z_INDEX;

  // Popper positions via a wrapper — that wrapper owns stacking against page chrome.
  const popperWrapper = element.closest('[data-radix-popper-content-wrapper]');
  if (popperWrapper instanceof HTMLElement) {
    popperWrapper.style.zIndex = TOOLTIP_Z_INDEX;
  }

  // Use `translate` (not `transform`) so we don't fight Floating UI positioning transforms.
  element.style.transitionProperty = 'opacity, translate';
  element.style.transitionDuration = `${ANIMATION_MS}ms`;
  element.style.transitionTimingFunction = phase === 'exiting' ? 'ease-out' : 'ease-in';

  if (phase === 'open') {
    element.style.opacity = '1';
    element.style.translate = '0';
    return;
  }

  if (phase === 'exiting') {
    element.style.opacity = '0';
    element.style.translate = '-8px 0';
    return;
  }

  // entering
  element.style.opacity = '0';
  element.style.translate = '8px 0';
}

/**
 * One-time EducationalTooltip for the primary-rail sidebar expand/collapse control.
 * Opens after first paint with a short fade/slide-in.
 * Animates out on X or sidebar collapse; dismisses immediately on navigation.
 * Outside clicks / Escape do not dismiss (EducationalTooltip is a Radix Popover and
 * would otherwise call onOpenChange(false) for those).
 *
 * Layout isolation: the rail item is never a tooltip Trigger. A fixed ghost anchor is
 * portaled to document.body and tracks the item bounds. The item wrapper uses inline
 * `width: 100%` (not a Tailwind class) so the rail's `alignItems: center` cannot recenter
 * a shrink-wrapped 40px button mid-collapse.
 */
const SidebarToggleTooltip: React.FC<TSidebarToggleTooltipProps> = ({
  enabled,
  collapsed,
  children,
}) => {
  const { translate } = useTranslation();
  const [seen, setSeen] = useLocalStorage<string>(RAIL_SIDEBAR_TOGGLE_TOOLTIP_SEEN_KEY, 'false');
  const [phase, setPhase] = useState<TPhase>('hidden');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const prevCollapsedRef = useRef(collapsed);
  const contentElementRef = useRef<HTMLElement | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const closeLabel = translate('AriaLabel.Close');

  const shouldShow = enabled && seen !== 'true';
  const tooltipOpen = phase === 'entering' || phase === 'open' || phase === 'exiting';

  const dismissImmediately = useCallback(() => {
    setPhase('hidden');
    setSeen('true');
    contentElementRef.current = null;
  }, [setSeen]);

  const beginExit = useCallback(() => {
    setPhase((current) => (current === 'open' || current === 'entering' ? 'exiting' : current));
  }, []);

  const updateAnchorRect = useCallback(() => {
    const node = itemRef.current;
    if (!node) {
      return;
    }
    setAnchorRect(node.getBoundingClientRect());
  }, []);

  // Open after first render when eligible.
  useEffect(() => {
    if (!shouldShow || phase !== 'hidden') {
      return undefined;
    }

    const raf = requestAnimationFrame(() => {
      setPhase('entering');
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [shouldShow, phase]);

  // entering → open on next frame so the CSS transition runs from the start styles.
  useEffect(() => {
    if (phase !== 'entering') {
      return undefined;
    }

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('open');
      });
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  // exiting → persist dismiss after animation completes.
  useEffect(() => {
    if (phase !== 'exiting') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPhase('hidden');
      setSeen('true');
      contentElementRef.current = null;
    }, ANIMATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, setSeen]);

  // Keep the ghost trigger aligned with the rail item while the tip is visible
  // (including while the rail width is animating on collapse).
  useLayoutEffect(() => {
    if (!tooltipOpen) {
      return undefined;
    }

    updateAnchorRect();

    const node = itemRef.current;
    const resizeObserver =
      node && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateAnchorRect) : null;
    if (node && resizeObserver) {
      resizeObserver.observe(node);
    }

    window.addEventListener('resize', updateAnchorRect);
    window.addEventListener('scroll', updateAnchorRect, true);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateAnchorRect);
      window.removeEventListener('scroll', updateAnchorRect, true);
    };
  }, [tooltipOpen, collapsed, updateAnchorRect]);

  // Navigating away → immediate dismiss (no exit transition).
  useEffect(() => {
    if (phase !== 'open' && phase !== 'entering' && phase !== 'exiting') {
      return undefined;
    }

    // Router.events is undefined in Jest (and some SSR paths).
    const events = Router.events;
    if (!events) {
      return undefined;
    }

    events.on('routeChangeStart', dismissImmediately);
    return () => {
      events.off('routeChangeStart', dismissImmediately);
    };
  }, [phase, dismissImmediately]);

  // Animate out when the sidebar collapses (expanded → icon-only).
  useEffect(() => {
    const justCollapsed = collapsed && !prevCollapsedRef.current;
    prevCollapsedRef.current = collapsed;

    if (!justCollapsed) {
      return;
    }

    beginExit();
  }, [collapsed, beginExit]);

  // Apply enter/exit motion via inline styles (Tailwind arbitrary classes in this
  // package are not reliably emitted into the app CSS bundle).
  useLayoutEffect(() => {
    if (!tooltipOpen) {
      return;
    }

    const content = contentElementRef.current ?? document.querySelector(`.${CONTENT_MARKER_CLASS}`);

    if (!(content instanceof HTMLElement)) {
      return;
    }

    contentElementRef.current = content;
    applyPhaseStyles(content, phase);
  }, [phase, tooltipOpen]);

  // X only — EducationalTooltipContent does not forward onInteractOutside, so outside
  // clicks would otherwise dismiss via onOpenChange(false). We keep `open` controlled and
  // dismiss the close affordance ourselves (the only button in the tooltip content).
  useEffect(() => {
    if (phase !== 'open' && phase !== 'entering') {
      return undefined;
    }

    const content = contentElementRef.current ?? document.querySelector(`.${CONTENT_MARKER_CLASS}`);
    if (!(content instanceof HTMLElement)) {
      return undefined;
    }

    const closeButton = content.querySelector('button');
    if (!(closeButton instanceof HTMLElement)) {
      return undefined;
    }

    const handleCloseClick = () => {
      beginExit();
    };

    closeButton.addEventListener('click', handleCloseClick);
    return () => {
      closeButton.removeEventListener('click', handleCloseClick);
    };
  }, [phase, beginExit]);

  const titleKey = 'Heading.NewSidebarToggle';
  const descriptionKey = 'Description.NewSidebarToggle';
  const title = translate(titleKey);
  const description = translate(descriptionKey);
  const resolvedTitle =
    title === titleKey
      ? // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pending Translations Hub key Heading.NewSidebarToggle
        'New sidebar toggle'
      : title;
  const resolvedDescription =
    description === descriptionKey
      ? // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- pending Translations Hub key Description.NewSidebarToggle
        'Free up some page space by shrinking your navigation.'
      : description;

  const tooltip =
    tooltipOpen && anchorRect && typeof document !== 'undefined'
      ? createPortal(
          <EducationalTooltip open={tooltipOpen}>
            <EducationalTooltipTrigger asChild>
              <span
                aria-hidden
                style={{
                  position: 'fixed',
                  left: anchorRect.left,
                  top: anchorRect.top,
                  width: anchorRect.width,
                  height: anchorRect.height,
                  pointerEvents: 'none',
                  opacity: 0,
                }}
              />
            </EducationalTooltipTrigger>
            <EducationalTooltipContent
              position='right-end'
              hasCloseAffordance
              closeLabel={closeLabel}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
              }}
              className={CONTENT_MARKER_CLASS}>
              <EducationalTooltipBody className='padding-medium'>
                <EducationalTooltipTitle>{resolvedTitle}</EducationalTooltipTitle>
                <EducationalTooltipDescription>{resolvedDescription}</EducationalTooltipDescription>
              </EducationalTooltipBody>
            </EducationalTooltipContent>
          </EducationalTooltip>,
          document.body,
        )
      : null;

  return (
    <>
      {/*
        Inline width — Tailwind `w-full` is not reliable from this package's dist.
        Must stay full-width so icon-only snap + rail alignItems:center don't recenter.
      */}
      <div ref={itemRef} style={{ width: '100%' }}>
        {children}
      </div>
      {tooltip}
    </>
  );
};

export default SidebarToggleTooltip;
