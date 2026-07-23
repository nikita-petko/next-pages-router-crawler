import { useMemo, useEffect, useState } from 'react';
import { AnnotationType } from '@modules/clients/analytics';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2MetricWarningsConfig,
  RAQIV2PredefinedWarningCondition,
  RAQIV2PredefinedWarnings,
  RAQIV2UniverseEligibilityCondition,
} from '../constants/RAQIV2PredefinedWarnings';
import useTimeSeriesAnnotations from './useTimeSeriesAnnotations';
import useRAQIV2PredefinedWarningsRenderBundle from './useRAQIV2PredefinedWarningsRenderBundle';
import RAQIV2TableColumnSpec from '../types/RAQIV2TableColumnSpec';
import { useUniverseResource } from './useChartResourceProvider';
import useStatusConfigChartWarning from './useStatusConfigChartWarning';
import { getAtomicMetricsFromMetricLike } from '../types/ComputedMetric';

const useRAQIV2PredefinedWarnings = (chartSpecs: RAQIV2TableColumnSpec[]) => {
  const { id: universeId } = useUniverseResource();
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

  const { resource } = chartSpecs[0];

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
    const checkEligibility = async () => {
      const eligibilityPromises = predefinedWarnings
        .filter((warning) => warning.type === RAQIV2PredefinedWarningCondition.UniverseEligibility)
        .map(async (warning) => {
          try {
            const eligibility = await (
              warning.fetchEligibility as (universeId: number) => Promise<boolean>
            )(universeId);

            if (warning.shownWhen === RAQIV2UniverseEligibilityCondition.NotEligible) {
              return { warningId: warning.warning, showWarning: eligibility === false };
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
      checkEligibility();
    }
  }, [predefinedWarnings, universeId]);

  const effectiveWarnings = useMemo(() => {
    return (
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
            throw new Error(`Unhandled metric name ${exhaustiveCheck}`);
          }
        }
        return acc;
      }, []) ?? []
    );
  }, [predefinedWarnings, timeSeriesAnnotations, chartSpecs, eligibilityResults]);

  const view = useRAQIV2PredefinedWarningsRenderBundle(effectiveWarnings, timeSeriesAnnotations);

  return useMemo(() => [...view, ...statusConfigWarning], [view, statusConfigWarning]);
};

export default useRAQIV2PredefinedWarnings;
