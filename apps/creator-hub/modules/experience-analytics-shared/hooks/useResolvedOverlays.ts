import { useMemo } from 'react';
import type { BenchmarkType } from '../constants/BenchmarkType';
import { type ChartOverlays, hasOverlay, getOverlay } from '../types/RAQIV2ChartSpec';

export type ResolvedOverlays = {
  comparison: boolean;
  benchmark: { show: boolean; benchmarkType?: BenchmarkType };
  trendLine: boolean;
};

type OverlayDefaults = {
  comparison: boolean;
};

/**
 * Centralizes overlay resolution logic shared by chart components.
 *
 * Each chart passes its own `defaults` to capture chart-specific behavior
 * (e.g. SplineChartV2 defaults comparison to `!breakdown?.length`,
 * DurationSplineChartV2 defaults comparison to `true`).
 *
 * When `overlays` is `undefined`, the chart uses its defaults.
 * When `overlays` is an explicit array, the array is the source of truth.
 */
const useResolvedOverlays = (
  overlays: ChartOverlays | undefined,
  defaults: OverlayDefaults,
): ResolvedOverlays =>
  useMemo(
    () => ({
      comparison: overlays === undefined ? defaults.comparison : hasOverlay(overlays, 'comparison'),
      benchmark: {
        show: overlays === undefined || hasOverlay(overlays, 'benchmark'),
        benchmarkType: getOverlay(overlays, 'benchmark')?.benchmarkType,
      },
      trendLine: overlays !== undefined && hasOverlay(overlays, 'trend-line'),
    }),
    [overlays, defaults.comparison],
  );

export default useResolvedOverlays;
