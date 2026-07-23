import React, { useEffect, useMemo, useState } from 'react';
import { DragHandleIcon, IconButton, makeStyles } from '@rbx/ui';
import type { ChartCardDragDropOptions, ChartCardResizeOptions } from './ChartCardDragDropContext';
import { useChartCardDragDropOptions } from './ChartCardDragDropContext';

const resizeHandleIconPath =
  'M16.6925 10.4422L10.4425 16.6922C10.3845 16.7503 10.3155 16.7963 10.2397 16.8277C10.1638 16.8592 ' +
  '10.0825 16.8754 10.0003 16.8754C9.91823 16.8754 9.83691 16.8592 9.76104 16.8277C9.68517 16.7963 ' +
  '9.61623 16.7503 9.55816 16.6922C9.50009 16.6341 9.45403 16.5652 9.4226 16.4893C9.39117 16.4134 ' +
  '9.375 16.3321 9.375 16.25C9.375 16.1679 9.39117 16.0866 9.4226 16.0107C9.45403 15.9348 9.50009 ' +
  '15.8659 9.55816 15.8078L15.8082 9.55782C15.8662 9.49975 15.9352 9.45368 16.011 9.42226C16.0869 ' +
  '9.39083 16.1682 9.37466 16.2503 9.37466C16.3325 9.37466 16.4138 9.39083 16.4897 9.42226C16.5655 ' +
  '9.45368 16.6345 9.49975 16.6925 9.55782C16.7506 9.61588 16.7967 9.68482 16.8281 9.76069C16.8595 ' +
  '9.83656 16.8757 9.91788 16.8757 10C16.8757 10.0821 16.8595 10.1634 16.8281 10.2393C16.7967 10.3152 ' +
  '16.7506 10.3841 16.6925 10.4422ZM15.4425 2.68282C15.3845 2.62471 15.3156 2.57861 15.2397 2.54715C15.1638 ' +
  '2.5157 15.0825 2.49951 15.0003 2.49951C14.9182 2.49951 14.8369 2.5157 14.761 2.54715C14.6851 2.57861 ' +
  '14.6162 2.62471 14.5582 2.68282L2.68316 14.5578C2.56588 14.6751 2.5 14.8342 2.5 15C2.5 15.1659 2.56588 ' +
  '15.3249 2.68316 15.4422C2.80044 15.5595 2.9595 15.6254 3.12535 15.6254C3.2912 15.6254 3.45026 15.5595 ' +
  '3.56753 15.4422L15.4425 3.56719C15.5006 3.50915 15.5467 3.44021 15.5782 3.36434C15.6097 3.28847 ' +
  '15.6258 3.20714 15.6258 3.125C15.6258 3.04287 15.6097 2.96154 15.5782 2.88567C15.5467 2.80979 ' +
  '15.5006 2.74086 15.4425 2.68282Z';

const useStyles = makeStyles()((theme) => ({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  dragHandle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    transform: 'translate(-50%, -50%)',
    zIndex: theme.zIndex.speedDial,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 120ms ease',
  },
  dragHandleVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  draggingContainer: {
    opacity: 0.72,
    zIndex: theme.zIndex.modal,
  },
  dropTargetHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.45)',
    borderRadius: '8px',
    transition: 'background-color 120ms ease, box-shadow 120ms ease',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: '6px',
    zIndex: theme.zIndex.speedDial,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 120ms ease',
  },
  resizeHandleLeft: {
    left: '6px',
    cursor: 'w-resize',
  },
  resizeHandleRight: {
    right: '6px',
    cursor: 'e-resize',
  },
  resizeHandleVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  resizeHandleButton: {
    padding: 0,
    minWidth: 0,
    backgroundColor: 'transparent !important',
    cursor: 'ew-resize !important',
  },
  resizingContainer: {
    boxShadow: 'inset 0 0 0 2px #3b82f6',
  },
  resizingFromLeft: {
    boxShadow: 'inset 3px 0 0 #3b82f6',
  },
  resizingFromRight: {
    boxShadow: 'inset -3px 0 0 #3b82f6',
  },
  resizeHandleGlyph: {
    width: '20px',
    height: '20px',
    color: '#D5D7DD',
  },
  resizeHandleGlyphLeft: {
    transform: 'scaleX(-1)',
  },
  resizeHandleGlyphRight: {
    transform: 'none',
  },
  resizeSnapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: '8px',
    border: '1px dashed rgba(59, 130, 246, 0.65)',
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    pointerEvents: 'none',
  },
  resizeSnapZoneLeft: {
    right: 0,
  },
  resizeSnapZoneRight: {
    left: 0,
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },
}));

export type ChartCardDragAndResizeContainerProps = React.PropsWithChildren<{
  dragAndDropOptions?: ChartCardDragDropOptions;
  resizeOptions?: ChartCardResizeOptions;
}>;

const ChartCardDragAndResizeContainer: React.FC<ChartCardDragAndResizeContainerProps> = ({
  children,
  dragAndDropOptions,
  resizeOptions,
}) => {
  const {
    classes: {
      container,
      dragHandle,
      dragHandleVisible,
      draggingContainer,
      dropTargetHighlight,
      resizeHandle,
      resizeHandleLeft,
      resizeHandleRight,
      resizeHandleVisible,
      resizeHandleButton,
      resizingContainer,
      resizingFromLeft,
      resizingFromRight,
      resizeHandleGlyph,
      resizeHandleGlyphLeft,
      resizeHandleGlyphRight,
      resizeSnapZone,
      resizeSnapZoneLeft,
      resizeSnapZoneRight,
      contentLayer,
    },
    cx,
  } = useStyles();

  const dragAndDropOptionsFromContext = useChartCardDragDropOptions();
  const effectiveDragAndDropOptions = dragAndDropOptions ?? dragAndDropOptionsFromContext;
  const effectiveResizeOptions = resizeOptions ?? effectiveDragAndDropOptions?.resizeOptions;
  const [isHoveringContainer, setIsHoveringContainer] = useState(false);

  const canShowLeftResizeHandle = !!(
    effectiveResizeOptions?.isEnabled && effectiveResizeOptions.handles.includes('left')
  );
  const canShowRightResizeHandle = !!(
    effectiveResizeOptions?.isEnabled && effectiveResizeOptions.handles.includes('right')
  );
  const shouldShowResizeHandles = !!(
    isHoveringContainer ||
    effectiveResizeOptions?.isResizing ||
    effectiveDragAndDropOptions?.isDragging
  );
  const shouldShowSnapPreview = !!(
    effectiveResizeOptions?.isResizing &&
    typeof effectiveResizeOptions.snapPreviewWidthPx === 'number' &&
    effectiveResizeOptions.snapPreviewWidthPx > 0
  );
  const dropTargetHighlightStyle = useMemo(() => {
    const transformOffset = effectiveDragAndDropOptions?.containerTransform;
    if (!transformOffset) {
      return;
    }
    return {
      transform: `translate(${-transformOffset.x}px, ${-transformOffset.y}px)`,
    } as React.CSSProperties;
  }, [effectiveDragAndDropOptions?.containerTransform]);
  useEffect(() => {
    if (typeof document === 'undefined' || !effectiveResizeOptions?.isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    let globalResizeCursor = 'ew-resize';
    if (effectiveResizeOptions.activeHandle === 'left') {
      globalResizeCursor = 'w-resize';
    } else if (effectiveResizeOptions.activeHandle === 'right') {
      globalResizeCursor = 'e-resize';
    }
    document.body.style.cursor = globalResizeCursor;

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [effectiveResizeOptions?.activeHandle, effectiveResizeOptions?.isResizing]);

  return (
    <div
      ref={effectiveDragAndDropOptions?.containerRef}
      style={effectiveDragAndDropOptions?.containerStyle}
      {...effectiveDragAndDropOptions?.containerAttributes}
      onMouseEnter={() => setIsHoveringContainer(true)}
      onMouseLeave={() => setIsHoveringContainer(false)}
      className={cx(
        effectiveDragAndDropOptions?.isEnabled && container,
        effectiveDragAndDropOptions?.isDragging && draggingContainer,
        effectiveResizeOptions?.isResizing && resizingContainer,
        effectiveResizeOptions?.isResizing &&
          effectiveResizeOptions.activeHandle === 'left' &&
          resizingFromLeft,
        effectiveResizeOptions?.isResizing &&
          effectiveResizeOptions.activeHandle === 'right' &&
          resizingFromRight,
        effectiveDragAndDropOptions?.containerClassName,
      )}>
      {!!effectiveDragAndDropOptions?.dropIndicator && (
        <div className={dropTargetHighlight} style={dropTargetHighlightStyle} aria-hidden='true' />
      )}
      {shouldShowSnapPreview && (
        <div
          className={cx(
            resizeSnapZone,
            effectiveResizeOptions?.snapPreviewAnchor === 'left'
              ? resizeSnapZoneLeft
              : resizeSnapZoneRight,
          )}
          style={{ width: effectiveResizeOptions?.snapPreviewWidthPx }}
          aria-hidden='true'
        />
      )}
      {canShowLeftResizeHandle && (
        <IconButton
          {...effectiveResizeOptions?.leftHandleAttributes}
          {...effectiveResizeOptions?.leftHandleListeners}
          aria-label='Resize chart from left edge'
          size='small'
          color='onMediaLight'
          className={cx(
            resizeHandle,
            resizeHandleButton,
            resizeHandleLeft,
            shouldShowResizeHandles && resizeHandleVisible,
          )}>
          <svg
            className={cx(resizeHandleGlyph, resizeHandleGlyphLeft)}
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'>
            <path d={resizeHandleIconPath} fill='currentColor' />
          </svg>
        </IconButton>
      )}
      {canShowRightResizeHandle && (
        <IconButton
          {...effectiveResizeOptions?.rightHandleAttributes}
          {...effectiveResizeOptions?.rightHandleListeners}
          aria-label='Resize chart from right edge'
          size='small'
          color='onMediaLight'
          className={cx(
            resizeHandle,
            resizeHandleButton,
            resizeHandleRight,
            shouldShowResizeHandles && resizeHandleVisible,
          )}>
          <svg
            className={cx(resizeHandleGlyph, resizeHandleGlyphRight)}
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'>
            <path d={resizeHandleIconPath} fill='currentColor' />
          </svg>
        </IconButton>
      )}
      {effectiveDragAndDropOptions?.isEnabled && (
        <IconButton
          {...effectiveDragAndDropOptions.handleAttributes}
          {...effectiveDragAndDropOptions.handleListeners}
          aria-label='Drag to reorder chart'
          size='small'
          color='onMediaLight'
          variant='contained'
          className={cx(
            dragHandle,
            (isHoveringContainer || effectiveDragAndDropOptions.isDragging) && dragHandleVisible,
          )}>
          <DragHandleIcon fontSize='small' />
        </IconButton>
      )}
      <div className={contentLayer}>{children}</div>
    </div>
  );
};

export default ChartCardDragAndResizeContainer;
