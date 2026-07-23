import React, { useMemo } from 'react';
import { ChartCardDragDropProvider, type ChartCardResizeSide } from '@rbx/analytics-ui';
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AnalyticsChartContainerResizeOptions } from './AnalyticsChartContainerDragDropContext';

type SortableAnalyticsChartContainerProps = {
  itemId: string;
  dropIndicator: 'before' | 'after' | null;
  resizeOptions?: AnalyticsChartContainerResizeOptions;
};

const SortableAnalyticsChartContainer: React.FC<
  React.PropsWithChildren<SortableAnalyticsChartContainerProps>
> = ({ itemId, dropIndicator, resizeOptions, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });
  const canResizeFromLeft = !!resizeOptions?.handles.includes('left');
  const canResizeFromRight = !!resizeOptions?.handles.includes('right');
  const leftResizeHandle = useDraggable({
    id: `chart-resize-handle:${itemId}:left`,
    disabled: !canResizeFromLeft,
    data: {
      kind: 'chart-resize-handle',
      itemId,
      side: 'left' as ChartCardResizeSide,
    },
  });
  const rightResizeHandle = useDraggable({
    id: `chart-resize-handle:${itemId}:right`,
    disabled: !canResizeFromRight,
    data: {
      kind: 'chart-resize-handle',
      itemId,
      side: 'right' as ChartCardResizeSide,
    },
  });
  let activeResizeHandle: ChartCardResizeSide | null = null;
  if (leftResizeHandle.isDragging) {
    activeResizeHandle = 'left';
  } else if (rightResizeHandle.isDragging) {
    activeResizeHandle = 'right';
  }
  const transformValue = useMemo(() => {
    if (!transform) {
      return undefined;
    }
    // Keep chart cards from stretching when moving between
    // full-width and row-width slots during sorting.
    return CSS.Transform.toString({
      ...transform,
      scaleX: 1,
      scaleY: 1,
    });
  }, [transform]);
  const resizePreviewTransform = useMemo(() => {
    if (!activeResizeHandle || !resizeOptions?.previewOffsetXPx) {
      return undefined;
    }
    return `translateX(${resizeOptions.previewOffsetXPx}px)`;
  }, [activeResizeHandle, resizeOptions?.previewOffsetXPx]);

  const dragDropOptions = useMemo(
    () => ({
      isEnabled: true,
      containerRef: setNodeRef,
      containerStyle: {
        transform: activeResizeHandle ? resizePreviewTransform : transformValue,
        width: resizeOptions?.previewWidthPx,
        transition: activeResizeHandle ? undefined : transition,
      },
      containerTransform: transform
        ? {
            x: transform.x,
            y: transform.y,
          }
        : undefined,
      containerAttributes: {
        'data-chart-container-item-id': itemId,
      } as React.HTMLAttributes<HTMLDivElement>,
      handleAttributes: attributes,
      handleListeners: listeners,
      isDragging,
      dropIndicator,
      resizeOptions: resizeOptions && {
        isEnabled: resizeOptions.handles.length > 0,
        handles: resizeOptions.handles,
        leftHandleAttributes: leftResizeHandle.attributes,
        leftHandleListeners: leftResizeHandle.listeners,
        rightHandleAttributes: rightResizeHandle.attributes,
        rightHandleListeners: rightResizeHandle.listeners,
        isResizing: activeResizeHandle !== null,
        activeHandle: activeResizeHandle,
        cue: resizeOptions.cue ?? null,
        snapPreviewWidthPx: resizeOptions.snapPreviewWidthPx,
        snapPreviewAnchor: resizeOptions.snapPreviewAnchor,
      },
    }),
    [
      activeResizeHandle,
      attributes,
      dropIndicator,
      isDragging,
      leftResizeHandle.attributes,
      leftResizeHandle.listeners,
      listeners,
      resizeOptions,
      rightResizeHandle.attributes,
      rightResizeHandle.listeners,
      setNodeRef,
      itemId,
      resizePreviewTransform,
      transform,
      transformValue,
      transition,
    ],
  );

  return <ChartCardDragDropProvider value={dragDropOptions}>{children}</ChartCardDragDropProvider>;
};

export default SortableAnalyticsChartContainer;
