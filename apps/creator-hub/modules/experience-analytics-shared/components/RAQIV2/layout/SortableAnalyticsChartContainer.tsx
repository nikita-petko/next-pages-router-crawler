import React, { useCallback, useMemo } from 'react';
import { closestCenter } from '@dnd-kit/collision';
import { Feedback } from '@dnd-kit/dom';
import { SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import { useDraggable } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import {
  ChartCardDragDropProvider,
  type ChartCardDragDropOptions,
  type ChartCardResizeSide,
} from '@rbx/analytics-ui';
import {
  type AnalyticsChartContainerResizeOptions,
  useAnalyticsChartContainerDragDropContext,
} from './AnalyticsChartContainerDragDropContext';

type SortableAnalyticsChartContainerProps = {
  itemId: string;
  dropIndicator: 'before' | 'after' | null;
  resizeOptions?: AnalyticsChartContainerResizeOptions;
};

const RESIZE_HANDLE_PLUGINS = [Feedback.configure({ feedback: 'none' })];
// Chart rows render their own preview and commit custom row-layout mutations. Keep keyboard sorting,
// but do not let the default optimistic plugin reparent chart containers outside their grid wrappers.
const CHART_SORTABLE_PLUGINS = [SortableKeyboardPlugin];

const SortableAnalyticsChartContainer: React.FC<
  React.PropsWithChildren<SortableAnalyticsChartContainerProps>
> = ({ itemId, dropIndicator, resizeOptions, children }) => {
  const dragDropContext = useAnalyticsChartContainerDragDropContext();
  const { handleRef, isDragging, ref } = useSortable({
    id: itemId,
    index: dragDropContext?.getIndex(itemId) ?? -1,
    collisionDetector: closestCenter,
    plugins: CHART_SORTABLE_PLUGINS,
  });
  const canResizeFromLeft = !!resizeOptions?.handles.includes('left');
  const canResizeFromRight = !!resizeOptions?.handles.includes('right');
  const { isDragging: isLeftResizeHandleDragging, ref: leftResizeHandleRef } = useDraggable({
    id: `chart-resize-handle:${itemId}:left`,
    disabled: !canResizeFromLeft,
    data: {
      kind: 'chart-resize-handle',
      itemId,
      side: 'left' as ChartCardResizeSide,
    },
    plugins: RESIZE_HANDLE_PLUGINS,
  });
  const { isDragging: isRightResizeHandleDragging, ref: rightResizeHandleRef } = useDraggable({
    id: `chart-resize-handle:${itemId}:right`,
    disabled: !canResizeFromRight,
    data: {
      kind: 'chart-resize-handle',
      itemId,
      side: 'right' as ChartCardResizeSide,
    },
    plugins: RESIZE_HANDLE_PLUGINS,
  });
  let activeResizeHandle: ChartCardResizeSide | null = null;
  if (isLeftResizeHandleDragging) {
    activeResizeHandle = 'left';
  } else if (isRightResizeHandleDragging) {
    activeResizeHandle = 'right';
  }
  const connectContainerRef = useCallback(
    (element: HTMLDivElement | null) => {
      ref(element);
      // `ChartCardDragDropProvider` renders these controls before this container ref runs.
      // Their data attributes are a cross-package contract with
      // `@rbx/analytics-ui`'s `ChartCardDragAndResizeContainer`.
      handleRef(element?.querySelector<HTMLButtonElement>('[data-chart-drag-handle]') ?? null);
      leftResizeHandleRef(
        canResizeFromLeft
          ? (element?.querySelector<HTMLButtonElement>('[data-chart-resize-handle="left"]') ?? null)
          : null,
      );
      rightResizeHandleRef(
        canResizeFromRight
          ? (element?.querySelector<HTMLButtonElement>('[data-chart-resize-handle="right"]') ??
              null)
          : null,
      );
    },
    [
      canResizeFromLeft,
      canResizeFromRight,
      handleRef,
      leftResizeHandleRef,
      ref,
      rightResizeHandleRef,
    ],
  );
  const resizePreviewTransform = useMemo(() => {
    if (!activeResizeHandle || !resizeOptions?.previewOffsetXPx) {
      return undefined;
    }
    return `translateX(${resizeOptions.previewOffsetXPx}px)`;
  }, [activeResizeHandle, resizeOptions?.previewOffsetXPx]);

  const dragDropOptions = useMemo<ChartCardDragDropOptions>(
    () => ({
      isEnabled: true,
      containerRef: connectContainerRef,
      containerStyle: {
        transform: activeResizeHandle ? resizePreviewTransform : undefined,
        width: resizeOptions?.previewWidthPx,
      },
      containerItemId: itemId,
      isDragging,
      dropIndicator,
      resizeOptions: resizeOptions && {
        isEnabled: resizeOptions.handles.length > 0,
        handles: resizeOptions.handles,
        isResizing: activeResizeHandle !== null,
        activeHandle: activeResizeHandle,
        cue: resizeOptions.cue ?? null,
        snapPreviewWidthPx: resizeOptions.snapPreviewWidthPx,
        snapPreviewAnchor: resizeOptions.snapPreviewAnchor,
      },
    }),
    [
      activeResizeHandle,
      connectContainerRef,
      dropIndicator,
      isDragging,
      resizeOptions,
      itemId,
      resizePreviewTransform,
    ],
  );

  return <ChartCardDragDropProvider value={dragDropOptions}>{children}</ChartCardDragDropProvider>;
};

export default SortableAnalyticsChartContainer;
