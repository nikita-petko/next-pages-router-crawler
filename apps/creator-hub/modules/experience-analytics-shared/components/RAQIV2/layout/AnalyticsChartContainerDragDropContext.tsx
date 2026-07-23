import React, { createContext, useContext } from 'react';
import type {
  ChartCardDropIndicator,
  ChartCardResizeCue,
  ChartCardResizeSide,
} from '@rbx/analytics-ui';

export type AnalyticsChartContainerResizeOptions = {
  handles: ChartCardResizeSide[];
  cue?: ChartCardResizeCue;
  previewWidthPx?: number;
  previewOffsetXPx?: number;
  previewAnchor?: ChartCardResizeSide;
  snapPreviewWidthPx?: number;
  snapPreviewAnchor?: ChartCardResizeSide;
};

type AnalyticsChartContainerDragDropContextValue = {
  isEnabled: boolean;
  getDropIndicator: (itemId: string) => ChartCardDropIndicator;
  getResizeOptions?: (itemId: string) => AnalyticsChartContainerResizeOptions;
};

const AnalyticsChartContainerDragDropContext =
  createContext<AnalyticsChartContainerDragDropContextValue | null>(null);

export const AnalyticsChartContainerDragDropProvider: React.FC<
  React.PropsWithChildren<{
    value: AnalyticsChartContainerDragDropContextValue | null;
  }>
> = ({ value, children }) => {
  return (
    <AnalyticsChartContainerDragDropContext.Provider value={value}>
      {children}
    </AnalyticsChartContainerDragDropContext.Provider>
  );
};

export const useAnalyticsChartContainerDragDropContext = () => {
  return useContext(AnalyticsChartContainerDragDropContext);
};
