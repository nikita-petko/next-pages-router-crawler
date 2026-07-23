import {
  type CSSProperties,
  type FC,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
  useCallback,
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  memo,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { ChartCardResizeCue } from '@rbx/analytics-ui';
import {
  Button,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { SummaryCardHeaderActionsProvider } from '@modules/charts-generic/cards/summaryCards/SummaryCardHeaderActionsContext';
import {
  ChartActionsProvider,
  type ChartActionsPolicy,
} from '@modules/experience-analytics-shared/components/RAQIV2/ChartActionsContext';
import { AnalyticsChartContainerDragDropProvider } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsChartContainerDragDropContext';
import AnalyticsComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsComponent';
import AnalyticsConfigurableComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsConfigurableComponent';
import { RAQIV2ConfigurablePageSurfaceContextProvider } from '@modules/experience-analytics-shared/components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import useRAQIV2PredefinedSurfaceControlsBundle from '@modules/experience-analytics-shared/components/RAQIV2/layout/useRAQIV2PredefinedSurfaceControlsBundle';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import DashboardCanvasControlBar from '../../../components/DashboardCanvasControlBar';
import DashboardFilterChips from '../../../components/DashboardFilterChips';
import DashboardsEmptyStateIllustration from '../../../components/DashboardsEmptyStateIllustration';
import DashboardTileControlError, {
  DashboardTileRenderError,
  getDashboardControlIssuesForComponent,
  getDashboardControlOverrideState,
  type DashboardControlOverrideState,
} from '../../../components/DashboardTileControlError';
import { CUSTOM_DASHBOARDS_LEARN_MORE_HREF } from '../../../constants/docsLinks';
import {
  getEmptyChartSlotTarget,
  selectChartPlacements,
  type ChartPlacement,
} from '../../../layout/chartPlacements';
import { getChartRowColumnCount, getChartRowTiles } from '../../../layout/chartRow';
import { withChartRows, withSummaryCards } from '../../../layout/dashboardLayout';
import { selectDashboardCanvasModel } from '../../../layout/dashboardRenderModel';
import {
  applyResizeAction,
  collapseAdjacentHalfWidthRows,
  findTilePosition,
  flattenRows,
  getChartDragPreviewRows,
  getResizeAction as getRowResizeAction,
  getResizeHandlesForTile,
  moveTileToEmptySlot,
  moveTileToTile,
  removeTile,
  type RowDragPreviewTarget,
  type RowResizeAction,
  type RowResizeSide,
} from '../../../layout/rowLayout';
import type { SynthesizedChartEntry, SynthesizedSummaryEntry } from '../../../synthesis/synthesize';
import useDashboardSynthesis from '../../../synthesis/useDashboardSynthesis';
import {
  MAX_SUMMARY_CARDS_PER_DASHBOARD,
  MAX_CHART_TILES_PER_DASHBOARD,
  type ChartTileConfig,
  type CustomDashboardChartRow,
  type CustomDashboardConfig,
  type TileId,
} from '../../../types';
import { createTileId } from '../../../utils/createTileId';
import { chartContextFingerprint } from '../chartContextFingerprint';
import {
  duplicateChartTileInRows,
  duplicateSummaryCard,
  getSelectedCanvasTile,
  isSameSelectedCanvasTile,
  pasteCanvasTile,
  type CanvasClipboardTile,
  type SelectedCanvasTile,
} from '../editorClipboard';
import useEditPageTranslations from '../useEditPageTranslations';
import DashboardControlDefaultsCaptureProvider from './DashboardControlDefaultsCaptureProvider';
import {
  getSelectionMoveDelta,
  isCanvasTileInteractionTarget,
  isCopyShortcut,
  isPasteShortcut,
  isRedoShortcut,
  isSelectionMoveKey,
  isSummaryCardDeleteKey,
  isTileActionsTarget,
  isUndoShortcut,
  shouldIgnorePageShortcut,
  stopTileActionEventPropagation,
} from './editPageCanvasKeyboard';
import {
  canvasContainerStyle,
  chartAddPlaceholderActionsStyle,
  chartAddPlaceholderCardStyle,
  chartAddPlaceholderCopyStyle,
  chartCanvasGridStyle,
  CHART_COLUMN_GAP_PX,
  chartFullWidthCellStyle,
  chartHalfWidthCellStyle,
  chartTableTileMountStyle,
  chartTileMountStyle,
  inlineTileChromeStyle,
  SUMMARY_ROW_GAP_PX,
  SUMMARY_TILE_MIN_WIDTH_PX,
  summaryAddPlaceholderIconStyle,
  summaryAddPlaceholderStyle,
  summaryRowStyle,
  summarySkeletonStyle,
  summaryTileChromeStyle,
  summaryTileConfiguredSizeStyle,
  summaryTileErrorChromeStyle,
  tileChromeHostStyle,
} from './editPageCanvasStyles';
import { getSummaryTrailerCounts } from './summaryAddTrailer';
import styles from './EditPageCanvas.module.css';

/**
 * Editor canvas. Renders the dashboard's configured tiles via the same
 * `AnalyticsConfigurableComponent` primitive predefined pages use, with inline
 * "+ Add" affordances and dashed empty skeletons that share geometry with the
 * configured tiles so the canvas never reflows when a tile lands.
 *
 * Dashboard controls are page-level only; per-tile overrides live in the tile
 * config (Phase D), never as their own control bar.
 */
type EditPageCanvasProps = {
  readonly config: CustomDashboardConfig;
  readonly onConfigChange: (nextConfig: CustomDashboardConfig) => void;
  readonly onAddSummaryCard: () => void;
  readonly onAddChart: () => void;
  readonly onEditSummaryCard: (tileId: TileId) => void;
  readonly onEditChart: (tileId: TileId) => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
};

type ActiveResizeHandle = {
  readonly itemId: TileId;
  readonly side: RowResizeSide;
};

type ActiveResizePreviewBounds = {
  readonly widthPx: number;
  readonly rowWidthPx: number;
  readonly minWidthPx: number;
};

const RESIZE_THRESHOLD_PX = 80;
const RESIZE_DOWN_TRIGGER_TARGET_MULTIPLIER = 1.3;
const RESIZE_UP_TRIGGER_TARGET_RATIO = 0.7;
const RESIZE_PREVIEW_ANCHOR_BLEND_RANGE_PX = 48;
const POINTER_DRAG_ACTIVATION_DISTANCE_PX = 6;
const MULTI_TILE_RESIZE_MIN_WIDTH_RATIO = 0.35;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

const parseCssLengthPx = (rawValue: string | null | undefined): number => {
  if (!rawValue) {
    return 0;
  }
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getRowGapPx = (rowContainerElement: Element | null | undefined): number => {
  if (!rowContainerElement || !(rowContainerElement instanceof HTMLElement)) {
    return 0;
  }
  const computedStyle = window.getComputedStyle(rowContainerElement);
  return parseCssLengthPx(computedStyle.columnGap || computedStyle.gap);
};

const getComputedGridColumnCount = (element: HTMLElement): number => {
  const rawGridTemplateColumns = window.getComputedStyle(element).gridTemplateColumns;
  if (!rawGridTemplateColumns || rawGridTemplateColumns === 'none') {
    return 0;
  }
  const columns = rawGridTemplateColumns.match(/(?:^|\s)\d+(?:\.\d+)?px/g);
  return columns?.length ?? 0;
};

const getFallbackSummaryRowColumnCapacity = (element: HTMLElement): number => {
  const rowWidthPx = element.getBoundingClientRect().width;
  if (rowWidthPx <= 0) {
    return 0;
  }
  return Math.max(
    1,
    Math.floor(
      (rowWidthPx + SUMMARY_ROW_GAP_PX) / (SUMMARY_TILE_MIN_WIDTH_PX + SUMMARY_ROW_GAP_PX),
    ),
  );
};

function useSummaryRowColumnCapacity(): {
  readonly ref: (element: HTMLElement | null) => void;
  readonly columnCapacity: number;
} {
  const rowRef = useRef<HTMLElement | null>(null);
  const [columnCapacity, setColumnCapacity] = useState(0);

  const measure = useCallback(() => {
    const element = rowRef.current;
    if (!element) {
      setColumnCapacity(0);
      return;
    }
    const nextCapacity =
      getComputedGridColumnCount(element) || getFallbackSummaryRowColumnCapacity(element);
    setColumnCapacity((current) => (current === nextCapacity ? current : nextCapacity));
  }, []);

  const ref = useCallback(
    (element: HTMLElement | null) => {
      rowRef.current = element;
      measure();
    },
    [measure],
  );

  useLayoutEffect(() => {
    const element = rowRef.current;
    if (!element) {
      return () => {};
    }
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return () => {};
    }
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [measure]);

  return { ref, columnCapacity };
}

function useStableChartContext(chartContext: RAQIV2ChartContext): RAQIV2ChartContext {
  const fingerprint = chartContextFingerprint(chartContext);
  const [stableChartContext, setStableChartContext] = useState<{
    readonly fingerprint: string;
    readonly chartContext: RAQIV2ChartContext;
  }>(() => ({ fingerprint, chartContext }));
  if (stableChartContext.fingerprint !== fingerprint) {
    setStableChartContext({ fingerprint, chartContext });
  }
  return stableChartContext.chartContext;
}

function useLatestRef<T>(value: T): { current: T } {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

const getCalculatedRowItemMinWidthPx = (
  rowWidthPx: number,
  rowItemCount: number,
  rowGapPx: number,
): number => {
  if (rowItemCount <= 1) {
    return rowWidthPx;
  }
  const totalGapPx = rowGapPx * (rowItemCount - 1);
  return (rowWidthPx - totalGapPx) / rowItemCount;
};

const getProjectedResizeWidthPx = (
  activeResizeHandle: ActiveResizeHandle,
  deltaX: number,
  previewBounds: ActiveResizePreviewBounds,
): number => {
  const signedDeltaX = activeResizeHandle.side === 'right' ? deltaX : -deltaX;
  const clampedMinWidthPx = Math.min(previewBounds.minWidthPx, previewBounds.rowWidthPx);
  return clamp(previewBounds.widthPx + signedDeltaX, clampedMinWidthPx, previewBounds.rowWidthPx);
};

const isDragDataRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getActiveResizeHandle = (event: DragStartEvent): ActiveResizeHandle | null => {
  const data = event.active.data.current;
  if (!isDragDataRecord(data) || data.kind !== 'chart-resize-handle') {
    return null;
  }
  const itemId = data.itemId;
  if (typeof itemId !== 'string') {
    return null;
  }
  const side = data.side;
  if (side !== 'left' && side !== 'right') {
    return null;
  }
  return { itemId, side };
};

const DISABLED_CHART_ADD_PLACEHOLDER_DROPPABLE_ID = 'chart-add-placeholder-disabled';

const getRowDragPreviewTarget = (
  overId: TileId | null,
  activeId: TileId | null,
): RowDragPreviewTarget | null => {
  if (!overId || overId === activeId) {
    return null;
  }
  const emptySlotTarget = getEmptyChartSlotTarget(overId);
  return emptySlotTarget
    ? { type: 'empty-slot', rowIndex: emptySlotTarget.rowIndex }
    : { type: 'tile', tileId: overId };
};

const focusCanvasTile = (root: HTMLElement | null, tileId: TileId): boolean => {
  const tileElement = Array.from(
    root?.querySelectorAll<HTMLElement>('[data-custom-dashboard-tile-id]') ?? [],
  ).find((element) => element.dataset.customDashboardTileId === tileId);
  tileElement?.focus();
  return !!tileElement;
};

const blurFocusedCanvasTile = (root: HTMLElement | null): void => {
  const activeElement = root?.ownerDocument.activeElement;
  if (
    activeElement instanceof HTMLElement &&
    root?.contains(activeElement) &&
    activeElement.closest('[data-custom-dashboard-tile-id]')
  ) {
    activeElement.blur();
  }
};

type CanvasSelectionStore = {
  getSnapshot(): SelectedCanvasTile | null;
  subscribe(listener: () => void): () => void;
  setSelectedTile(tile: SelectedCanvasTile | null): void;
};

function createCanvasSelectionStore(): CanvasSelectionStore {
  let selectedTile: SelectedCanvasTile | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => selectedTile,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setSelectedTile(tile) {
      if (isSameSelectedCanvasTile(selectedTile, tile)) {
        return;
      }
      selectedTile = tile;
      listeners.forEach((listener) => listener());
    },
  };
}

const CanvasSelectionStoreContext = createContext<CanvasSelectionStore | null>(null);

function useCanvasTileIsSelected(tile: SelectedCanvasTile): boolean {
  const store = useContext(CanvasSelectionStoreContext);
  if (!store) {
    throw new Error('CanvasSelectionStoreContext is missing');
  }
  return useSyncExternalStore(
    store.subscribe,
    () => isSameSelectedCanvasTile(store.getSnapshot(), tile),
    () => false,
  );
}

const getResizeActionForDrag = (
  rows: ReadonlyArray<CustomDashboardChartRow>,
  activeResizeHandle: ActiveResizeHandle,
  deltaX: number,
  previewBounds: ActiveResizePreviewBounds | null,
): RowResizeAction | null => {
  const targetAction = getRowResizeAction(rows, activeResizeHandle.itemId, activeResizeHandle.side);
  if (!targetAction) {
    return null;
  }
  if (!previewBounds) {
    const didPassFallbackThreshold =
      targetAction.type === 'full-width-to-half-width'
        ? deltaX <= -RESIZE_THRESHOLD_PX
        : activeResizeHandle.side === 'right'
          ? deltaX >= RESIZE_THRESHOLD_PX
          : deltaX <= -RESIZE_THRESHOLD_PX;
    return didPassFallbackThreshold ? targetAction : null;
  }
  const projectedWidthPx = getProjectedResizeWidthPx(activeResizeHandle, deltaX, previewBounds);
  if (targetAction.type === 'full-width-to-half-width') {
    const targetWidthPx = Math.min(previewBounds.minWidthPx, previewBounds.rowWidthPx);
    return projectedWidthPx <= targetWidthPx * RESIZE_DOWN_TRIGGER_TARGET_MULTIPLIER
      ? targetAction
      : null;
  }
  return projectedWidthPx >= previewBounds.rowWidthPx * RESIZE_UP_TRIGGER_TARGET_RATIO
    ? targetAction
    : null;
};

const SummaryCardAddPlaceholder: FC<{
  readonly label: string;
  readonly onClick: () => void;
}> = ({ label, onClick }) => (
  <button
    type='button'
    aria-label={label}
    onClick={onClick}
    className='flex flex-col items-start content-default outline-none focus-visible:outline-focus'
    style={summaryAddPlaceholderStyle}>
    <span className='text-body-large'>{label}</span>
    <span
      aria-hidden='true'
      className='bg-action-standard content-action-standard'
      style={summaryAddPlaceholderIconStyle}>
      <Icon name='icon-filled-plus-large' size='Medium' />
    </span>
  </button>
);

const SummaryCardSkeleton: FC = () => <div aria-hidden='true' style={summarySkeletonStyle} />;

type SummaryAddTrailerProps = {
  readonly configuredCount: number;
  readonly columnCapacity: number;
  readonly onAddPlaceholder: () => void;
  readonly addPlaceholderLabel: string;
};

/** Inline placeholder + skeleton trailer for the summary row. */
const SummaryAddTrailer: FC<SummaryAddTrailerProps> = ({
  configuredCount,
  columnCapacity,
  onAddPlaceholder,
  addPlaceholderLabel,
}) => {
  const { addPlaceholderAllowed, skeletonCount } = getSummaryTrailerCounts(
    configuredCount,
    columnCapacity,
  );

  if (!addPlaceholderAllowed && skeletonCount === 0) {
    return null;
  }

  return (
    <>
      {addPlaceholderAllowed ? (
        <SummaryCardAddPlaceholder label={addPlaceholderLabel} onClick={onAddPlaceholder} />
      ) : null}
      {Array.from({ length: skeletonCount }, (_, idx) => (
        <SummaryCardSkeleton key={`summary-skeleton-${idx}`} />
      ))}
    </>
  );
};

const DroppableChartSkeleton: FC<{
  readonly id: string;
  readonly isActiveDropTarget: boolean;
  readonly layoutStyle?: CSSProperties;
}> = ({ id, isActiveDropTarget, layoutStyle }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      kind: 'chart-empty-slot',
    },
  });
  return (
    <div
      ref={setNodeRef}
      aria-hidden='true'
      className={`${styles.chartSkeleton} ${
        isActiveDropTarget ? styles.chartSkeletonActiveDrop : ''
      }`}
      style={layoutStyle}
    />
  );
};

const ChartSkeleton: FC<{ readonly layoutStyle?: CSSProperties }> = ({ layoutStyle }) => (
  <div aria-hidden='true' className={styles.chartSkeleton} style={layoutStyle} />
);

type ChartAddPlaceholderCardProps = {
  readonly onAddPlaceholder: () => void;
  readonly illustrationLabel: string;
  readonly addChartHeadline: string;
  readonly addChartDescription: string;
  readonly addChartLearnMoreLabel: string;
  readonly addChartButtonLabel: string;
  readonly droppableId?: string;
  readonly isActiveDropTarget?: boolean;
  readonly layoutStyle?: CSSProperties;
};

const ChartAddPlaceholderCard: FC<ChartAddPlaceholderCardProps> = ({
  onAddPlaceholder,
  addChartHeadline,
  addChartDescription,
  addChartLearnMoreLabel,
  addChartButtonLabel,
  droppableId,
  isActiveDropTarget = false,
  layoutStyle,
}) => {
  const headlineId = useId();
  const descriptionId = useId();
  const { setNodeRef } = useDroppable({
    id: droppableId ?? DISABLED_CHART_ADD_PLACEHOLDER_DROPPABLE_ID,
    disabled: !droppableId,
    data: {
      kind: 'chart-empty-slot',
    },
  });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headlineId}
      aria-describedby={descriptionId}
      className={`flex flex-col items-center justify-center text-align-x-center width-full ${
        isActiveDropTarget ? styles.chartSkeletonActiveDrop : ''
      }`}
      style={{ ...chartAddPlaceholderCardStyle, ...layoutStyle }}>
      <DashboardsEmptyStateIllustration sizePx={115} />
      <div
        className='flex flex-col items-center text-align-x-center'
        style={chartAddPlaceholderActionsStyle}>
        <div
          className='flex flex-col items-center text-align-x-center'
          style={chartAddPlaceholderCopyStyle}>
          <span id={headlineId} className='text-label-large content-emphasis'>
            {addChartHeadline}
          </span>
          <span id={descriptionId} className='text-body-medium content-muted'>
            {addChartDescription}{' '}
            <Link
              href={CUSTOM_DASHBOARDS_LEARN_MORE_HREF}
              target='_blank'
              rel='noreferrer'
              size='Medium'>
              {addChartLearnMoreLabel}
            </Link>
          </span>
        </div>
        <Button
          type='button'
          variant='Standard'
          size='Medium'
          aria-describedby={descriptionId}
          onClick={onAddPlaceholder}>
          {addChartButtonLabel}
        </Button>
      </div>
    </section>
  );
};

const ChartAddRowAffordance: FC<ChartAddPlaceholderCardProps> = ({
  onAddPlaceholder,
  illustrationLabel,
  addChartHeadline,
  addChartDescription,
  addChartLearnMoreLabel,
  addChartButtonLabel,
}) => (
  <>
    <ChartAddPlaceholderCard
      onAddPlaceholder={onAddPlaceholder}
      illustrationLabel={illustrationLabel}
      addChartHeadline={addChartHeadline}
      addChartDescription={addChartDescription}
      addChartLearnMoreLabel={addChartLearnMoreLabel}
      addChartButtonLabel={addChartButtonLabel}
      layoutStyle={chartHalfWidthCellStyle}
    />
    <ChartSkeleton layoutStyle={chartHalfWidthCellStyle} />
  </>
);

type ChartCanvasEmptyStateProps = ChartAddPlaceholderCardProps & {
  readonly sectionLabel: string;
};

const buildRowGridStyle = (cellCount: number): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cellCount}, minmax(0, 1fr))`,
  gap: CHART_COLUMN_GAP_PX,
  width: '100%',
});

/**
 * Half-width chart-add placeholder with an empty visual slot, matching the
 * first persisted chart row that will be created from it.
 */
const ChartCanvasEmptyState: FC<ChartCanvasEmptyStateProps> = ({
  onAddPlaceholder,
  illustrationLabel,
  addChartHeadline,
  addChartDescription,
  addChartLearnMoreLabel,
  addChartButtonLabel,
  sectionLabel,
}) => (
  <section aria-label={sectionLabel} className='width-full' style={buildRowGridStyle(2)}>
    <ChartAddPlaceholderCard
      onAddPlaceholder={onAddPlaceholder}
      illustrationLabel={illustrationLabel}
      addChartHeadline={addChartHeadline}
      addChartDescription={addChartDescription}
      addChartLearnMoreLabel={addChartLearnMoreLabel}
      addChartButtonLabel={addChartButtonLabel}
    />
    <ChartSkeleton />
  </section>
);

/**
 * Editor tile chrome.
 *
 * `variant === 'summary'` is installed into GenericSummaryCard's title row via
 * `SummaryCardHeaderActionsProvider` (compact XSmall buttons).
 * `variant === 'inline'` is the payload supplied to `ChartActionsProvider` for
 * chart tiles, so the surrounding `SingleChartCardContainer` slots us into its
 * existing top-right action area - same chrome the predefined surface uses,
 * just with editor contents.
 */
const TileEditMenu: FC<{
  readonly ariaLabel: string;
  readonly editLabel: string;
  readonly duplicateLabel: string;
  readonly removeLabel: string;
  readonly isDuplicateDisabled: boolean;
  readonly onEdit: () => void;
  readonly onDuplicate: () => void;
  readonly onRemove: () => void;
  readonly variant?: 'inline' | 'summary';
}> = ({
  ariaLabel,
  editLabel,
  duplicateLabel,
  removeLabel,
  isDuplicateDisabled,
  onEdit,
  onDuplicate,
  onRemove,
  variant = 'inline',
}) => {
  const [open, setOpen] = useState(false);
  const isSummaryVariant = variant === 'summary';

  const wrap = useCallback(
    (handler: () => void) => (): void => {
      handler();
      setOpen(false);
    },
    [],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- event boundary prevents chart-card drag/select handlers from stealing nested action button clicks
    <div
      data-custom-dashboard-tile-actions='true'
      onPointerDown={stopTileActionEventPropagation}
      onMouseDown={stopTileActionEventPropagation}
      onClick={stopTileActionEventPropagation}
      onKeyDown={stopTileActionEventPropagation}
      style={isSummaryVariant ? summaryTileChromeStyle : inlineTileChromeStyle}>
      <IconButton
        type='button'
        variant='Utility'
        size={isSummaryVariant ? 'XSmall' : 'Small'}
        isCircular={false}
        ariaLabel={editLabel}
        icon='icon-regular-pencil'
        onClick={() => onEdit()}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <IconButton
            type='button'
            variant='Utility'
            size={isSummaryVariant ? 'XSmall' : 'Small'}
            isCircular={false}
            ariaLabel={ariaLabel}
            icon='icon-regular-three-dots-vertical'
          />
        </PopoverTrigger>
        <PopoverContent ariaLabel={ariaLabel} align='end'>
          <Menu size='Medium'>
            <MenuItem
              value='duplicate'
              title={duplicateLabel}
              disabled={isDuplicateDisabled}
              onSelect={wrap(onDuplicate)}
            />
            <MenuItem
              value='remove'
              title={removeLabel}
              onSelect={wrap(onRemove)}
              className='content-system-alert'
            />
          </Menu>
        </PopoverContent>
      </Popover>
    </div>
  );
};

type SummaryCardMountProps = {
  readonly entry: SynthesizedSummaryEntry;
  readonly chartContext: ReturnType<
    typeof useRAQIV2PredefinedSurfaceControlsBundle
  >['chartContext'];
  readonly controlOverrides: DashboardControlOverrideState;
  readonly isSelected: boolean;
  readonly overflowMenuLabel: string;
  readonly selectLabel: string;
  readonly editLabel: string;
  readonly duplicateLabel: string;
  readonly removeLabel: string;
  readonly isDuplicateDisabled: boolean;
  readonly onSelect: (tileId: TileId) => void;
  readonly onEdit: (tileId: TileId) => void;
  readonly onDuplicate: (tileId: TileId) => void;
  readonly onRemove: (tileId: TileId) => void;
};

const SummaryCardMountInner: FC<SummaryCardMountProps> = ({
  entry,
  chartContext,
  controlOverrides,
  isSelected,
  overflowMenuLabel,
  selectLabel,
  editLabel,
  duplicateLabel,
  removeLabel,
  isDuplicateDisabled,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
}) => {
  const issues = getDashboardControlIssuesForComponent(
    entry.component,
    chartContext,
    controlOverrides,
  );
  const headerActions = useMemo(
    () => (
      <TileEditMenu
        ariaLabel={overflowMenuLabel}
        editLabel={editLabel}
        duplicateLabel={duplicateLabel}
        removeLabel={removeLabel}
        isDuplicateDisabled={isDuplicateDisabled}
        onEdit={() => onEdit(entry.tileId)}
        onDuplicate={() => onDuplicate(entry.tileId)}
        onRemove={() => onRemove(entry.tileId)}
        variant='summary'
      />
    ),
    [
      overflowMenuLabel,
      editLabel,
      duplicateLabel,
      removeLabel,
      isDuplicateDisabled,
      onEdit,
      onDuplicate,
      onRemove,
      entry.tileId,
    ],
  );
  const onSelectionKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(entry.tileId);
      return;
    }
    if (isSelected && isSummaryCardDeleteKey(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      onRemove(entry.tileId);
    }
  };

  return (
    <div
      className={`${styles.summaryTileMount} ${isSelected ? styles.summaryTileMountSelected : ''}`}
      style={{ ...summaryTileConfiguredSizeStyle, ...tileChromeHostStyle }}
      data-custom-dashboard-tile-id={entry.tileId}
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- summary cards render nested action buttons in the title row
      role='button'
      tabIndex={0}
      aria-label={selectLabel}
      onClick={() => onSelect(entry.tileId)}
      onFocus={(event) => {
        if (!isTileActionsTarget(event.target)) {
          onSelect(entry.tileId);
        }
      }}
      onKeyDown={onSelectionKeyDown}>
      {issues.length > 0 ? (
        <>
          <DashboardTileControlError />
          {/* Unavailable path skips GenericSummaryCard, so overlay chrome instead. */}
          <div style={summaryTileErrorChromeStyle}>{headerActions}</div>
        </>
      ) : (
        <SummaryCardHeaderActionsProvider value={headerActions}>
          <div className={styles.summaryTileSelectionTarget}>
            <AnalyticsConfigurableComponent
              component={entry.component}
              chartContext={chartContext}
              onSelectChartRegion={null}
              chartUpdatePolicy='non-animated'
              layout={RAQIV2SpecialLayoutType.FullWidthLayout}
            />
          </div>
        </SummaryCardHeaderActionsProvider>
      )}
    </div>
  );
};

const SummaryCardMount = memo(SummaryCardMountInner);

const SelectableSummaryCardMount: FC<Omit<SummaryCardMountProps, 'isSelected'>> = (props) => {
  const isSelected = useCanvasTileIsSelected({
    type: 'SummaryCard',
    tileId: props.entry.tileId,
  });
  return <SummaryCardMount {...props} isSelected={isSelected} />;
};

type ChartTileMountProps = {
  readonly entry: SynthesizedChartEntry;
  readonly title?: string;
  readonly chartContext: ReturnType<
    typeof useRAQIV2PredefinedSurfaceControlsBundle
  >['chartContext'];
  readonly layoutStyle?: CSSProperties;
  readonly isSelected: boolean;
  readonly isActiveDragTile: boolean;
  readonly overflowMenuLabel: string;
  readonly selectLabel: string;
  readonly editLabel: string;
  readonly duplicateLabel: string;
  readonly removeLabel: string;
  readonly isDuplicateDisabled: boolean;
  readonly onSelect: (tileId: TileId) => void;
  readonly onEdit: (tileId: TileId) => void;
  readonly onDuplicate: (tileId: TileId) => void;
  readonly onRemove: (tileId: TileId) => void;
};

const ChartTileMountInner: FC<ChartTileMountProps> = ({
  entry,
  title,
  chartContext,
  layoutStyle,
  isSelected,
  isActiveDragTile,
  overflowMenuLabel,
  selectLabel,
  editLabel,
  duplicateLabel,
  removeLabel,
  isDuplicateDisabled,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
}) => {
  const tileActions = useMemo<ChartActionsPolicy>(
    () => ({
      actions: [
        {
          id: 'custom-dashboard-tile-actions',
          kind: 'custom',
          label: overflowMenuLabel,
          render: () => (
            <TileEditMenu
              ariaLabel={overflowMenuLabel}
              editLabel={editLabel}
              duplicateLabel={duplicateLabel}
              removeLabel={removeLabel}
              isDuplicateDisabled={isDuplicateDisabled}
              onEdit={() => onEdit(entry.tileId)}
              onDuplicate={() => onDuplicate(entry.tileId)}
              onRemove={() => onRemove(entry.tileId)}
            />
          ),
        },
      ],
    }),
    [
      overflowMenuLabel,
      editLabel,
      duplicateLabel,
      removeLabel,
      isDuplicateDisabled,
      onEdit,
      onDuplicate,
      onRemove,
      entry.tileId,
    ],
  );
  const trimmedTitle = title?.trim();
  const isTableTile = entry.component.type === AnalyticsComponentType.Table;
  const tableTileChrome = (
    <div className={styles.chartTableChrome}>
      <TileEditMenu
        ariaLabel={overflowMenuLabel}
        editLabel={editLabel}
        duplicateLabel={duplicateLabel}
        removeLabel={removeLabel}
        isDuplicateDisabled={isDuplicateDisabled}
        onEdit={() => onEdit(entry.tileId)}
        onDuplicate={() => onDuplicate(entry.tileId)}
        onRemove={() => onRemove(entry.tileId)}
      />
    </div>
  );
  // Always mount the chart so card chrome stays and Figma empty states flow
  // through genericChartStateToChartAbnormalState (no alert-card short-circuit).
  const tileContent = isTableTile ? (
    // Tables collapse under chart-card Grid/height CSS — mount bare like
    // DashboardLayoutBody / Add Chart preview. Tile height follows paginated
    // content so rows navigate via paging instead of an inner scrollbar.
    <div className={styles.chartTableFrame} data-testid='custom-dashboard-chart-table-frame'>
      <AnalyticsComponent
        config={entry.component}
        chartContext={chartContext}
        onSelectChartRegion={null}
        chartUpdatePolicy='non-animated'
      />
    </div>
  ) : (
    <AnalyticsConfigurableComponent
      component={entry.component}
      chartContext={chartContext}
      onSelectChartRegion={null}
      chartUpdatePolicy='non-animated'
      layout={RAQIV2SpecialLayoutType.FullWidthLayout}
    />
  );

  return (
    <ChartActionsProvider value={tileActions}>
      <div
        className={`${styles.chartTileMount} ${isSelected ? styles.chartTileMountSelected : ''}`}
        data-custom-dashboard-tile-id={entry.tileId}
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- chart cards already render nested action buttons, so the selectable wrapper cannot be a native button
        role='button'
        tabIndex={0}
        aria-label={selectLabel}
        onClick={() => onSelect(entry.tileId)}
        onFocus={(event) => {
          if (!isTileActionsTarget(event.target)) {
            onSelect(entry.tileId);
          }
        }}
        onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(entry.tileId);
          }
        }}
        style={{
          ...(isTableTile ? chartTableTileMountStyle : chartTileMountStyle),
          ...layoutStyle,
        }}>
        {isTableTile ? tableTileChrome : null}
        {tileContent}
        {isActiveDragTile ? (
          <div className={styles.chartActiveDragPlaceholder} aria-hidden='true'>
            {trimmedTitle ? <span className={styles.chartPreviewTitle}>{trimmedTitle}</span> : null}
            <div className={styles.chartPreviewSkeletonStack}>
              <div className={styles.chartPreviewSkeletonHeader} />
              <div className={styles.chartPreviewSkeletonBody} />
              <div className={styles.chartPreviewSkeletonFooter} />
            </div>
          </div>
        ) : null}
      </div>
    </ChartActionsProvider>
  );
};

const ChartTileMount = memo(ChartTileMountInner);

const SelectableChartTileMount: FC<Omit<ChartTileMountProps, 'isSelected'>> = (props) => {
  const isSelected = useCanvasTileIsSelected({
    type: 'Chart',
    tileId: props.entry.tileId,
  });
  return <ChartTileMount {...props} isSelected={isSelected} />;
};

const ChartTilePreviewProxy: FC<{
  readonly tile: CustomDashboardChartRow['tiles'][number];
}> = ({ tile }) => {
  const title = tile.title?.trim();
  return (
    <div className={styles.chartPreviewTile} aria-hidden='true'>
      {title ? <span className={styles.chartPreviewTitle}>{title}</span> : null}
      <div className={styles.chartPreviewSkeletonStack}>
        <div className={styles.chartPreviewSkeletonHeader} />
        <div className={styles.chartPreviewSkeletonBody} />
        <div className={styles.chartPreviewSkeletonFooter} />
      </div>
    </div>
  );
};

const ChartDragPreviewOverlay: FC<{
  readonly rows: ReadonlyArray<CustomDashboardChartRow>;
  readonly activeTileId: TileId;
}> = ({ rows, activeTileId }) => (
  <div className={styles.chartDragPreviewOverlay} aria-hidden='true'>
    {rows.map((row, rowIndex) => {
      const tiles = getChartRowTiles(row);
      const columnCount = getChartRowColumnCount(row);
      const placeholders = Math.max(
        columnCount - tiles.length,
        tiles.length === 0 ? columnCount : 0,
      );
      return (
        <div
          // eslint-disable-next-line react/no-array-index-key -- overlay rows are render-only preview geometry
          key={`chart-drag-preview-row-${rowIndex}`}
          data-raqi-layout='preview-row'
          className={
            columnCount === 1 ? styles.chartPreviewRowSingleColumn : styles.chartPreviewRowTwoColumn
          }>
          {tiles.map((tile) =>
            tile.tileId === activeTileId ? (
              <ChartTilePreviewProxy key={tile.tileId} tile={tile} />
            ) : (
              <div key={tile.tileId} className={styles.chartPreviewSpacer} />
            ),
          )}
          {Array.from({ length: placeholders }, (_, placeholderIndex) => (
            <div
              key={`chart-drag-preview-spacer-${placeholderIndex}`}
              className={styles.chartPreviewSpacer}
            />
          ))}
        </div>
      );
    })}
  </div>
);

type DashboardCanvasBodyProps = {
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
  readonly summaries: ReadonlyArray<SynthesizedSummaryEntry>;
  readonly chartRows: ReadonlyArray<ReadonlyArray<SynthesizedChartEntry>>;
  readonly chartPlacements: ReadonlyArray<ChartPlacement>;
  readonly chartDragPreviewRows: ReadonlyArray<CustomDashboardChartRow> | null;
  readonly activeChartDragId: TileId | null;
  readonly summaryCardCount: number;
  readonly activeEmptySlotId: string | null;
  readonly onAddSummaryCard: () => void;
  readonly onAddChart: () => void;
  readonly onSelectSummaryCard: (tileId: TileId) => void;
  readonly onSelectChart: (tileId: TileId) => void;
  readonly onEditSummaryCard: (tileId: TileId) => void;
  readonly onEditChart: (tileId: TileId) => void;
  readonly onDuplicateSummaryCard: (tileId: TileId) => void;
  readonly onDuplicateChart: (tileId: TileId) => void;
  readonly onRemoveSummaryCard: (tileId: TileId) => void;
  readonly onRemoveChart: (tileId: TileId) => void;
};

const DashboardCanvasBodyInner: FC<DashboardCanvasBodyProps> = ({
  pageConfig,
  summaries,
  chartRows,
  chartPlacements,
  chartDragPreviewRows,
  activeChartDragId,
  summaryCardCount,
  activeEmptySlotId,
  onAddSummaryCard,
  onAddChart,
  onSelectSummaryCard,
  onSelectChart,
  onEditSummaryCard,
  onEditChart,
  onDuplicateSummaryCard,
  onDuplicateChart,
  onRemoveSummaryCard,
  onRemoveChart,
}) => {
  const t = useEditPageTranslations();
  const { chartContext: rawChartContext } = useRAQIV2PredefinedSurfaceControlsBundle(pageConfig);
  const chartContext = useStableChartContext(rawChartContext);
  const controlOverrides = useMemo(
    () => getDashboardControlOverrideState(pageConfig, chartContext),
    [pageConfig, chartContext],
  );
  const chartEntriesByTileId = useMemo(
    () => new Map(chartRows.flat().map((entry) => [entry.tileId, entry])),
    [chartRows],
  );

  const hasCharts = chartPlacements.some((placement) => placement.kind === 'tile');
  const hasAddPlaceholderPlacement = chartPlacements.some(
    (placement) => placement.kind === 'empty-slot' && placement.isAddPlaceholderSlot,
  );
  const canAddSummaryCard = summaryCardCount < MAX_SUMMARY_CARDS_PER_DASHBOARD;
  const canDuplicateChart = chartRows.flat().length < MAX_CHART_TILES_PER_DASHBOARD;
  const { ref: summaryRowRef, columnCapacity: summaryRowColumnCapacity } =
    useSummaryRowColumnCapacity();
  const handleAddSummaryCard = useCallback(() => {
    if (canAddSummaryCard) {
      onAddSummaryCard();
    }
  }, [canAddSummaryCard, onAddSummaryCard]);

  return (
    <div className='flex flex-col items-start width-full gap-xxlarge'>
      <section
        ref={summaryRowRef}
        aria-label={t.summaryRowLabel}
        className='width-full'
        style={summaryRowStyle}>
        {summaries.map((entry) => (
          <SelectableSummaryCardMount
            key={entry.tileId}
            entry={entry}
            chartContext={chartContext}
            controlOverrides={controlOverrides}
            overflowMenuLabel={t.tileOverflowMenuLabel}
            selectLabel={t.summaryCardSelectLabel}
            editLabel={t.tileMenuEdit}
            duplicateLabel={t.tileMenuDuplicate}
            removeLabel={t.tileMenuRemove}
            isDuplicateDisabled={!canAddSummaryCard}
            onSelect={onSelectSummaryCard}
            onEdit={onEditSummaryCard}
            onDuplicate={onDuplicateSummaryCard}
            onRemove={onRemoveSummaryCard}
          />
        ))}
        <SummaryAddTrailer
          configuredCount={summaryCardCount}
          columnCapacity={summaryRowColumnCapacity}
          onAddPlaceholder={handleAddSummaryCard}
          addPlaceholderLabel={t.addSummaryCardPlaceholderLabel}
        />
      </section>
      {hasCharts ? (
        <section
          aria-label={t.chartCanvasLabel}
          data-raqi-layout='row'
          className={`${styles.chartCanvasSection} width-full`}
          style={chartCanvasGridStyle}>
          {chartPlacements.map((placement) => {
            if (placement.kind === 'empty-slot') {
              return placement.isAddPlaceholderSlot ? (
                <ChartAddPlaceholderCard
                  key={placement.emptySlotId}
                  onAddPlaceholder={onAddChart}
                  illustrationLabel={t.canvasIllustrationLabel}
                  addChartHeadline={t.addChartPlaceholderHeadline}
                  addChartDescription={t.addChartPlaceholderDescription}
                  addChartLearnMoreLabel={t.addChartPlaceholderLearnMoreLabel}
                  addChartButtonLabel={t.addChartPlaceholderButtonLabel}
                  droppableId={placement.emptySlotId}
                  isActiveDropTarget={activeEmptySlotId === placement.emptySlotId}
                  layoutStyle={chartHalfWidthCellStyle}
                />
              ) : (
                <DroppableChartSkeleton
                  key={placement.emptySlotId}
                  id={placement.emptySlotId}
                  isActiveDropTarget={activeEmptySlotId === placement.emptySlotId}
                  layoutStyle={chartHalfWidthCellStyle}
                />
              );
            }

            const entry = chartEntriesByTileId.get(placement.tileId);
            const tileLayoutStyle =
              placement.columnSpan === 2 ? chartFullWidthCellStyle : chartHalfWidthCellStyle;
            if (!entry) {
              // Placement exists but the tile failed to synthesize: render an
              // error placeholder instead of a silent empty grid cell (Finding #2).
              return (
                <div key={placement.tileId} style={{ ...chartTileMountStyle, ...tileLayoutStyle }}>
                  <DashboardTileRenderError />
                </div>
              );
            }
            return (
              <SelectableChartTileMount
                key={placement.tileId}
                entry={entry}
                title={placement.tile.title}
                chartContext={chartContext}
                layoutStyle={tileLayoutStyle}
                isActiveDragTile={placement.tileId === activeChartDragId}
                overflowMenuLabel={t.tileOverflowMenuLabel}
                selectLabel={t.chartTileSelectLabel}
                editLabel={t.tileMenuEdit}
                duplicateLabel={t.tileMenuDuplicate}
                removeLabel={t.tileMenuRemove}
                isDuplicateDisabled={!canDuplicateChart}
                onSelect={onSelectChart}
                onEdit={onEditChart}
                onDuplicate={onDuplicateChart}
                onRemove={onRemoveChart}
              />
            );
          })}
          {hasAddPlaceholderPlacement ? null : (
            <ChartAddRowAffordance
              onAddPlaceholder={onAddChart}
              illustrationLabel={t.canvasIllustrationLabel}
              addChartHeadline={t.addChartPlaceholderHeadline}
              addChartDescription={t.addChartPlaceholderDescription}
              addChartLearnMoreLabel={t.addChartPlaceholderLearnMoreLabel}
              addChartButtonLabel={t.addChartPlaceholderButtonLabel}
            />
          )}
          {chartDragPreviewRows && activeChartDragId ? (
            <ChartDragPreviewOverlay rows={chartDragPreviewRows} activeTileId={activeChartDragId} />
          ) : null}
        </section>
      ) : (
        <ChartCanvasEmptyState
          onAddPlaceholder={onAddChart}
          illustrationLabel={t.canvasIllustrationLabel}
          addChartHeadline={t.addChartPlaceholderHeadline}
          addChartDescription={t.addChartPlaceholderDescription}
          addChartLearnMoreLabel={t.addChartPlaceholderLearnMoreLabel}
          addChartButtonLabel={t.addChartPlaceholderButtonLabel}
          sectionLabel={t.chartCanvasLabel}
        />
      )}
    </div>
  );
};

const DashboardCanvasBody = memo(DashboardCanvasBodyInner);

const EditPageCanvas: FC<EditPageCanvasProps> = ({
  config,
  onConfigChange,
  onAddSummaryCard,
  onAddChart,
  onEditSummaryCard,
  onEditChart,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const t = useEditPageTranslations();
  const canvasRef = useRef<HTMLElement | null>(null);
  const [activeId, setActiveId] = useState<TileId | null>(null);
  const [overId, setOverId] = useState<TileId | null>(null);
  const [activeResizeHandle, setActiveResizeHandle] = useState<ActiveResizeHandle | null>(null);
  const [activeResizeDeltaX, setActiveResizeDeltaX] = useState(0);
  const [activeResizePreviewBounds, setActiveResizePreviewBounds] =
    useState<ActiveResizePreviewBounds | null>(null);
  const [selectionStore] = useState(createCanvasSelectionStore);
  const [selectedTile, setSelectedTileState] = useState<SelectedCanvasTile | null>(null);
  const setSelectedTile = useCallback(
    (nextSelection: SetStateAction<SelectedCanvasTile | null>) => {
      setSelectedTileState((current) => {
        const next = typeof nextSelection === 'function' ? nextSelection(current) : nextSelection;
        selectionStore.setSelectedTile(next);
        return next;
      });
    },
    [selectionStore],
  );
  const [clipboardTile, setClipboardTile] = useState<CanvasClipboardTile | null>(null);
  const [pendingFocusTileId, setPendingFocusTileId] = useState<TileId | null>(null);
  const dashboardRenderModel = useMemo(() => selectDashboardCanvasModel(config), [config]);
  const summaryCards = useMemo(
    () => dashboardRenderModel.summaryPlacements.map((placement) => placement.tile),
    [dashboardRenderModel.summaryPlacements],
  );
  const chartRows = dashboardRenderModel.chartRows;
  const configRef = useLatestRef(config);
  const onConfigChangeRef = useLatestRef(onConfigChange);
  const summaryCardsRef = useLatestRef(summaryCards);
  const chartRowsRef = useLatestRef(chartRows);

  if (selectedTile && !getSelectedCanvasTile(config, selectedTile)) {
    setSelectedTile(null);
  }

  useLayoutEffect(() => {
    if (pendingFocusTileId && focusCanvasTile(canvasRef.current, pendingFocusTileId)) {
      setPendingFocusTileId(null);
    }
  }, [pendingFocusTileId]);

  const selectSummaryCard = useCallback(
    (tileId: TileId) => {
      setSelectedTile((current) => {
        const next = { type: 'SummaryCard', tileId } as const;
        return isSameSelectedCanvasTile(current, next) ? current : next;
      });
    },
    [setSelectedTile],
  );

  const selectChartTile = useCallback(
    (tileId: TileId) => {
      setSelectedTile((current) => {
        const next = { type: 'Chart', tileId } as const;
        return isSameSelectedCanvasTile(current, next) ? current : next;
      });
    },
    [setSelectedTile],
  );

  const clearCanvasSelection = useCallback(() => {
    setPendingFocusTileId(null);
    setSelectedTile(null);
    blurFocusedCanvasTile(canvasRef.current);
  }, [setSelectedTile]);

  const activeResizeAction = useMemo(
    () =>
      activeResizeHandle
        ? getResizeActionForDrag(
            chartRows,
            activeResizeHandle,
            activeResizeDeltaX,
            activeResizePreviewBounds,
          )
        : null,
    [activeResizeDeltaX, activeResizeHandle, activeResizePreviewBounds, chartRows],
  );

  const itemIds = useMemo(
    () => flattenRows(chartRows).map((tile: ChartTileConfig) => tile.tileId),
    [chartRows],
  );
  const canvasTileOrder = useMemo<ReadonlyArray<SelectedCanvasTile>>(
    () => [
      ...summaryCards.map((tile) => ({ type: 'SummaryCard' as const, tileId: tile.tileId })),
      ...itemIds.map((tileId) => ({ type: 'Chart' as const, tileId })),
    ],
    [itemIds, summaryCards],
  );

  const commitRows = useCallback(
    (nextRows: ReadonlyArray<CustomDashboardChartRow>) => {
      onConfigChangeRef.current(
        withChartRows(configRef.current, collapseAdjacentHalfWidthRows(nextRows)),
      );
    },
    [configRef, onConfigChangeRef],
  );

  const handleRemoveSummaryCard = useCallback(
    (tileId: TileId) => {
      setSelectedTile((current) =>
        current?.type === 'SummaryCard' && current.tileId === tileId ? null : current,
      );
      onConfigChangeRef.current(
        withSummaryCards(
          configRef.current,
          summaryCardsRef.current.filter((tile) => tile.tileId !== tileId),
        ),
      );
    },
    [configRef, onConfigChangeRef, setSelectedTile, summaryCardsRef],
  );

  const handleDuplicateSummaryCard = useCallback(
    (tileId: TileId) => {
      let nextTileId: TileId | null = null;
      const currentSummaryCards = summaryCardsRef.current;
      const nextSummaryCards = duplicateSummaryCard(currentSummaryCards, tileId, () => {
        nextTileId = createTileId();
        return nextTileId;
      });
      if (nextSummaryCards === currentSummaryCards) {
        return;
      }
      onConfigChangeRef.current(withSummaryCards(configRef.current, nextSummaryCards));
      if (nextTileId) {
        setSelectedTile({ type: 'SummaryCard', tileId: nextTileId });
        setPendingFocusTileId(nextTileId);
      }
    },
    [configRef, onConfigChangeRef, setSelectedTile, summaryCardsRef],
  );

  const handleRemoveChart = useCallback(
    (tileId: TileId) => {
      const currentRows = chartRowsRef.current;
      const nextRows = removeTile(currentRows, tileId);
      if (nextRows !== currentRows) {
        setSelectedTile((current) =>
          current?.type === 'Chart' && current.tileId === tileId ? null : current,
        );
        commitRows(nextRows);
      }
    },
    [chartRowsRef, commitRows, setSelectedTile],
  );

  const handleDuplicateChart = useCallback(
    (tileId: TileId) => {
      let nextTileId: TileId | null = null;
      const currentRows = chartRowsRef.current;
      const nextRows = duplicateChartTileInRows(currentRows, tileId, () => {
        nextTileId = createTileId();
        return nextTileId;
      });
      if (nextRows !== currentRows) {
        commitRows(nextRows);
        if (nextTileId) {
          setSelectedTile({ type: 'Chart', tileId: nextTileId });
          setPendingFocusTileId(nextTileId);
        }
      }
    },
    [chartRowsRef, commitRows, setSelectedTile],
  );

  const handleCopySelectedTile = useCallback(() => {
    const tile = getSelectedCanvasTile(config, selectedTile);
    if (tile) {
      setClipboardTile(tile);
    }
    return !!tile;
  }, [config, selectedTile]);

  const handlePasteClipboardTile = useCallback(() => {
    if (!clipboardTile) {
      return false;
    }
    let pastedTileId: TileId | null = null;
    const nextConfig = pasteCanvasTile(config, clipboardTile, selectedTile, () => {
      pastedTileId = createTileId();
      return pastedTileId;
    });
    if (nextConfig === config) {
      return false;
    }
    onConfigChangeRef.current(nextConfig);
    if (pastedTileId) {
      setSelectedTile({ type: clipboardTile.type, tileId: pastedTileId });
      setPendingFocusTileId(pastedTileId);
    }
    return true;
  }, [clipboardTile, config, onConfigChangeRef, selectedTile, setSelectedTile]);

  const handleRemoveSelectedTile = useCallback(() => {
    if (!selectedTile) {
      return false;
    }
    if (selectedTile.type === 'SummaryCard') {
      handleRemoveSummaryCard(selectedTile.tileId);
      return true;
    }
    handleRemoveChart(selectedTile.tileId);
    return true;
  }, [handleRemoveChart, handleRemoveSummaryCard, selectedTile]);

  const handleMoveSelection = useCallback(
    (delta: number) => {
      if (canvasTileOrder.length === 0) {
        return false;
      }
      const currentIndex = selectedTile
        ? canvasTileOrder.findIndex((tile) => isSameSelectedCanvasTile(tile, selectedTile))
        : -1;
      const fallbackIndex = delta > 0 ? 0 : canvasTileOrder.length - 1;
      const nextIndex =
        currentIndex < 0
          ? fallbackIndex
          : Math.max(0, Math.min(canvasTileOrder.length - 1, currentIndex + delta));
      const nextTile = canvasTileOrder[nextIndex];
      if (!nextTile || isSameSelectedCanvasTile(nextTile, selectedTile)) {
        return false;
      }
      setSelectedTile(nextTile);
      setPendingFocusTileId(nextTile.tileId);
      return true;
    },
    [canvasTileOrder, selectedTile, setSelectedTile],
  );

  const handlePageKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (shouldIgnorePageShortcut(event)) {
        return;
      }
      if (isUndoShortcut(event)) {
        if (canUndo) {
          onUndo();
          event.preventDefault();
        }
        return;
      }
      if (isRedoShortcut(event)) {
        if (canRedo) {
          onRedo();
          event.preventDefault();
        }
        return;
      }
      if (isCopyShortcut(event)) {
        if (handleCopySelectedTile()) {
          event.preventDefault();
        }
        return;
      }
      if (isPasteShortcut(event)) {
        if (handlePasteClipboardTile()) {
          event.preventDefault();
        }
        return;
      }
      if (event.key === 'Escape' && selectedTile) {
        clearCanvasSelection();
        event.preventDefault();
        return;
      }
      if (isSelectionMoveKey(event.key) && handleMoveSelection(getSelectionMoveDelta(event.key))) {
        event.preventDefault();
        return;
      }
      if (isSummaryCardDeleteKey(event.key) && handleRemoveSelectedTile()) {
        event.preventDefault();
      }
    },
    [
      clearCanvasSelection,
      canRedo,
      canUndo,
      handleCopySelectedTile,
      handleMoveSelection,
      handlePasteClipboardTile,
      handleRemoveSelectedTile,
      onRedo,
      onUndo,
      selectedTile,
    ],
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return () => {};
    }
    canvasElement.addEventListener('keydown', handlePageKeyDown);
    return () => canvasElement.removeEventListener('keydown', handlePageKeyDown);
  }, [handlePageKeyDown]);

  const handleCanvasMouseDownCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (isCanvasTileInteractionTarget(event.target)) {
        return;
      }
      if (selectedTile) {
        clearCanvasSelection();
      }
    },
    [clearCanvasSelection, selectedTile],
  );

  const resetDragState = useCallback(() => {
    setActiveId(null);
    setOverId(null);
    setActiveResizeHandle(null);
    setActiveResizeDeltaX(0);
    setActiveResizePreviewBounds(null);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: POINTER_DRAG_ACTIVATION_DISTANCE_PX,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const nextResizeHandle = getActiveResizeHandle(event);
      if (nextResizeHandle) {
        const tilePosition = findTilePosition(chartRows, nextResizeHandle.itemId);
        const activeRow = tilePosition ? chartRows[tilePosition.rowIndex] : null;
        const canvasElement = canvasRef.current;
        const chartContainerElement = canvasElement?.querySelector<HTMLElement>(
          `[data-chart-container-item-id="${nextResizeHandle.itemId}"]`,
        );
        const rowContainerElement = chartContainerElement?.closest('[data-raqi-layout="row"]');
        const sampleRowContainerElement = canvasElement?.querySelector('[data-raqi-layout="row"]');
        const chartWidthPx = chartContainerElement?.getBoundingClientRect().width ?? 0;
        const rowWidthPx = rowContainerElement?.getBoundingClientRect().width ?? chartWidthPx;
        const rowGapPx = getRowGapPx(rowContainerElement ?? sampleRowContainerElement);
        const activeRowItemCount = activeRow ? getChartRowTiles(activeRow).length : 1;
        const activeRowColumnCount = activeRow ? getChartRowColumnCount(activeRow) : 1;
        const previewMinItemCount =
          activeRowItemCount === 1 && activeRowColumnCount === 1 ? 2 : activeRowItemCount;
        const halfRowSlotWidthPx = getCalculatedRowItemMinWidthPx(rowWidthPx, 2, rowGapPx);
        const minWidthPx = (() => {
          if (activeRowItemCount > 1) {
            return halfRowSlotWidthPx * MULTI_TILE_RESIZE_MIN_WIDTH_RATIO;
          }
          if (activeRowColumnCount === 2) {
            return chartWidthPx;
          }
          return getCalculatedRowItemMinWidthPx(rowWidthPx, previewMinItemCount, rowGapPx);
        })();
        setActiveResizeHandle(nextResizeHandle);
        setActiveResizeDeltaX(0);
        setActiveResizePreviewBounds({
          widthPx: chartWidthPx,
          rowWidthPx,
          minWidthPx,
        });
        setActiveId((current) => (current === null ? current : null));
        setOverId((current) => (current === null ? current : null));
        return;
      }
      const nextActiveId = String(event.active.id);
      setActiveId((current) => (current === nextActiveId ? current : nextActiveId));
    },
    [chartRows],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (activeResizeHandle) {
        return;
      }
      const nextOverId = event.over ? String(event.over.id) : null;
      const emptySlotTarget = getEmptyChartSlotTarget(nextOverId);
      if (activeId && emptySlotTarget) {
        const sourcePosition = findTilePosition(chartRows, activeId);
        if (sourcePosition?.rowIndex === emptySlotTarget.rowIndex) {
          return;
        }
      }
      setOverId((current) => (current === nextOverId ? current : nextOverId));
    },
    [activeId, activeResizeHandle, chartRows],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!activeResizeHandle) {
        return;
      }
      setActiveResizeDeltaX((current) => (current === event.delta.x ? current : event.delta.x));
    },
    [activeResizeHandle],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (activeResizeHandle) {
        const resizeAction = getResizeActionForDrag(
          chartRows,
          activeResizeHandle,
          activeResizeDeltaX,
          activeResizePreviewBounds,
        );
        if (resizeAction) {
          const nextRows = applyResizeAction(chartRows, resizeAction);
          if (nextRows !== chartRows) {
            commitRows(nextRows);
          }
        }
        resetDragState();
        return;
      }

      const active = String(event.active.id);
      const over = event.over ? String(event.over.id) : null;
      resetDragState();
      if (!over || active === over) {
        return;
      }
      const emptySlotTarget = getEmptyChartSlotTarget(over);
      const nextRows = emptySlotTarget
        ? moveTileToEmptySlot(chartRows, active, emptySlotTarget.rowIndex)
        : moveTileToTile(chartRows, active, over);
      if (nextRows !== chartRows) {
        commitRows(nextRows);
      }
    },
    [
      activeResizeDeltaX,
      activeResizeHandle,
      activeResizePreviewBounds,
      commitRows,
      chartRows,
      resetDragState,
    ],
  );

  const getDropIndicator = useCallback(
    (itemId: string) => {
      if (activeResizeHandle || !activeId || !overId || itemId !== overId || activeId === overId) {
        return null;
      }
      const activeIndex = itemIds.indexOf(activeId);
      const overIndex = itemIds.indexOf(overId);
      if (activeIndex < 0 || overIndex < 0) {
        return null;
      }
      return activeIndex < overIndex ? 'after' : 'before';
    },
    [activeId, activeResizeHandle, itemIds, overId],
  );

  const getResizeCue = useCallback(
    (itemId: string): ChartCardResizeCue => {
      if (!activeResizeHandle || activeResizeHandle.itemId !== itemId) {
        return null;
      }
      return activeResizeAction ? 'ready' : 'idle';
    },
    [activeResizeAction, activeResizeHandle],
  );

  const getResizePreview = useCallback(
    (itemId: string) => {
      if (
        !activeResizeHandle ||
        activeResizeHandle.itemId !== itemId ||
        !activeResizePreviewBounds
      ) {
        return null;
      }
      const signedDeltaX =
        activeResizeHandle.side === 'right' ? activeResizeDeltaX : -activeResizeDeltaX;
      const clampedMinWidthPx = Math.min(
        activeResizePreviewBounds.minWidthPx,
        activeResizePreviewBounds.rowWidthPx,
      );
      const previewWidthPx = clamp(
        activeResizePreviewBounds.widthPx + signedDeltaX,
        clampedMinWidthPx,
        activeResizePreviewBounds.rowWidthPx,
      );
      const shouldAnchorPreviewToRowRightEdge =
        activeResizeHandle.side === 'left' && activeResizeAction?.type === 'row-item-to-full-width';
      let previewOffsetXPx = 0;
      if (activeResizeHandle.side === 'left') {
        const oldRowAnchoredOffsetXPx = activeResizePreviewBounds.widthPx - previewWidthPx;
        if (!shouldAnchorPreviewToRowRightEdge) {
          previewOffsetXPx = oldRowAnchoredOffsetXPx;
        } else {
          const fullRowAnchoredOffsetXPx = activeResizePreviewBounds.rowWidthPx - previewWidthPx;
          const thresholdWidthPx =
            activeResizePreviewBounds.rowWidthPx * RESIZE_UP_TRIGGER_TARGET_RATIO;
          const blendStartWidthPx = thresholdWidthPx - RESIZE_PREVIEW_ANCHOR_BLEND_RANGE_PX;
          const blendEndWidthPx = thresholdWidthPx + RESIZE_PREVIEW_ANCHOR_BLEND_RANGE_PX;
          const blendProgress = clamp(
            (previewWidthPx - blendStartWidthPx) / (blendEndWidthPx - blendStartWidthPx),
            0,
            1,
          );
          previewOffsetXPx = lerp(oldRowAnchoredOffsetXPx, fullRowAnchoredOffsetXPx, blendProgress);
        }
      }
      return {
        previewWidthPx,
        previewOffsetXPx,
        previewAnchor: activeResizeHandle.side,
      };
    },
    [activeResizeAction, activeResizeDeltaX, activeResizeHandle, activeResizePreviewBounds],
  );

  const getResizeSnapPreview = useCallback(
    (itemId: string) => {
      if (
        !activeResizeHandle ||
        activeResizeHandle.itemId !== itemId ||
        !activeResizePreviewBounds
      ) {
        return null;
      }
      const halfRowSlotWidthPx = getCalculatedRowItemMinWidthPx(
        activeResizePreviewBounds.rowWidthPx,
        2,
        0,
      );
      const snapPreviewWidthPx = !activeResizeAction
        ? activeResizePreviewBounds.widthPx
        : activeResizeAction.type === 'full-width-to-half-width'
          ? Math.min(halfRowSlotWidthPx, activeResizePreviewBounds.rowWidthPx)
          : activeResizePreviewBounds.rowWidthPx;
      return {
        snapPreviewWidthPx,
        snapPreviewAnchor: activeResizeHandle.side,
      };
    },
    [activeResizeAction, activeResizeHandle, activeResizePreviewBounds],
  );

  const getResizeOptions = useCallback(
    (itemId: string) => ({
      handles: getResizeHandlesForTile(chartRows, itemId),
      cue: getResizeCue(itemId),
      ...getResizePreview(itemId),
      ...getResizeSnapPreview(itemId),
    }),
    [chartRows, getResizeCue, getResizePreview, getResizeSnapPreview],
  );

  const dragDropContextValue = useMemo(
    () => ({
      isEnabled: true,
      getDropIndicator,
      getResizeOptions,
    }),
    [getDropIndicator, getResizeOptions],
  );

  const resizePreviewBodyRows = useMemo(() => {
    if (!activeResizeAction) {
      return chartRows;
    }
    const nextRows = applyResizeAction(chartRows, activeResizeAction);
    return nextRows === chartRows ? chartRows : collapseAdjacentHalfWidthRows(nextRows);
  }, [activeResizeAction, chartRows]);

  const chartDragPreviewRows = useMemo(() => {
    if (activeResizeHandle) {
      return null;
    }
    return getChartDragPreviewRows(chartRows, activeId, getRowDragPreviewTarget(overId, activeId));
  }, [activeId, activeResizeHandle, chartRows, overId]);

  const chartRowLayouts = resizePreviewBodyRows;
  const chartPlacements = useMemo(
    () =>
      chartRowLayouts === chartRows
        ? dashboardRenderModel.chartPlacements
        : selectChartPlacements(chartRowLayouts),
    [chartRowLayouts, chartRows, dashboardRenderModel.chartPlacements],
  );
  const { pageConfig, summaries, chartRows: synthesizedChartRows } = useDashboardSynthesis(config);

  return (
    <RAQIV2ConfigurablePageSurfaceContextProvider config={pageConfig}>
      <DashboardControlDefaultsCaptureProvider
        config={config}
        pageConfig={pageConfig}
        onConfigChange={onConfigChange}>
        <div className='flex flex-col items-start width-full gap-xxlarge'>
          <DashboardCanvasControlBar pageConfig={pageConfig} />
          <DashboardFilterChips pageConfig={pageConfig} />
          <section
            ref={canvasRef}
            aria-label={t.canvasContainerLabel}
            tabIndex={-1}
            className='flex flex-col items-start width-full'
            onMouseDownCapture={handleCanvasMouseDownCapture}
            style={canvasContainerStyle}>
            <AnalyticsChartContainerDragDropProvider value={dragDropContextValue}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragMove={handleDragMove}
                onDragCancel={resetDragState}
                onDragEnd={handleDragEnd}>
                <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                  <CanvasSelectionStoreContext.Provider value={selectionStore}>
                    <DashboardCanvasBody
                      pageConfig={pageConfig}
                      summaries={summaries}
                      chartRows={synthesizedChartRows}
                      chartPlacements={chartPlacements}
                      chartDragPreviewRows={chartDragPreviewRows}
                      activeChartDragId={activeId}
                      summaryCardCount={summaryCards.length}
                      activeEmptySlotId={getEmptyChartSlotTarget(overId) ? overId : null}
                      onAddSummaryCard={onAddSummaryCard}
                      onAddChart={onAddChart}
                      onSelectSummaryCard={selectSummaryCard}
                      onSelectChart={selectChartTile}
                      onEditSummaryCard={onEditSummaryCard}
                      onEditChart={onEditChart}
                      onDuplicateSummaryCard={handleDuplicateSummaryCard}
                      onDuplicateChart={handleDuplicateChart}
                      onRemoveSummaryCard={handleRemoveSummaryCard}
                      onRemoveChart={handleRemoveChart}
                    />
                  </CanvasSelectionStoreContext.Provider>
                </SortableContext>
              </DndContext>
            </AnalyticsChartContainerDragDropProvider>
          </section>
        </div>
      </DashboardControlDefaultsCaptureProvider>
    </RAQIV2ConfigurablePageSurfaceContextProvider>
  );
};

export default memo(EditPageCanvas);
