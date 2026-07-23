import { TRAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { startInactiveSpan, Span } from '@sentry/nextjs';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { AnalyticsComponentConfig } from '../types/RAQIV2PageConfig';
import type { MetricLike } from '../types/ComputedMetric';
import { getSentryMetricNameFromMetricLike } from '../types/ComputedMetric';

type RAQIV2RequestStatus = {
  isDataLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
  isNoDataAvailable?: boolean;
};

export type SentryChartSpanBundle = {
  /** This callback should be used when the data begins loading for the component */
  startDataLoading: () => void;
  handleRAQIV2RequestResult: ({
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    isNoDataAvailable,
  }: RAQIV2RequestStatus) => void;
  completeDataLoading: () => void;
  completeChartWithSuccessfulHighchartsRender: () => void;
  completeChartWithUnmountWhilePending: () => void;
  completeChartWithForbidden: () => void;
  completeChartWithResponseFailed: () => void;
  completeChartWithNoData: () => void;
};

const getOptionalPresetKey = (
  componentKeyOrConfig: AnalyticsComponentConfig | null,
): string | undefined => {
  if (typeof componentKeyOrConfig === 'string' || !componentKeyOrConfig) {
    return componentKeyOrConfig ?? undefined;
  }

  switch (componentKeyOrConfig.type) {
    case AnalyticsComponentType.Chart:
    case AnalyticsComponentType.TabbedChart:
      return componentKeyOrConfig.chartKey;
    case AnalyticsComponentType.Table:
    case AnalyticsComponentType.TabbedTable:
      return componentKeyOrConfig.tableKey;
    case AnalyticsComponentType.SummaryCard:
      return componentKeyOrConfig.summaryKey;
    case AnalyticsComponentType.ControlledSubcontext:
    case AnalyticsComponentType.NonGeneric:
      return undefined;
    default: {
      const exhaustiveCheck: never = componentKeyOrConfig;
      throw new Error(`Unknown component type: ${exhaustiveCheck}`);
    }
  }
};

const pageComponentNum = 0;

/**
 * This hook returns a bundle of callbacks that can be used to instrument
 * performance monitoring at a per-component level using Sentry.
 */
const useSentryChartTracers = ({
  metric,
  componentKeyOrConfig,
  breakdown,
  numExpectedPoints,
  parentSpan,
}: {
  metric: MetricLike<TRAQIV2UIMetric>;
  componentKeyOrConfig: AnalyticsComponentConfig | null;
  breakdown?: TRAQIV2Dimension[];
  numExpectedPoints: number;
  parentSpan?: Span;
}): SentryChartSpanBundle => {
  const componentSpan = useRef<Span | null>(null);
  const dataLoadingSpan = useRef<Span | null>(null);
  const lastSeenDataLoading = useRef(false);

  const { sentryChartTracingEnabled } = useFeatureFlagsForNamespace(
    'sentryChartTracingEnabled',
    FeatureFlagNamespace.Analytics,
  );

  // We don't use getUniqueKeyForAnalyticsComponent here because we only want to log if it is a preset key
  const componentKey = getOptionalPresetKey(componentKeyOrConfig);
  const sentryMetricName = useMemo(() => getSentryMetricNameFromMetricLike(metric), [metric]);

  const attributes = useMemo(
    () => ({
      metric: sentryMetricName,
      componentKey,
      breakdown,
      numExpectedPoints,
      pageComponentNum,
      sentryTracingEnabled: sentryChartTracingEnabled,
    }),
    [breakdown, componentKey, sentryMetricName, numExpectedPoints, sentryChartTracingEnabled],
  );

  const startDataLoading = useCallback(() => {
    if (sentryChartTracingEnabled) {
      dataLoadingSpan.current = startInactiveSpan({
        name: 'Chart Component Data Loading',
        op: 'loading',
        parentSpan: componentSpan.current,
        attributes: { ...attributes },
      });
    }
  }, [attributes, sentryChartTracingEnabled]);

  const maybeEndComponentSpan = useCallback(() => {
    // NOTE(gperkins@20241126): Expect this to be read by the brower tracing integration's
    //  tracesSampler function in sentry.client.config.js
    componentSpan.current?.setAttribute('sentryTracingEnabled', sentryChartTracingEnabled);
    if (componentSpan.current?.isRecording()) {
      componentSpan.current?.end();
    }
  }, [sentryChartTracingEnabled]);

  const completeDataLoading = useCallback(() => {
    dataLoadingSpan.current?.setAttribute('completion', 'complete');
    if (dataLoadingSpan.current?.isRecording()) {
      dataLoadingSpan.current?.end();
    }
  }, []);
  const completeChartWithSuccessfulHighchartsRender = useCallback(() => {
    componentSpan.current?.setAttribute('completion', 'highchartsSuccess');
    maybeEndComponentSpan();
  }, [maybeEndComponentSpan]);
  const completeChartWithUnmountWhilePending = useCallback(() => {
    componentSpan.current?.setAttribute('completion', 'unmountWhilePending');
    maybeEndComponentSpan();
  }, [maybeEndComponentSpan]);
  const completeChartWithForbidden = useCallback(() => {
    componentSpan.current?.setAttribute('completion', 'forbidden');
    maybeEndComponentSpan();
  }, [maybeEndComponentSpan]);
  const completeChartWithResponseFailed = useCallback(() => {
    componentSpan.current?.setAttribute('completion', 'responseFailed');
    maybeEndComponentSpan();
  }, [maybeEndComponentSpan]);
  const completeChartWithNoData = useCallback(() => {
    componentSpan.current?.setAttribute('completion', 'noData');
    maybeEndComponentSpan();
  }, [maybeEndComponentSpan]);

  const handleRAQIV2RequestResult = useCallback(
    ({
      isDataLoading,
      isUserForbidden,
      isResponseFailed,
      isNoDataAvailable,
    }: RAQIV2RequestStatus) => {
      if (!componentSpan.current?.isRecording()) {
        return;
      }

      if (
        !lastSeenDataLoading.current &&
        isDataLoading &&
        !dataLoadingSpan.current?.isRecording()
      ) {
        startDataLoading();
      } else if (!isDataLoading) {
        completeDataLoading();
      }
      lastSeenDataLoading.current = isDataLoading;

      if (isUserForbidden) {
        completeChartWithForbidden();
      } else if (isNoDataAvailable) {
        completeChartWithNoData();
      } else if (isResponseFailed) {
        completeChartWithResponseFailed();
      }
    },
    [
      completeChartWithForbidden,
      completeChartWithNoData,
      completeChartWithResponseFailed,
      completeDataLoading,
      startDataLoading,
    ],
  );

  useEffect(() => {
    if (!componentSpan.current && sentryChartTracingEnabled) {
      const spanComponentName = componentKey ?? 'Unknown';
      componentSpan.current = startInactiveSpan({
        name: `Chart Component (${spanComponentName}) Render`,
        op: 'component',
        attributes: { ...attributes },
        parentSpan,
      });
    }

    return () => {
      if (dataLoadingSpan.current?.isRecording()) {
        dataLoadingSpan.current.setAttribute('completion', 'unmountWhilePending');
        dataLoadingSpan.current.end();
      }
      completeChartWithUnmountWhilePending();
    };
  }, [
    attributes,
    breakdown,
    completeChartWithUnmountWhilePending,
    componentKey,
    sentryMetricName,
    numExpectedPoints,
    parentSpan,
    sentryChartTracingEnabled,
  ]);

  return {
    startDataLoading,
    completeDataLoading,
    completeChartWithSuccessfulHighchartsRender,
    completeChartWithUnmountWhilePending,
    completeChartWithForbidden,
    completeChartWithResponseFailed,
    completeChartWithNoData,
    handleRAQIV2RequestResult,
  };
};
export default useSentryChartTracers;
