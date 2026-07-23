import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clsx,
  interactable,
  MENU_ITEM_GAP_X_CLASS_BY_SIZE,
  MENU_ITEM_PADDING_Y_CLASS_BY_SIZE,
  MENU_ITEM_RADIUS_CLASS_BY_SIZE,
  MENU_PADDING_X_CLASS_BY_SIZE,
  StateLayer,
  TEXT_CLASS_BY_SIZE,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeShared';
import type ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { AnnotationType } from '@modules/clients/analytics';
import ChartConfiguratorAnnotationsControl, {
  getAnnotationOptionLabel,
  type ChartConfiguratorAnnotationOptionRendererArgs,
} from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorAnnotationsControl';
import {
  getAnnotationOptionsFromAnnotationTypes,
  type AnnotationOptions,
} from '@modules/experience-analytics-shared/constants/annotationConfig';
import { useExploreModeAlertSelection } from '@modules/experience-analytics-shared/exploreMode/ExploreModeAlertSelectionContext';
import useCurrentAnnotationsBundleProvider from '@modules/experience-analytics-shared/hooks/useCurrentAnnotationsBundleProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import ExploreModeAlertsSubmenuPopover from './ExploreModeAlertsSubmenuPopover';

const ALERTS_OPTION_VALUE: AnnotationOptions = AnnotationType.ConfiguredAlertIncident;

const stripAlertsOption = (values: readonly AnnotationOptions[]): AnnotationOptions[] =>
  values.filter((v) => v !== ALERTS_OPTION_VALUE);

type ExploreModeAnnotationsControlProps = {
  resourceType: ChartResourceType;
  className?: string;
  selectedAnnotationOptions?: readonly AnnotationOptions[];
  onAnnotationOptionsChange?: (annotationOptions: readonly AnnotationOptions[]) => void;
};

const ExploreModeAnnotationsControl: FC<ExploreModeAnnotationsControlProps> = ({
  resourceType,
  className,
  selectedAnnotationOptions: controlledSelectedAnnotationOptions,
  onAnnotationOptionsChange: controlledOnAnnotationOptionsChange,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const {
    supportedAnnotationTypes,
    defaultAnnotationTypes,
    selectedAnnotationOptions: providerSelectedAnnotationOptions,
    onAnnotationOptionsChange: providerOnAnnotationOptionsChange,
  } = useCurrentAnnotationsBundleProvider(resourceType);
  const selectedAnnotationOptions =
    controlledSelectedAnnotationOptions ?? providerSelectedAnnotationOptions;
  const onAnnotationOptionsChange =
    controlledOnAnnotationOptionsChange ?? providerOnAnnotationOptionsChange;

  const {
    selectedAlertIds,
    availableAlertsForMetric,
    isLoadingAvailableAlerts,
    setSelectedAlertIds,
  } = useExploreModeAlertSelection();

  const options = useMemo(
    () => getAnnotationOptionsFromAnnotationTypes(supportedAnnotationTypes),
    [supportedAnnotationTypes],
  );

  const defaultOptions = useMemo(
    () => getAnnotationOptionsFromAnnotationTypes(defaultAnnotationTypes),
    [defaultAnnotationTypes],
  );

  const supportsAlertsRow = options.includes(ALERTS_OPTION_VALUE);
  // Hide the Alerts row entirely while the alert list is loading or when
  // the current metric has no configured alerts. In both cases the
  // cascading sub-menu has nothing meaningful to show, so a dangling
  // chevron row would be a dead end — better to surface "nothing to pick"
  // by not rendering the row at all. Once loading finishes the row pops
  // back in (or stays hidden if the metric truly has no alerts).
  const showAlertsRow =
    supportsAlertsRow && !isLoadingAvailableAlerts && availableAlertsForMetric.length > 0;

  // Number of alerts the user has actively pinned for the current metric
  // (post-narrowing — stale ids that don't match the metric don't count).
  // This — NOT `selectedAnnotationOptions.includes(ALERTS_OPTION_VALUE)` —
  // is the single source of truth for whether the Alerts annotation type
  // is "on" in the chart.
  const selectedAlertCount = selectedAlertIds?.size ?? 0;
  const hasSelectedAlerts = selectedAlertCount > 0;

  // Keep `selectedAnnotationOptions` (which drives the bundle-provider's
  // URL `annotations` param and therefore which annotation types the
  // backend fetches) in sync with the alert-id selection. The Alerts row
  // is no longer user-toggleable from the parent menu, so this effect is
  // the only writer that flips ConfiguredAlertIncident on / off.
  //
  // - `hasSelectedAlerts === true`  → ensure ConfiguredAlertIncident is in
  //   the selection. Without this, the existing annotations pipeline
  //   wouldn't request incident data from the backend.
  // - `hasSelectedAlerts === false` → ensure ConfiguredAlertIncident is
  //   NOT in the selection. Stops the chart from rendering any incidents
  //   and stops the backend fetch.
  const isConfiguredAlertIncidentInSelection =
    selectedAnnotationOptions.includes(ALERTS_OPTION_VALUE);
  useEffect(() => {
    if (hasSelectedAlerts === isConfiguredAlertIncidentInSelection) {
      return;
    }
    const withoutAlerts = stripAlertsOption(selectedAnnotationOptions);
    const next = hasSelectedAlerts ? [...withoutAlerts, ALERTS_OPTION_VALUE] : withoutAlerts;
    onAnnotationOptionsChange(next);
  }, [
    hasSelectedAlerts,
    isConfiguredAlertIncidentInSelection,
    selectedAnnotationOptions,
    onAnnotationOptionsChange,
  ]);

  const [submenuOpen, setSubmenuOpen] = useState(false);
  const alertsRowAnchorRef = useRef<HTMLDivElement | null>(null);
  const submenuContentRef = useRef<HTMLDivElement | null>(null);

  // Refs forwarded into the parent multiselect's `additionalInsidePointerRefs`
  // so a pointerdown landing on either the anchor row or the cascading
  // popover doesn't dismiss the parent dropdown.
  const additionalInsidePointerRefs = useMemo(() => [alertsRowAnchorRef, submenuContentRef], []);

  // The Alerts row vanishes the moment the current metric has no
  // configured alerts (typically right after a metric switch). Make sure
  // the floating sub-menu doesn't outlive its anchor. Handled during
  // render (not in a post-commit `useEffect`) so the popover never
  // paints a frame anchored to a row that's about to unmount.
  if (!showAlertsRow && submenuOpen) {
    setSubmenuOpen(false);
  }

  const getOptionLabel = useCallback(
    (option: AnnotationOptions): string => getAnnotationOptionLabel(option, translate),
    [translate],
  );

  // The Alerts row is rendered as a custom, non-checkbox item in the
  // parent menu. The multi-select must therefore neither see it in
  // `value` (so it doesn't paint a check mark or get included in
  // change-event arrays) nor accept toggles for it from the keyboard
  // listbox. The bundle provider's selection state (which DOES include
  // ConfiguredAlertIncident when alerts are pinned, via the sync effect
  // above) is preserved across user-driven changes to other rows.
  const valueWithoutAlerts = useMemo(
    () => stripAlertsOption(selectedAnnotationOptions),
    [selectedAnnotationOptions],
  );
  const defaultsWithoutAlerts = useMemo(() => stripAlertsOption(defaultOptions), [defaultOptions]);

  const onChange = useCallback(
    (nextValues: AnnotationOptions[]) => {
      // ChartConfiguratorAnnotationsControl has already applied the shared
      // `None`/default reconciliation. Explore only strips the alert row
      // sentinel because alert annotations are driven by pinned alert ids.
      // Belt-and-braces: ignore any ConfiguredAlertIncident value that
      // somehow slips through. The non-checkbox row should never produce
      // one in practice, but the parent listbox's keyboard handler is
      // outside our control.
      const reconciled = stripAlertsOption(nextValues);
      // Preserve the alert-driven ConfiguredAlertIncident state. The sync
      // effect would eventually re-add / re-remove it after the bundle
      // round-trip, but doing it here avoids a one-frame flicker where
      // the chart drops incident annotations between the user's click
      // and the next render.
      const preserved = hasSelectedAlerts ? [...reconciled, ALERTS_OPTION_VALUE] : reconciled;
      onAnnotationOptionsChange(preserved);
    },
    [onAnnotationOptionsChange, hasSelectedAlerts],
  );

  const handleParentMultiSelectOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSubmenuOpen(false);
    }
  }, []);

  const handleToggleAlertId = useCallback(
    (alertId: string) => {
      const current = selectedAlertIds ? Array.from(selectedAlertIds) : [];
      const next = current.includes(alertId)
        ? current.filter((id) => id !== alertId)
        : [...current, alertId];
      setSelectedAlertIds(next.length === 0 ? null : next);
    },
    [selectedAlertIds, setSelectedAlertIds],
  );

  const openSubmenu = useCallback(() => setSubmenuOpen(true), []);

  const alertsRowLabel = useMemo(() => getOptionLabel(ALERTS_OPTION_VALUE), [getOptionLabel]);

  // Trigger label is composed from:
  //   1. The user-toggled annotation types (everything except
  //      ConfiguredAlertIncident — that row has no checkbox in the parent
  //      menu, so its presence in the multi-select `value` is invisible).
  //   2. An `Alerts (N)` segment appended whenever the user has pinned
  //      alert ids via the cascading sub-menu. This is the ONLY surface
  //      where the alert-pin state shows up in the trigger.
  const formatValueExtraLabels = useMemo(
    () => (hasSelectedAlerts ? [`${alertsRowLabel} (${selectedAlertCount})`] : []),
    [alertsRowLabel, hasSelectedAlerts, selectedAlertCount],
  );

  if (supportedAnnotationTypes.length === 0) {
    return null;
  }

  const renderMenuOption = ({
    option,
    label: optionLabel,
  }: ChartConfiguratorAnnotationOptionRendererArgs): ReactNode | undefined => {
    if (option !== ALERTS_OPTION_VALUE) {
      return undefined;
    }
    if (!showAlertsRow) {
      return null;
    }
    // Render a non-selectable row (no leading checkbox, no `aria-selected`
    // toggle) with only the chevron in trailing. This intentionally does
    // NOT reuse `MenuItem` because `MenuItem` couples its `onClick` to
    // `DropdownContext.onItemSelect`, which would write
    // ConfiguredAlertIncident back into the multi-select value and
    // race the sync effect.
    return (
      <ExploreModeAlertsCascadingMenuRow
        key={option}
        anchorRef={alertsRowAnchorRef}
        title={optionLabel}
        onOpenSubmenu={openSubmenu}
      />
    );
  };

  return (
    <>
      <ChartConfiguratorAnnotationsControl
        className={className}
        value={valueWithoutAlerts}
        options={options}
        defaultValue={defaultsWithoutAlerts}
        onChange={onChange}
        onOpenChange={handleParentMultiSelectOpenChange}
        formatValueExtraLabels={formatValueExtraLabels}
        // Override the multi-select's default `selectedValues.length > 0`
        // check: pinned alerts contribute to `formatValue` but are stripped
        // from `value`, so without this the trigger would fall back to the
        // muted placeholder when alerts are the only selection.
        hasValueOverride={valueWithoutAlerts.length > 0 || hasSelectedAlerts}
        additionalInsidePointerRefs={additionalInsidePointerRefs}
        renderOption={renderMenuOption}
      />
      {showAlertsRow && (
        <ExploreModeAlertsSubmenuPopover
          open={submenuOpen}
          anchorRef={alertsRowAnchorRef}
          contentRef={submenuContentRef}
          availableAlerts={availableAlertsForMetric}
          selectedAlertIds={selectedAlertIds}
          onToggleAlertId={handleToggleAlertId}
        />
      )}
    </>
  );
};

export default ExploreModeAnnotationsControl;

// ---------------------------------------------------------------------------
// Non-selectable cascading row for the `Alerts` entry in the parent menu.
//
// Visually mimics a `MenuItem` (same paddings / radius / interactable
// state-layer) but:
//   - Renders no leading checkbox and never sets `aria-selected`.
//   - On click / Enter / Space / focus / hover it only opens the sub-menu;
//     it never calls back into the parent multi-select's selection state.
//   - Carries the anchor ref the portalled `ExploreModeAlertsSubmenuPopover`
//     uses for positioning, plus the hover/focus handlers driving the
//     "drag from anchor row into popover" UX.
// ---------------------------------------------------------------------------

type ExploreModeAlertsCascadingMenuRowProps = {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  onOpenSubmenu: () => void;
};

const ExploreModeAlertsCascadingMenuRow: FC<ExploreModeAlertsCascadingMenuRowProps> = ({
  anchorRef,
  title,
  onOpenSubmenu,
}) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenSubmenu();
      }
    },
    [onOpenSubmenu],
  );

  const itemClassName = clsx(
    interactable,
    'flex items-center content-default text-truncate-split focus-visible:hover:outline-none cursor-pointer stroke-none bg-none text-align-x-left width-full outline-offset-0',
    TEXT_CLASS_BY_SIZE.Medium,
    MENU_PADDING_X_CLASS_BY_SIZE.Medium,
    MENU_ITEM_PADDING_Y_CLASS_BY_SIZE.Medium,
    MENU_ITEM_GAP_X_CLASS_BY_SIZE.Medium,
    MENU_ITEM_RADIUS_CLASS_BY_SIZE.Medium,
  );

  return (
    // Static ARIA tooling cannot see that renderOption output lands inside
    // the shared `MenuSection`, so this local menu wrapper keeps the custom
    // menuitem valid without changing the parent multi-select value model.
    <div role='menu'>
      {/* The role is `menuitem` (not `option`) because this row is not part
       of the parent listbox's selectable set — it's an entry point into a
       separate sub-menu. Skipping `aria-selected` keeps screen readers
       from announcing a phantom check state. */}
      <div
        ref={anchorRef}
        role='menuitem'
        aria-haspopup='menu'
        data-value={ALERTS_OPTION_VALUE}
        data-label={title}
        tabIndex={0}
        className={itemClassName}
        onClick={onOpenSubmenu}
        onKeyDown={handleKeyDown}
        onMouseEnter={onOpenSubmenu}
        onFocus={onOpenSubmenu}>
        <StateLayer />
        <span className='grow-1 text-no-wrap text-truncate-split content-emphasis'>{title}</span>
        <span
          aria-hidden='true'
          className='size-400 icon content-muted icon-regular-chevron-large-right'
        />
      </div>
    </div>
  );
};
