import type { FC } from 'react';
import React, { createContext, useContext, useState, useMemo } from 'react';

/**
 * Represents the type of metric averaging used for benchmarks and snapshot sections.
 * - L7Average: 7-day moving average values (smoothed, default)
 * - Daily: Daily values (more responsive to recent changes)
 */
export enum MetricAverageType {
  L7Average = 'L7Average',
  Daily = 'Daily',
}

type MetricAverageTypeContextValue = {
  metricAverageType: MetricAverageType;
  setMetricAverageType: React.Dispatch<React.SetStateAction<MetricAverageType>>;
};

const MetricAverageTypeContext = createContext<MetricAverageTypeContextValue | null>(null);

/**
 * Provider component for sharing metric average type state between
 * BenchmarkScoreCardsSection and SnapshotSection.
 */
export const MetricAverageTypeProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const [metricAverageType, setMetricAverageType] = useState<MetricAverageType>(
    MetricAverageType.L7Average,
  );

  const value = useMemo(
    () => ({
      metricAverageType,
      setMetricAverageType,
    }),
    [metricAverageType],
  );

  return (
    <MetricAverageTypeContext.Provider value={value}>{children}</MetricAverageTypeContext.Provider>
  );
};

/**
 * Hook to access the shared metric average type state.
 * Must be used within a MetricAverageTypeProvider.
 */
export const useMetricAverageType = (): MetricAverageTypeContextValue => {
  const context = useContext(MetricAverageTypeContext);
  if (!context) {
    throw new Error('useMetricAverageType must be used within a MetricAverageTypeProvider');
  }
  return context;
};
