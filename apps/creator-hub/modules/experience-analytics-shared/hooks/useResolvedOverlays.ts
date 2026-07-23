import { useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { BenchmarkType } from '../constants/BenchmarkType';
import {
  type ChartOverlays,
  type ComparisonOverlay,
  hasOverlay,
  getOverlay,
} from '../types/RAQIV2ChartSpec';
import isComparisonOverlayMeaningful from '../utils/isComparisonOverlayMeaningful';

export type ResolvedOverlays = {
  comparison: boolean;
  comparisonOffset: ComparisonOverlay['relativeOffset'];
  comparisonCustomStartDate: ComparisonOverlay['customStartDate'];
  benchmark: { show: boolean; benchmarkType?: BenchmarkType };
};

/** The chart shape needed to derive overlay defaults. */
export type OverlayChartContext = {
  chartType?: ChartType;
  breakdown?: readonly TRAQIV2Dimension[];
};

/**
 * Centralizes overlay resolution logic shared by chart components.
 *
 * Callers pass the chart `context` (type + breakdown) rather than precomputed
 * defaults, so the rule for when each overlay is shown by default lives here
 * instead of being hand-rolled at every call site. The comparison default is
 * derived from `isComparisonOverlayMeaningful`, the same rule that drives the
 * explore-mode toggle's availability, and benchmarks default on.
 *
 * When `overlays` is `undefined`, these defaults apply.
 * When `overlays` is an explicit array, the array is the source of truth.
 */
const useResolvedOverlays = (
  overlays: ChartOverlays | undefined,
  context: OverlayChartContext,
): ResolvedOverlays => {
  const { chartType, breakdown } = context;
  return useMemo(
    () => ({
      comparison:
        overlays === undefined
          ? isComparisonOverlayMeaningful({ chartType, breakdown })
          : hasOverlay(overlays, 'comparison'),
      comparisonOffset: getOverlay(overlays, 'comparison')?.relativeOffset,
      comparisonCustomStartDate: getOverlay(overlays, 'comparison')?.customStartDate,
      benchmark: {
        show: overlays === undefined || hasOverlay(overlays, 'benchmark'),
        benchmarkType: getOverlay(overlays, 'benchmark')?.benchmarkType,
      },
    }),
    [overlays, chartType, breakdown],
  );
};

export default useResolvedOverlays;
