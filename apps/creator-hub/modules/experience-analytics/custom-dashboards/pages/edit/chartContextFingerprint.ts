import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import {
  snapToLatestEndTime,
  snapToLatestStartTime,
} from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';

const parseTimeSpecDateForFingerprint = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const timeMs = Date.parse(value);
  return Number.isFinite(timeMs) ? new Date(timeMs) : null;
};

export const normalizeTimeSpecForFingerprint = (
  timeSpec: RAQIV2ChartContext['timeSpec'],
  granularity: RAQIV2ChartContext['granularity'],
): unknown => {
  const snapGranularity = timeSpec.snapGranularity ?? granularity;
  const startTime = parseTimeSpecDateForFingerprint(timeSpec.startTime);
  const endTime = parseTimeSpecDateForFingerprint(timeSpec.endTime);
  return {
    ...timeSpec,
    startTime: startTime
      ? snapToLatestStartTime(startTime, snapGranularity).getTime()
      : timeSpec.startTime,
    endTime: endTime ? snapToLatestEndTime(endTime, snapGranularity).getTime() : timeSpec.endTime,
  };
};

export const chartContextFingerprint = (chartContext: RAQIV2ChartContext): string =>
  JSON.stringify({
    resource: chartContext.resource,
    timeSpec: normalizeTimeSpecForFingerprint(chartContext.timeSpec, chartContext.granularity),
    granularity: chartContext.granularity,
    filter: chartContext.filter ?? [],
    breakdown: chartContext.breakdown ?? [],
    timeAxisBounds: chartContext.timeAxisBounds,
    limit: chartContext.limit,
    benchmarkPercentiles: chartContext.benchmarkPercentiles,
    overlays: chartContext.overlays,
    displayOptions: chartContext.displayOptions,
  });
