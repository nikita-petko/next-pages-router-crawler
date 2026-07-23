import React, { createContext, useContext } from 'react';

export type ChartCardDropIndicator = 'before' | 'after' | null;
export type ChartCardResizeSide = 'left' | 'right';
export type ChartCardResizeCue = 'idle' | 'ready' | null;

export type ChartCardResizeOptions = {
  isEnabled: boolean;
  handles: ChartCardResizeSide[];
  leftHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  leftHandleListeners?: React.HTMLAttributes<HTMLButtonElement>;
  rightHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  rightHandleListeners?: React.HTMLAttributes<HTMLButtonElement>;
  isResizing?: boolean;
  activeHandle?: ChartCardResizeSide | null;
  cue?: ChartCardResizeCue;
  snapPreviewWidthPx?: number;
  snapPreviewAnchor?: ChartCardResizeSide;
};

export type ChartCardDragDropOptions = {
  isEnabled: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
  containerTransform?: {
    x: number;
    y: number;
  };
  containerAttributes?: React.HTMLAttributes<HTMLDivElement>;
  containerClassName?: string;
  handleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  handleListeners?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  dropIndicator?: ChartCardDropIndicator;
  resizeOptions?: ChartCardResizeOptions;
};

const ChartCardDragDropContext = createContext<ChartCardDragDropOptions | null>(null);

export const ChartCardDragDropProvider: React.FC<
  React.PropsWithChildren<{
    value: ChartCardDragDropOptions | null;
  }>
> = ({ value, children }) => {
  return (
    <ChartCardDragDropContext.Provider value={value}>{children}</ChartCardDragDropContext.Provider>
  );
};

export const useChartCardDragDropOptions = (): ChartCardDragDropOptions | null => {
  return useContext(ChartCardDragDropContext);
};
