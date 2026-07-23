import { useMemo, useEffect, useState } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { AnnotationType } from '@modules/clients/analytics';
import type { RAQIV2PredefinedWarnings } from '../constants/RAQIV2PredefinedWarnings';
import {
  RAQIV2MetricWarningsConfig,
  RAQIV2PredefinedWarningCondition,
  RAQIV2UniverseEligibilityCondition,
} from '../constants/RAQIV2PredefinedWarnings';
import { getAtomicMetricsFromMetricLike } from '../types/ComputedMetric';
import type RAQIV2TableColumnSpec from '../types/RAQIV2TableColumnSpec';
import useRAQIV2PredefinedWarningsRenderBundle from './useRAQIV2PredefinedWarningsRenderBundle';
import useStatusConfigChartWarning from './useStatusConfigChartWarning';
import useTimeSeriesAnnotations from './useTimeSeriesAnnotations';

const useRAQIV2PredefinedWarnings = (chartSpecs: RAQIV2TableColumnSpec[]) => {
  const { resource } = chartSpecs[0];
  // status-config endpoint and UniverseEligibility checks are universe-scoped.
  // Derive the universe id from the chart's own resource so non-universe charts
  // (e.g. Group charts on the Community Tab) don't accidentally forward a non-universe id.
  const universeId = resource.type === ChartResourceType.Universe ? resource.id : undefined;
  const warningMetrics = useMemo(
    () => [...new Set(chartSpecs.flatMap((spec) => getAtomicMetricsFromMetricLike(spec.metric)))],
    [chartSpecs],
  );
  const statusConfigWarning = useStatusConfigChartWarning(warningMetrics, universeId);

  const [eligibilityResults, setEligibilityResults] = useState<
    Map<RAQIV2PredefinedWarnings, boolean>
  >(new Map());

  const predefinedWarnings = useMemo(
    () => [
      ...new Set(warningMetrics.flatMap((metric) => RAQIV2MetricWarningsConfig.get(metric) ?? [])),
    ],
    [warningMetrics],
  );

  const annotationTypes = useMemo(
    () =>
      predefinedWarnings.reduce((acc: AnnotationType[], warning) => {
        if (warning.type === RAQIV2PredefinedWarningCondition.HasAnnotation) {
          acc.push(warning.annotationType);
        }
        return acc;
      }, []) ?? [],
    [predefinedWarnings],
  );
  const uniqueAnnotationTypes = useMemo(() => [...new Set(annotationTypes)], [annotationTypes]);

  // Special case where we need to specify the funnel name for step name change warnings
  const funnelName = useMemo(
    () => chartSpecs[0].filter?.find((f) => f.dimension === RAQIV2Dimension.FunnelName)?.values[0],
    [chartSpecs],
  );

  const { timeSeriesAnnotations } = useTimeSeriesAnnotations({
    resource,
    funnelName,
    annotationTypes: uniqueAnnotationTypes,
    startUtc: chartSpecs[0].timeSpec.startTime,
    endUtc: chartSpecs[0].timeSpec.endTime,
  });

  // Handle async eligibility checks
  useEffect(() => {
    if (universeId === undefined) {
      // UniverseEligibility checks are universe-scoped; skip for non-universe resources.
      return;
    }

    const checkEligibility = async () => {
      const eligibilityPromises = predefinedWarnings
        .filter((warning) => warning.type === RAQIV2PredefinedWarningCondition.UniverseEligibility)
        .map(async (warning) => {
          try {
            const eligibility = await warning.fetchEligibility(universeId);

            if (warning.shownWhen === RAQIV2UniverseEligibilityCondition.NotEligible) {
              return { warningId: warning.warning, showWarning: eligibility !== true };
            }

            return { warningId: warning.warning, showWarning: eligibility === true };
          } catch {
            return { warningId: warning.warning, showWarning: false };
          }
        });

      const results = await Promise.all(eligibilityPromises);
      const newEligibilityResults = new Map<RAQIV2PredefinedWarnings, boolean>();
      results.forEach(({ warningId, showWarning }) => {
        newEligibilityResults.set(warningId, showWarning);
      });
      setEligibilityResults(newEligibilityResults);
    };

    if (
      predefinedWarnings.some(
        (warning) => warning.type === RAQIV2PredefinedWarningCondition.UniverseEligibility,
      )
    ) {
      void checkEligibility();
    }
  }, [predefinedWarnings, universeId]);

  const effectiveWarnings = useMemo(() => {
    const warnings =
      predefinedWarnings.reduce((acc: RAQIV2PredefinedWarnings[], warning) => {
        const warningType = warning.type;
        switch (warningType) {
          case RAQIV2PredefinedWarningCondition.Always:
            acc.push(warning.warning);
            break;
          case RAQIV2PredefinedWarningCondition.HasAnnotation: {
            const hasAnnotation = timeSeriesAnnotations?.some((annotation) => {
              return annotation.type === warning.annotationType;
            });
            if (hasAnnotation) {
              acc.push(warning.warning);
            }
            break;
          }
          case RAQIV2PredefinedWarningCondition.HasFilterOnSpecificValue: {
            const matchesFilter = chartSpecs.some((spec) => {
              return spec.filter?.some(
                (f) =>
                  f.dimension === warning.filter.dimension &&
                  warning.filter.values.some((value) => f.values.some((x) => x === value)),
              );
            });
            if (matchesFilter) {
              acc.push(warning.warning);
            }
            break;
          }
          case RAQIV2PredefinedWarningCondition.UniverseEligibility: {
            const showWarning = eligibilityResults.get(warning.warning);
            if (showWarning) {
              acc.push(warning.warning);
            }
            break;
          }
          default: {
            const exhaustiveCheck: never = warningType;
            void exhaustiveCheck;
            throw new Error('Unhandled metric name');
          }
        }
        return acc;
      }, []) ?? [];

    return [...new Set(warnings)];
  }, [predefinedWarnings, timeSeriesAnnotations, chartSpecs, eligibilityResults]);

  const view = useRAQIV2PredefinedWarningsRenderBundle(effectiveWarnings, timeSeriesAnnotations);

  return useMemo(() => [...view, ...statusConfigWarning], [view, statusConfigWarning]);
};

export default useRAQIV2PredefinedWarnings;
