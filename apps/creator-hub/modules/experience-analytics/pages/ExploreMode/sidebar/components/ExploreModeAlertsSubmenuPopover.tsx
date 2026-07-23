import type { FC, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  Menu,
  MenuItem,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import { DropdownContext } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeShared';
import type { TDropdownContext } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeShared';
import type { AlertForMetric } from '@modules/experience-analytics-shared/exploreMode/useAlertsForMetric';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const ALERT_ID_VALUE_PREFIX = 'explore-mode-alert:';

const toMenuValue = (alertId: string): string => `${ALERT_ID_VALUE_PREFIX}${alertId}`;
const fromMenuValue = (value: string): string => value.slice(ALERT_ID_VALUE_PREFIX.length);

const SIDE_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 8;
const SUBMENU_WIDTH_PX = 240;
// Sits above the parent multiselect popover (z-index 1050 in Foundation menus)
// so the cascading sub-menu visibly stacks on top of its anchor row.
const SUBMENU_Z_INDEX = 1060;

type ContentPosition = {
  top: number;
  left: number;
  maxHeight: number;
};

const computeRightSidePosition = (rect: DOMRect): ContentPosition => {
  const top = Math.max(VIEWPORT_PADDING_PX, rect.top);
  const wouldOverflowRight = rect.right + SIDE_GAP_PX + SUBMENU_WIDTH_PX > window.innerWidth;
  const left = wouldOverflowRight
    ? Math.max(VIEWPORT_PADDING_PX, rect.left - SIDE_GAP_PX - SUBMENU_WIDTH_PX)
    : rect.right + SIDE_GAP_PX;
  const maxHeight = Math.max(0, window.innerHeight - top - VIEWPORT_PADDING_PX);
  return { top, left, maxHeight };
};

export type ExploreModeAlertsSubmenuPopoverProps = {
  /**
   * Whether the cascading sub-menu is open. Owned by the parent
   * `ExploreModeAnnotationsControl` so it can sync open state with focus
   * on the `Alerts` row and forward the popover's content node ref into
   * `FoundationLikeMultiSelect.additionalInsidePointerRefs`.
   */
  open: boolean;
  /**
   * The DOM ref of the parent `MenuItem` (`Alerts` row). Used as the
   * positioning anchor for the portalled sub-menu.
   */
  anchorRef: RefObject<HTMLElement | null>;
  /**
   * Ref the portalled sub-menu's outer container is exposed through so the
   * parent `FoundationLikeMultiSelect` can recognise pointerdowns inside
   * the sub-menu as "inside" via its `additionalInsidePointerRefs` prop
   * and stay open while the user picks rows.
   */
  contentRef: RefObject<HTMLDivElement | null>;
  /**
   * Always non-empty. Loading and empty-list states are surfaced by the
   * parent `ExploreModeAnnotationsControl` hiding both the Alerts row and
   * this popover entirely — so the sub-menu only renders when there's at
   * least one alert to pin.
   */
  availableAlerts: readonly AlertForMetric[];
  /**
   * `null` means "no `annotation_alertId` filter" (URL param unset). The sub-menu
   * still renders rows so users can pin specific alerts; checking the
   * first one will materialise the filter.
   */
  selectedAlertIds: ReadonlySet<string> | null;
  onToggleAlertId: (alertId: string) => void;
};

const ExploreModeAlertsSubmenuPopover: FC<ExploreModeAlertsSubmenuPopoverProps> = ({
  open,
  anchorRef,
  contentRef,
  availableAlerts,
  selectedAlertIds,
  onToggleAlertId,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const [position, setPosition] = useState<ContentPosition | null>(null);

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) {
      return;
    }
    setPosition(computeRightSidePosition(anchorRef.current.getBoundingClientRect()));
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const handleSelect = useCallback(
    (menuValue: string) => {
      onToggleAlertId(fromMenuValue(menuValue));
    },
    [onToggleAlertId],
  );

  // Override the surrounding parent multiselect's `DropdownContext` so the
  // sub-menu's `MenuItem`s render their trailing check icon from our
  // per-alert selection (the parent's context tracks the *annotation-type*
  // selection, which only includes the parent `Alerts` row) and route
  // clicks to `handleSelect` instead of the parent's annotation-type
  // toggle handler.
  const alertSubmenuDropdownContext = useMemo<TDropdownContext>(
    () => ({
      size: 'Medium',
      selectedValues: selectedAlertIds ? Array.from(selectedAlertIds).map(toMenuValue) : [],
      onItemSelect: handleSelect,
    }),
    [selectedAlertIds, handleSelect],
  );

  if (!open || position === null || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    // `width` (Foundation exposes `width-*`, no `w-*`, and only preset
    // tokens) and `z-index` (Foundation Tailwind ships no z-index utility
    // at all) are intentionally inline styles — `w-[240px]` / `z-[1060]`
    // silently no-op under the custom Foundation Tailwind config and left
    // the portalled sub-menu unsized and stacking below its anchor.
    <div
      ref={contentRef}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- non-modal cascading popover; native <dialog> would impose default padding/border/background/inset and display:none-unless-open semantics that don't fit a portalled menu container.
      role='dialog'
      aria-label={translate(
        translationKey('Label.Annotation.ConfiguredAlertIncident', TranslationNamespace.Analytics),
      )}
      className='fixed radius-large'
      style={{
        top: position.top,
        left: position.left,
        width: SUBMENU_WIDTH_PX,
        maxHeight: position.maxHeight > 0 ? position.maxHeight : undefined,
        overflowY: position.maxHeight > 0 ? 'auto' : undefined,
        zIndex: SUBMENU_Z_INDEX,
      }}>
      <DropdownContext.Provider value={alertSubmenuDropdownContext}>
        <Menu size='Medium' className='padding-small'>
          {availableAlerts.map((alert) => (
            <MenuItem
              key={alert.alertId}
              value={toMenuValue(alert.alertId)}
              title={alert.name || alert.alertId}
            />
          ))}
        </Menu>
      </DropdownContext.Provider>
    </div>,
    document.body,
  );
};

export default ExploreModeAlertsSubmenuPopover;
