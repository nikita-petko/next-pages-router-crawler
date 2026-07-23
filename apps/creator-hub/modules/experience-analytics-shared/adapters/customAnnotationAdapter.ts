import { ReactNode } from 'react';
import {
  TAnnotationId,
  AlertAnnotationSeverity,
  TimeSeriesAnnotation,
} from '@modules/charts-generic';
import { TranslationKeyAndTagsToFormattedReactNode } from '@modules/analytics-translations';
import { AnnotationAlertType, RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import { isSeverityBreakdownValue } from '../constants/alertAnnotationConfigs';
import getDimensionRenderer from '../components/getDimensionRenderer';

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
  return `${breakdownValueHash}-${startTime.getTime()}-${endTime.getTime()}` as TAnnotationId;
};

type MetricAlertsAnnotation = TimeSeriesAnnotation & {
  type: AnnotationAlertType;
};

type AnnotationAccumulatorType = {
  annotations: MetricAlertsAnnotation[];
  currentAnnotationStartDate: Date | null;
  currentAnnotationEndDate: Date | null;
};

const severityScoreMap: Record<AlertAnnotationSeverity, number> = {
  [AlertAnnotationSeverity.Error]: 0,
  [AlertAnnotationSeverity.Warning]: 1,
  [AlertAnnotationSeverity.Info]: 2,
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
    const breakdownValues = value.breakdownValue || [];
    const severityBreakdownValue = breakdownValues.find((bv) => isSeverityBreakdownValue(bv));

    let tooltipRenderer: (
      translateHTML: TranslationKeyAndTagsToFormattedReactNode,
    ) => ReactNode = () => null;

    if (severityBreakdownValue) {
      tooltipRenderer = (translateHTML: TranslationKeyAndTagsToFormattedReactNode) => {
        return getSeverityBreakdownTooltip(severityBreakdownValue, translateHTML, descriptionLink);
      };
    } else if (fallbackTooltipRenderer) {
      tooltipRenderer = fallbackTooltipRenderer;
    }

    const dataPoints = value.dataPoints || [];
    const initialAcc: AnnotationAccumulatorType = {
      annotations: [],
      currentAnnotationStartDate: null,
      currentAnnotationEndDate: null,
    };

    const {
      annotations,
      currentAnnotationStartDate,
      currentAnnotationEndDate,
    }: AnnotationAccumulatorType = dataPoints.reduce((acc, dataPoint) => {
      const { time, value: dataPointValue } = dataPoint;
      if (time === undefined || dataPointValue === undefined) {
        return acc;
      }

      const currentTime = new Date(time);

      if (dataPointValue === 1) {
        return {
          ...acc,
          currentAnnotationStartDate: acc.currentAnnotationStartDate || currentTime,
          currentAnnotationEndDate: currentTime,
        };
      }
      if (dataPointValue === 0 && acc.currentAnnotationStartDate && acc.currentAnnotationEndDate) {
        return {
          annotations: [
            ...acc.annotations,
            {
              id: getAnnotationId(
                breakdownValues,
                acc.currentAnnotationStartDate,
                acc.currentAnnotationEndDate,
              ),
              type: annotationType,
              startUtc: acc.currentAnnotationStartDate,
              endUtc: acc.currentAnnotationEndDate,
              tooltipRenderer,
              severity: severityBreakdownValue?.value || AlertAnnotationSeverity.Info,
              priority,
            },
          ],
          currentAnnotationStartDate: null,
          currentAnnotationEndDate: null,
        };
      }

      return acc;
    }, initialAcc);

    // Handle the case where series ends with 1
    if (currentAnnotationStartDate && currentAnnotationEndDate) {
      annotations.push({
        id: getAnnotationId(breakdownValues, currentAnnotationStartDate, currentAnnotationEndDate),
        type: annotationType,
        startUtc: currentAnnotationStartDate,
        endUtc: currentAnnotationEndDate,
        tooltipRenderer,
        severity: severityBreakdownValue?.value || AlertAnnotationSeverity.Info,
        priority,
      });
    }
    allAnnotations.push(...annotations);
  });

  // remove overlap annotations time
  return removeOverlappedAnnotationsByPriorities(allAnnotations);
};
