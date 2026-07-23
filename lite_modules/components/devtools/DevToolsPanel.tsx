import { Button, IconButton } from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import {
  DEV_TOOLS_DOCK_ITEM_OFFSET,
  DEV_TOOLS_DOCK_PADDING,
  type DevToolsDockItem,
  type DevToolsDockPosition as Position,
  useDevToolsDock,
} from '@components/devtools/DevToolsDock';
import styles from '@components/devtools/DevToolsPanel.module.css';

/**
 * App-style notification badge shown on the collapsed widget.
 * - `dot`: a plain circle (e.g. indicates an active state).
 * - `count`: a numbered pill; hidden when `count` is 0.
 */
type DevToolsPanelBadge = { type: 'dot' } | { type: 'count'; count: number };

interface DevToolsPanelProps {
  /** Notification badge shown on the collapsed widget. */
  badge?: DevToolsPanelBadge;
  children: ReactNode;
  closeLabel: string;
  openLabel: string;
  positionVariant?: DevToolsDockItem;
  title: string;
}

const COLLAPSED_WIDGET_SIZE = 56;
const WIDGET_HEIGHT = 56;
const PANEL_GAP = 8;
const VIEWPORT_MARGIN = 8;
const DRAG_THRESHOLD_PX = 4;
const PANEL_WIDTH_BY_VARIANT: Record<NonNullable<DevToolsPanelProps['positionVariant']>, number> = {
  default: 320,
  metadataOverrides: 520,
};
const TOP_BY_VARIANT: Record<NonNullable<DevToolsPanelProps['positionVariant']>, number> = {
  default: 20,
  metadataOverrides: 80,
};
const RIGHT_BY_VARIANT: Record<NonNullable<DevToolsPanelProps['positionVariant']>, number> = {
  default: 100,
  metadataOverrides: 20,
};
const POSITION_STORAGE_KEY_PREFIX = 'devtools-panel-position';

const getStorageKey = (positionVariant: NonNullable<DevToolsPanelProps['positionVariant']>) =>
  `${POSITION_STORAGE_KEY_PREFIX}-${positionVariant}`;

const getDefaultPosition = (
  positionVariant: NonNullable<DevToolsPanelProps['positionVariant']>,
): Position => ({
  x: window.innerWidth - COLLAPSED_WIDGET_SIZE - RIGHT_BY_VARIANT[positionVariant],
  y: TOP_BY_VARIANT[positionVariant],
});

const clampPosition = (position: Position, width: number): Position => {
  const maxX = Math.max(0, window.innerWidth - width);
  const maxY = Math.max(0, window.innerHeight - WIDGET_HEIGHT);

  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
};

const readPosition = (
  positionVariant: NonNullable<DevToolsPanelProps['positionVariant']>,
): Position | null => {
  try {
    const rawValue = window.localStorage.getItem(getStorageKey(positionVariant));
    if (!rawValue) {
      return null;
    }
    const parsedValue = JSON.parse(rawValue);
    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      typeof parsedValue.x !== 'number' ||
      typeof parsedValue.y !== 'number'
    ) {
      return null;
    }
    return parsedValue;
  } catch {
    return null;
  }
};

const writePosition = (
  positionVariant: NonNullable<DevToolsPanelProps['positionVariant']>,
  position: Position,
) => {
  try {
    window.localStorage.setItem(getStorageKey(positionVariant), JSON.stringify(position));
  } catch {
    // Ignore storage write errors in private mode or restrictive browser settings.
  }
};

interface DevToolsPanelStyleParams {
  isDragging: boolean;
  panelLeft: number;
  panelMaxHeight: number;
  panelTop: number;
  panelTransformOrigin: string;
  panelWidth: number;
  widgetLeft: number;
  widgetTop: number;
}

const BADGE_COUNT_SIZE = 18;
const BADGE_DOT_SIZE = 18;

const useDevToolsPanelStyles = makeStyles<DevToolsPanelStyleParams>()((theme, params) => ({
  badgeBase: {
    // Anchor on the circular button's upper-right edge (MUI circular-overlap
    // pattern): position the badge centre on the perimeter regardless of size.
    backgroundColor: theme.palette.error.main,
    border: `2px solid ${theme.palette.warning.main}`,
    borderRadius: '999px',
    boxShadow: theme.shadows[3],
    boxSizing: 'border-box',
    pointerEvents: 'none',
    position: 'absolute',
    right: '14%',
    top: '14%',
    transform: 'translate(50%, -50%)',
    zIndex: 1,
  },
  badgeCount: {
    alignItems: 'center',
    color: theme.palette.common.white,
    display: 'flex',
    fontSize: '11px',
    fontWeight: 700,
    height: `${BADGE_COUNT_SIZE}px`,
    justifyContent: 'center',
    lineHeight: 1,
    minWidth: `${BADGE_COUNT_SIZE}px`,
    padding: '0 5px',
  },
  badgeDot: {
    height: `${BADGE_DOT_SIZE}px`,
    width: `${BADGE_DOT_SIZE}px`,
  },
  dragHandle: {
    cursor: params.isDragging ? 'grabbing' : 'grab',
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
  },
  panel: {
    backdropFilter: 'blur(28px) saturate(1.2)',
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, rgba(45, 45, 48, 0.86), rgba(24, 24, 27, 0.74))'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(245, 245, 245, 0.76))',
    borderRadius: theme.border.radius.large.borderRadius,
    boxShadow:
      '0 18px 50px rgba(0, 0, 0, 0.34), 0 4px 14px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    boxSizing: 'border-box',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: `${params.panelMaxHeight}px`,
    overflowY: 'auto',
    padding: '16px',
    WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
  },
  panelFloating: {
    left: `${params.panelLeft}px`,
    pointerEvents: 'auto',
    position: 'fixed',
    top: `${params.panelTop}px`,
    transformOrigin: params.panelTransformOrigin,
    width: `${params.panelWidth}px`,
    zIndex: theme.zIndex.modal + 11,
  },
  title: {
    flex: 1,
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
  },
  toggleButton: {
    // Use !important so the round + yellow treatment wins over the Foundation
    // IconButton `variant='Standard'` Tailwind classes (which otherwise set
    // their own background, radius, and sizing). The fixed 56px square keeps
    // the launcher aligned with the drag/position math, which assumes
    // COLLAPSED_WIDGET_SIZE.
    '&:focus-visible': {
      boxShadow: `${theme.shadows[4]} !important`,
      outline: 'none !important',
    },
    '&:hover': {
      backgroundColor: `${theme.palette.warning.dark} !important`,
    },
    // The inner icon glyph carries its own Foundation `content-*` color class,
    // so override it directly to render the icon black on the yellow launcher.
    '& .icon': {
      color: '#000000 !important',
    },
    backgroundColor: `${theme.palette.warning.main} !important`,
    borderRadius: '999px !important',
    boxShadow: theme.shadows[4],
    color: `${theme.palette.warning.contrastText} !important`,
    height: `${COLLAPSED_WIDGET_SIZE}px !important`,
    padding: 0,
    transition: 'background-color 100ms ease, box-shadow 100ms ease, transform 100ms ease',
    width: `${COLLAPSED_WIDGET_SIZE}px !important`,
  },
  toggleButtonActive: {
    '&:focus-visible': {
      boxShadow:
        'inset 0 6px 8px rgba(0, 0, 0, 0.52), inset 0 -2px 1px rgba(255, 255, 255, 0.18) !important',
      outline: 'none !important',
    },
    '&:hover': {
      backgroundColor: `${theme.palette.warning.dark} !important`,
    },
    '& .icon': {
      color: '#000000 !important',
    },
    backgroundColor: `${theme.palette.warning.dark} !important`,
    boxShadow: 'inset 0 6px 8px rgba(0, 0, 0, 0.52), inset 0 -2px 1px rgba(255, 255, 255, 0.18)',
    transform: 'scale(0.96)',
  },
  widget: {
    cursor: params.isDragging ? 'grabbing' : 'grab',
    left: `${params.widgetLeft}px`,
    pointerEvents: 'auto',
    position: 'fixed',
    top: `${params.widgetTop}px`,
    width: `${COLLAPSED_WIDGET_SIZE}px`,
    zIndex: theme.zIndex.modal + 10,
  },
}));

const DevToolsPanel = ({
  badge,
  children,
  closeLabel,
  openLabel,
  positionVariant = 'default',
  title,
}: DevToolsPanelProps) => {
  const dock = useDevToolsDock();
  const dockActiveItem = dock?.activeItem;
  const dockPersistPosition = dock?.persistPosition;
  const dockPosition = dock?.position;
  const dockRegisterItem = dock?.registerItem;
  const dockRegisteredItems = dock?.registeredItems;
  const dockSetActiveItem = dock?.setActiveItem;
  const dockSetPosition = dock?.setPosition;
  const dockUpdateBoundedPosition = dock?.updateBoundedPosition;
  const isDocked = dock !== null;
  const [standaloneIsOpen, setStandaloneIsOpen] = useState<boolean>(false);
  const [isPanelMounted, setIsPanelMounted] = useState<boolean>(false);
  const [standalonePosition, setStandalonePosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [dragStartCursor, setDragStartCursor] = useState<Position | null>(null);
  const [hasDragged, setHasDragged] = useState<boolean>(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const positionKeyVariant = positionVariant;
  const panelWidth = PANEL_WIDTH_BY_VARIANT[positionVariant];
  const widgetWidth = COLLAPSED_WIDGET_SIZE;
  const collapsedIcon =
    positionVariant === 'metadataOverrides' ? 'icon-filled-flag' : 'icon-filled-code';
  const [panelHeight, setPanelHeight] = useState<number>(320);
  const isOpen = isDocked ? dockActiveItem === positionVariant : standaloneIsOpen;
  const position = dockPosition ?? standalonePosition;
  const setPosition = dockSetPosition ?? setStandalonePosition;
  const widgetOffset =
    isDocked && positionVariant === 'default' && dockRegisteredItems?.has('metadataOverrides')
      ? DEV_TOOLS_DOCK_ITEM_OFFSET
      : 0;
  const widgetLeft = position?.x ?? 0;
  const widgetTop = (position?.y ?? 0) + widgetOffset;

  useEffect(() => {
    if (!dockRegisterItem) {
      return undefined;
    }
    return dockRegisterItem(positionVariant);
  }, [dockRegisterItem, positionVariant]);

  const persistPosition = useCallback(
    (nextPosition: Position) => {
      if (dockPersistPosition) {
        dockPersistPosition(nextPosition);
      } else {
        writePosition(positionKeyVariant, nextPosition);
      }
    },
    [dockPersistPosition, positionKeyVariant],
  );

  const updateBoundedPosition = useCallback(
    (nextPosition: Position) => {
      if (dockUpdateBoundedPosition) {
        const boundedDockPosition = dockUpdateBoundedPosition({
          x: nextPosition.x,
          y: nextPosition.y - widgetOffset,
        });
        return {
          x: boundedDockPosition.x,
          y: boundedDockPosition.y + widgetOffset,
        };
      }
      const boundedPosition = clampPosition(nextPosition, widgetWidth);
      setStandalonePosition(boundedPosition);
      return boundedPosition;
    },
    [dockUpdateBoundedPosition, widgetOffset, widgetWidth],
  );

  useEffect(() => {
    if (isDocked) {
      return;
    }
    const storedPosition = readPosition(positionKeyVariant);
    const initialPosition = clampPosition(
      storedPosition ?? getDefaultPosition(positionKeyVariant),
      widgetWidth,
    );
    setStandalonePosition(initialPosition);
    if (!storedPosition) {
      persistPosition(initialPosition);
    }
  }, [isDocked, persistPosition, positionKeyVariant, widgetWidth]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (dockSetActiveItem) {
          dockSetActiveItem(null);
        } else {
          setStandaloneIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dockSetActiveItem, isOpen]);

  useEffect(() => {
    if (
      isDocked &&
      dockActiveItem !== null &&
      dockActiveItem !== undefined &&
      dockActiveItem !== positionVariant
    ) {
      setIsPanelMounted(false);
    }
  }, [dockActiveItem, isDocked, positionVariant]);

  useEffect(() => {
    if (isDocked || !position) {
      return;
    }
    const boundedPosition = clampPosition(position, widgetWidth);
    if (boundedPosition.x !== position.x || boundedPosition.y !== position.y) {
      setPosition(boundedPosition);
      persistPosition(boundedPosition);
    }
  }, [isDocked, persistPosition, position, setPosition, widgetWidth]);

  useEffect(() => {
    if (isDocked) {
      return undefined;
    }
    const handleResize = () => {
      if (!position) {
        return;
      }
      const boundedPosition = clampPosition(position, widgetWidth);
      setPosition(boundedPosition);
      persistPosition(boundedPosition);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isDocked, persistPosition, position, setPosition, widgetWidth]);

  useEffect(() => {
    if (!isPanelMounted || !panelRef.current) {
      return;
    }
    const measuredHeight = panelRef.current.offsetHeight;
    if (measuredHeight > 0 && Math.abs(measuredHeight - panelHeight) > 1) {
      setPanelHeight(measuredHeight);
    }
  }, [children, isPanelMounted, panelHeight]);

  // Foundation SheetRoot is a modal Radix dialog: it traps focus via document
  // `focusin` and dismisses on outside `pointerdown`. Stop those from leaving
  // the widget so tools stay usable while a sheet is open. Leave mousedown/
  // click alone so toggle + drag keep working.
  const isWidgetRendered = position !== null;
  useEffect(() => {
    const widgetNode = widgetRef.current;
    if (!isWidgetRendered || !widgetNode) {
      return undefined;
    }
    const stopFromReachingDocument = (event: Event): void => {
      event.stopPropagation();
    };
    widgetNode.addEventListener('focusin', stopFromReachingDocument);
    widgetNode.addEventListener('pointerdown', stopFromReachingDocument);
    return () => {
      widgetNode.removeEventListener('focusin', stopFromReachingDocument);
      widgetNode.removeEventListener('pointerdown', stopFromReachingDocument);
    };
  }, [isWidgetRendered]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) {
        return;
      }
      if (!dragStartCursor) {
        return;
      }
      const deltaX = event.clientX - dragStartCursor.x;
      const deltaY = event.clientY - dragStartCursor.y;
      const hasExceededThreshold = Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD_PX;
      if (!hasExceededThreshold) {
        return;
      }
      setHasDragged(true);
      updateBoundedPosition({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      if (!isDragging) {
        return;
      }
      setIsDragging(false);
      setDragStartCursor(null);
      if (position) {
        persistPosition(position);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragOffset.x,
    dragOffset.y,
    dragStartCursor,
    isDragging,
    persistPosition,
    position,
    updateBoundedPosition,
  ]);

  const handleMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    if (!widgetRef.current) {
      return;
    }

    setHasDragged(false);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setDragStartCursor({
      x: event.clientX,
      y: event.clientY,
    });
    setIsDragging(true);
  };

  const handleOpen = (): void => {
    setIsPanelMounted(true);
    if (dockSetActiveItem) {
      dockSetActiveItem(positionVariant);
    } else {
      setStandaloneIsOpen(true);
    }
  };

  const handleClose = (): void => {
    if (dockSetActiveItem) {
      dockSetActiveItem(null);
    } else {
      setStandaloneIsOpen(false);
    }
  };

  const handlePanelAnimationEnd = (event: React.AnimationEvent<HTMLElement>): void => {
    if (!isOpen && event.currentTarget === event.target) {
      setIsPanelMounted(false);
    }
  };

  const dockEdgePadding = isDocked ? DEV_TOOLS_DOCK_PADDING : 0;
  const doesPanelOpenRight = widgetLeft < window.innerWidth / 2;
  const panelX = doesPanelOpenRight
    ? widgetLeft + COLLAPSED_WIDGET_SIZE + dockEdgePadding + PANEL_GAP
    : widgetLeft - dockEdgePadding - panelWidth - PANEL_GAP;
  const dockTop = position?.y ?? widgetTop;
  const dockItemCount = dockRegisteredItems?.size ?? 1;
  const dockHeight =
    COLLAPSED_WIDGET_SIZE + Math.max(0, dockItemCount - 1) * DEV_TOOLS_DOCK_ITEM_OFFSET;
  const dockBottomItemOffset = dockItemCount > 1 ? DEV_TOOLS_DOCK_ITEM_OFFSET : 0;
  const isDockInBottomHalf = isDocked && dockTop + dockHeight / 2 > window.innerHeight / 2;
  const panelAnchorIconTop =
    isDocked && isDockInBottomHalf ? dockTop + dockBottomItemOffset : dockTop;
  const panelAnchorIconBottom = panelAnchorIconTop + COLLAPSED_WIDGET_SIZE;
  const panelAlignmentTop = panelAnchorIconTop - dockEdgePadding;
  const panelAlignmentBottom = panelAnchorIconBottom + dockEdgePadding;
  let availablePanelHeight = window.innerHeight - VIEWPORT_MARGIN * 2;
  if (isDocked) {
    availablePanelHeight = isDockInBottomHalf
      ? panelAlignmentBottom - VIEWPORT_MARGIN
      : window.innerHeight - panelAlignmentTop - VIEWPORT_MARGIN;
  }
  const panelMaxHeight = Math.min(
    window.innerHeight - VIEWPORT_MARGIN * 2,
    Math.max(COLLAPSED_WIDGET_SIZE, availablePanelHeight),
  );
  const canAlignStandalonePanelTop =
    widgetTop + panelHeight <= window.innerHeight - VIEWPORT_MARGIN;
  let panelY: number;
  if (isDocked) {
    panelY = isDockInBottomHalf ? panelAlignmentBottom - panelHeight : panelAlignmentTop;
  } else {
    panelY = canAlignStandalonePanelTop
      ? widgetTop
      : widgetTop + COLLAPSED_WIDGET_SIZE - panelHeight;
  }
  const boundedPanelLeft = Math.min(
    Math.max(VIEWPORT_MARGIN, panelX),
    Math.max(VIEWPORT_MARGIN, window.innerWidth - panelWidth - VIEWPORT_MARGIN),
  );
  const boundedPanelTop = Math.min(
    Math.max(VIEWPORT_MARGIN, panelY),
    Math.max(VIEWPORT_MARGIN, window.innerHeight - panelHeight - VIEWPORT_MARGIN),
  );
  const panelAnchorY = Math.min(
    Math.max(0, panelAnchorIconTop + COLLAPSED_WIDGET_SIZE / 2 - boundedPanelTop),
    panelHeight,
  );
  const panelTransformOrigin = `${doesPanelOpenRight ? 'left' : 'right'} ${panelAnchorY}px`;
  const panelSideClass = doesPanelOpenRight ? styles.panelOpensRight : styles.panelOpensLeft;
  const panelAnimationClass = isOpen ? styles.panelEnter : styles.panelExit;
  const {
    classes: {
      badgeBase,
      badgeCount,
      badgeDot,
      dragHandle,
      header,
      panel,
      panelFloating,
      title: titleClass,
      toggleButton,
      toggleButtonActive,
      widget,
    },
  } = useDevToolsPanelStyles({
    isDragging,
    panelLeft: boundedPanelLeft,
    panelMaxHeight,
    panelTop: boundedPanelTop,
    panelTransformOrigin,
    panelWidth,
    widgetLeft,
    widgetTop,
  });

  if (!position) {
    return null;
  }

  const shouldShowBadge = badge !== undefined && (badge.type === 'dot' || badge.count > 0);

  let badgeLabel: string | null = null;
  if (badge?.type === 'count') {
    badgeLabel = badge.count > 99 ? '99+' : String(badge.count);
  }

  return (
    <div
      className={widget}
      data-position-variant={positionVariant}
      data-widget-left={widgetLeft}
      data-widget-top={widgetTop}
      ref={widgetRef}>
      {isPanelMounted ? (
        <section
          className={`${panel} ${panelFloating} ${panelSideClass} ${panelAnimationClass}`}
          data-animation-state={isOpen ? 'entering' : 'exiting'}
          data-panel-left={boundedPanelLeft}
          data-panel-max-height={panelMaxHeight}
          data-panel-side={doesPanelOpenRight ? 'right' : 'left'}
          data-panel-top={boundedPanelTop}
          onAnimationEnd={handlePanelAnimationEnd}
          ref={panelRef}>
          <div className={header}>
            <Button
              aria-label={`Drag ${title}`}
              className={dragHandle}
              onMouseDown={handleMouseDown}
              size='Small'
              variant='Utility'>
              ↕
            </Button>
            <h2 className={titleClass}>{title}</h2>
            <Button onClick={handleClose} size='Small' variant='Utility'>
              {closeLabel}
            </Button>
          </div>
          {children}
        </section>
      ) : null}
      <IconButton
        aria-expanded={isOpen}
        ariaLabel={isOpen ? closeLabel : openLabel}
        className={`${toggleButton} ${isOpen ? toggleButtonActive : ''}`}
        icon={collapsedIcon}
        isCircular
        isSelected={isOpen}
        onClick={() => {
          if (!hasDragged) {
            if (isOpen) {
              handleClose();
            } else {
              handleOpen();
            }
          }
        }}
        onMouseDown={handleMouseDown}
        size='Medium'
        variant='Standard'
      />
      {shouldShowBadge && badge !== undefined ? (
        <span
          aria-hidden
          className={`${badgeBase} ${badge.type === 'count' ? badgeCount : badgeDot}`}>
          {badgeLabel}
        </span>
      ) : null}
    </div>
  );
};

export default DevToolsPanel;
