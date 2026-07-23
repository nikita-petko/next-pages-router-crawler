import type { ReactNode } from 'react';
import type { TranslationKeyAndTagsToFormattedReactNode } from '@modules/analytics-translations/types';
import type {
  TAnnotationId,
  TimeSeriesAnnotation,
} from '@modules/charts-generic/charts/types/Annotations';
import {
  AlertAnnotationSeverity,
  toAnnotationId,
} from '@modules/charts-generic/charts/types/Annotations';
import type { AnnotationAlertType, RAQIV2BreakdownValue } from '@modules/clients/analytics';
import getDimensionRenderer from '../components/getDimensionRenderer';
import { isSeverityBreakdownValue } from '../constants/alertAnnotationConfigs';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';

export const getSeverityBreakdownTooltip = (
  breakdownValue: RAQIV2BreakdownValue,
  translateHTML: TranslationKeyAndTagsToFormattedReactNode,
  descriptionLink?: string,
): ReactNode => {
  if (isSeverityBreakdownValue(breakdownValue)) {
    const { getBreakdownValueTooltipWithLink } = getDimensionRenderer(breakdownValue.dimension);
    if (getBreakdownValueTooltipWithLink) {
      return getBreakdownValueTooltipWithLink(breakdownValue, translateHTML, descriptionLink ?? '');
    }
  }
  return null;
};

const getAnnotationId = (
  breakdownValue: RAQIV2BreakdownValue[],
  startTime: Date,
  endTime: Date,
): TAnnotationId => {
  const breakdownValueHash = breakdownValue.map((bv) => `${bv.dimension}-${bv.value}`).join('|');
  return toAnnotationId(`${breakdownValueHash}-${startTime.getTime()}-${endTime.getTime()}`);
};

type MetricAlertsAnnotation = TimeSeriesAnnotation & {
  type: AnnotationAlertType;
};

type TooltipRenderer = (translateHTML: TranslationKeyAndTagsToFormattedReactNode) => ReactNode;

const NULL_TOOLTIP_RENDERER: TooltipRenderer = () => null;

const severityScoreMap: Record<AlertAnnotationSeverity, number> = {
  [AlertAnnotationSeverity.Error]: 0,
  [AlertAnnotationSeverity.Warning]: 1,
  [AlertAnnotationSeverity.Minor]: 2,
  [AlertAnnotationSeverity.Info]: 3,
};

const getPriorityScore = (annotation: MetricAlertsAnnotation): number => {
  const severityScore = severityScoreMap[annotation.severity];
  return severityScore * 1000 + annotation.priority;
};

export const removeOverlappedAnnotationsByPriorities = (
  annotations: MetricAlertsAnnotation[],
): MetricAlertsAnnotation[] => {
  const sortedAnnotations = annotations.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());

  const result: MetricAlertsAnnotation[] = [];
  let current: MetricAlertsAnnotation | null = null;
  let next: MetricAlertsAnnotation | null = null;
  const shouldSkipIndex = new Set<number>();

  for (let i = 0; i < sortedAnnotations.length; i += 1) {
    if (shouldSkipIndex.has(i)) {
      i += 1;
    }
    current = { ...sortedAnnotations[i] };

    for (let j = i + 1; j < sortedAnnotations.length; j += 1) {
      next = { ...sortedAnnotations[j] };
      const currentScore = getPriorityScore(current);
      const nextScore = getPriorityScore(next);

      if (
        current.startUtc.getTime() === next.startUtc.getTime() &&
        current.endUtc.getTime() === next.endUtc.getTime()
      ) {
        if (currentScore >= nextScore) {
          current = null;
          break;
        }
      } else if (current.endUtc > next.startUtc) {
        if (currentScore < nextScore) {
          sortedAnnotations[j].startUtc = current.endUtc;
          if (sortedAnnotations[j].startUtc >= sortedAnnotations[j].endUtc) {
            shouldSkipIndex.add(j);
          }
        } else {
          current.endUtc = next.startUtc;
        }
      }
    }

    if (current && current.startUtc <= current.endUtc) {
      result.push(current);
    }
  }

  return result;
};

export const adaptAlertAnnotationSeriesToRange = ({
  annotationType,
  response,
  priority,
  descriptionLink,
  fallbackTooltipRenderer,
}: {
  annotationType: AnnotationAlertType;
  response: RAQIV2QueryResponses;
  priority: number;
  descriptionLink?: string;
  fallbackTooltipRenderer?: (translateHTML: TranslationKeyAndTagsToFormattedReactNode) => ReactNode;
}): MetricAlertsAnnotation[] => {
  if (!response.response?.values || response.response.values.length === 0) {
    return [];
  }

  const allAnnotations: MetricAlertsAnnotation[] = [];

  response.response.values.forEach((value) => {
    const breakdownValues = value.breakdownValue ?? [];
    const severityBreakdownValue = breakdownValues.find((bv) => isSeverityBreakdownValue(bv));
    const severity = severityBreakdownValue?.value ?? AlertAnnotationSeverity.Info;

    let tooltipRenderer: TooltipRenderer = NULL_TOOLTIP_RENDERER;
    if (severityBreakdownValue) {
      tooltipRenderer = (translateHTML) =>
        getSeverityBreakdownTooltip(severityBreakdownValue, translateHTML, descriptionLink);
    } else if (fallbackTooltipRenderer) {
      tooltipRenderer = fallbackTooltipRenderer;
    }

    const dataPoints = value.dataPoints ?? [];
    let currentAnnotationStartDate: Date | null = null;
    let currentAnnotationEndDate: Date | null = null;

    for (const dataPoint of dataPoints) {
      const { time, value: dataPointValue } = dataPoint;
      if (time === undefined || dataPointValue === undefined) {
        continue;
      }

      const currentTime = new Date(time);

      if (dataPointValue === 1) {
        currentAnnotationStartDate ??= currentTime;
        currentAnnotationEndDate = currentTime;
      } else if (dataPointValue === 0 && currentAnnotationStartDate && currentAnnotationEndDate) {
        allAnnotations.push({
          id: getAnnotationId(
            breakdownValues,
            currentAnnotationStartDate,
            currentAnnotationEndDate,
          ),
          type: annotationType,
          startUtc: currentAnnotationStartDate,
          endUtc: currentAnnotationEndDate,
          tooltipRenderer,
          severity,
          priority,
        });
        currentAnnotationStartDate = null;
        currentAnnotationEndDate = null;
      }
    }

    // Handle the case where series ends with 1
    if (currentAnnotationStartDate && currentAnnotationEndDate) {
      allAnnotations.push({
        id: getAnnotationId(breakdownValues, currentAnnotationStartDate, currentAnnotationEndDate),
        type: annotationType,
        startUtc: currentAnnotationStartDate,
        endUtc: currentAnnotationEndDate,
        tooltipRenderer,
        severity,
        priority,
      });
    }
  });

  // remove overlap annotations time
  return removeOverlappedAnnotationsByPriorities(allAnnotations);
};
