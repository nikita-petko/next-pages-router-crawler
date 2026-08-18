import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { uuidService } from '@rbx/core';
import type { TRAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TRawImpressionEvent, UnifiedLogger } from '@rbx/unified-logger';
import { analyticsChartLoadEventstreamEnabled } from '@generated/flags/creatorAnalytics';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import type { ChartConfigOrPredefinedKey } from '../constants/RAQIV2PredefinedChartConfig';
import { getPredefinedChartKey } from '../constants/RAQIV2PredefinedChartConfig';
import type { ClientCacheStatus } from '../context/AnalyticsQueryGatewayProvider';
import type { MetricLike } from '../types/ComputedMetric';
import {
  getTelemetryMetricNameFromMetricLike,
  getTelemetryMetricNameFromMetricLikes,
} from '../types/ComputedMetric';
import getExpectedChartDataPoints from '../utils/getExpectedChartDataPoints';
import type { ChartLoadComparisonOptions } from '../utils/getExpectedChartDataPoints';

export type ChartLoadRequestStatus = {
  isDataLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
  hasNoData?: boolean;
  error?: Error | null;
  isClassificationReady?: boolean;
  isRequestInFlight?: boolean;
  clientCacheStatus?: ClientCacheStatus;
  getClientCacheStatus?: () => ClientCacheStatus | undefined;
  requestIdentity?: object | string;
  requestVersion?: number;
};

type ChartLoadOutcome =
  | 'success'
  | 'noData'
  | 'interruptedByUiChange'
  | 'unmountWhilePending'
  | 'forbidden'
  | 'responseFailed'
  | 'dependencyFailed'
  | 'dependencyTimeout';

export type ChartLoadDependency = 'translations' | 'highchartsModules' | 'chartRender';

export type ChartDependencyStatus =
  | { dependency: 'highchartsModules'; status: 'pending' | 'ready' }
  | { dependency: 'highchartsModules'; status: 'failed'; error: Error };

export type ChartRenderStatus = Pick<
  ChartLoadRequestStatus,
  | 'clientCacheStatus'
  | 'getClientCacheStatus'
  | 'hasNoData'
  | 'isClassificationReady'
  | 'isDataLoading'
  | 'isResponseFailed'
  | 'isUserForbidden'
>;

export type ChartLoadTelemetryBundle = {
  handleRAQIV2RequestResult: (status: ChartLoadRequestStatus) => void;
  completeChartRender: (status: ChartRenderStatus, target?: string) => void;
  handleChartDependencyStatus: (status: ChartDependencyStatus) => void;
};

type ChartTelemetryMetric = MetricLike<TRAQIV2UIMetric> | readonly MetricLike<TRAQIV2UIMetric>[];

type FlagGatedLoggerState = {
  enabledDecision: boolean | undefined;
  pendingEvents: TRawImpressionEvent[];
  resolutionStarted: boolean;
};

const AnalyticsChartLoadEventType = 'analyticsChartLoad';
const ChartLoadSchemaVersion = 2;
const DefaultRenderTarget = 'chart';
export const ChartDependencyTimeoutMilliseconds = 10_000;
const KnownErrorTypes = new Set(['AbortError', 'NetworkError', 'TimeoutError', 'TypeError']);
const flagGatedLoggerStates = new WeakMap<UnifiedLogger, FlagGatedLoggerState>();

const getOptionalPresetKey = (
  componentKeyOrConfig: ChartConfigOrPredefinedKey | null,
): string | undefined =>
  componentKeyOrConfig === null ? undefined : getPredefinedChartKey(componentKeyOrConfig);

const isMetricList = (
  metric: ChartTelemetryMetric,
): metric is readonly MetricLike<TRAQIV2UIMetric>[] => Array.isArray(metric);

const elapsedMilliseconds = (start: number, end: number): number =>
  Math.max(0, Math.round(end - start));

const getErrorType = (error?: Error | null): string | undefined => {
  if (!error?.name) {
    return undefined;
  }
  return KnownErrorTypes.has(error.name) ? error.name : 'other';
};

const isSuccessfulChartRender = ({
  isClassificationReady = true,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  hasNoData,
}: ChartRenderStatus): boolean =>
  isClassificationReady &&
  !isDataLoading &&
  !isResponseFailed &&
  !isUserForbidden &&
  hasNoData === false;

type ChartLoadAttempt = {
  attemptId: string;
  requestStartedAt: number;
  componentKey?: string;
  universeId?: number;
  metric: string;
  breakdownDimensions: string;
  breakdownDimensionCount: number;
  timeInterval?: string;
  expectedDataPoints: number;
  clientCacheStatus?: ClientCacheStatus;
};

const getFlagGatedLoggerState = (unifiedLogger: UnifiedLogger): FlagGatedLoggerState => {
  const existingState = flagGatedLoggerStates.get(unifiedLogger);
  if (existingState) {
    return existingState;
  }

  const state: FlagGatedLoggerState = {
    enabledDecision: undefined,
    pendingEvents: [],
    resolutionStarted: false,
  };
  flagGatedLoggerStates.set(unifiedLogger, state);
  return state;
};

const logFlagGatedImpressionEvent = (
  unifiedLogger: UnifiedLogger,
  event: TRawImpressionEvent,
): void => {
  const state = getFlagGatedLoggerState(unifiedLogger);
  if (state.enabledDecision === true) {
    unifiedLogger.logImpressionEvent(event);
    return;
  }
  if (state.enabledDecision === false) {
    return;
  }

  state.pendingEvents.push(event);
  if (state.resolutionStarted) {
    return;
  }

  state.resolutionStarted = true;
  // Fail closed if a host or test double supplies an incomplete flags implementation.
  const enabledPromise: Promise<boolean> =
    typeof analyticsChartLoadEventstreamEnabled === 'function'
      ? Promise.resolve(analyticsChartLoadEventstreamEnabled())
      : Promise.resolve(false);
  void enabledPromise
    .then((isEnabled) => {
      state.enabledDecision = isEnabled;
      const pendingEvents = state.pendingEvents;
      state.pendingEvents = [];
      if (isEnabled) {
        pendingEvents.forEach((pendingEvent) => unifiedLogger.logImpressionEvent(pendingEvent));
      }
    })
    .catch(() => {
      state.enabledDecision = false;
      state.pendingEvents = [];
    });
};

/** Emits one terminal EventStream event for each chart load attempt. */
const useChartLoadTelemetry = ({
  metric,
  componentKeyOrConfig,
  breakdown,
  timeSpecs,
  granularity,
  comparison,
  resource,
  timeInterval,
  requiredRenderTargetCount = 1,
}: {
  metric: ChartTelemetryMetric;
  componentKeyOrConfig: ChartConfigOrPredefinedKey | null;
  breakdown?: TRAQIV2Dimension[];
  timeSpecs: readonly TExplicitTimeRangeSpec[];
  granularity: ChartLoadComparisonOptions['granularity'];
  comparison?: ChartLoadComparisonOptions;
  resource: ChartResource;
  timeInterval?: string;
  requiredRenderTargetCount?: number;
}): ChartLoadTelemetryBundle => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const domCommittedAt = useRef<number | undefined>(undefined);
  const terminalEventSent = useRef(false);
  const lastSeenDataLoading = useRef(false);
  const hasSuccessfulRequestResult = useRef(false);
  const hasHighchartsRendered = useRef(false);
  const renderedTargets = useRef(new Set<string>());
  const currentAttempt = useRef<ChartLoadAttempt | undefined>(undefined);
  const lastSeenRequestIdentity = useRef<object | string | undefined>(undefined);
  const lastSeenRequestVersion = useRef<number | undefined>(undefined);
  const highchartsModulesStatus = useRef<'unknown' | 'pending' | 'ready' | 'failed'>('unknown');
  const highchartsModuleFailure = useRef<
    Extract<ChartDependencyStatus, { status: 'failed' }> | undefined
  >(undefined);
  const pendingDependencyFailure = useRef<
    Extract<ChartDependencyStatus, { status: 'failed' }> | undefined
  >(undefined);
  const dependencyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timedDependency = useRef<ChartLoadDependency | undefined>(undefined);
  const universeId = resource.type === ChartResourceType.Universe ? resource.id : undefined;

  const componentKey = getOptionalPresetKey(componentKeyOrConfig);
  const metricName = useMemo(
    () =>
      isMetricList(metric)
        ? getTelemetryMetricNameFromMetricLikes(metric)
        : getTelemetryMetricNameFromMetricLike(metric),
    [metric],
  );
  const normalizedBreakdownDimensions = useMemo(
    () => [...new Set(breakdown ?? [])].sort(),
    [breakdown],
  );
  const breakdownDimensions = normalizedBreakdownDimensions.join(',');
  const expectedDataPoints = useMemo(
    () => getExpectedChartDataPoints({ timeSpecs, granularity, comparison }),
    [comparison, granularity, timeSpecs],
  );
  const attemptMetadata = useMemo(
    () => ({
      componentKey,
      universeId,
      metric: metricName,
      breakdownDimensions,
      breakdownDimensionCount: normalizedBreakdownDimensions.length,
      timeInterval,
      expectedDataPoints,
    }),
    [
      breakdownDimensions,
      componentKey,
      expectedDataPoints,
      metricName,
      normalizedBreakdownDimensions.length,
      timeInterval,
      universeId,
    ],
  );
  const attemptMetadataRef = useRef(attemptMetadata);

  useLayoutEffect(() => {
    attemptMetadataRef.current = attemptMetadata;
  }, [attemptMetadata]);

  const clearDependencyTimeout = useCallback(() => {
    if (dependencyTimeout.current !== undefined) {
      clearTimeout(dependencyTimeout.current);
      dependencyTimeout.current = undefined;
    }
    timedDependency.current = undefined;
  }, []);

  const beginAttempt = useCallback(
    (startedAt = performance.now()) => {
      clearDependencyTimeout();
      terminalEventSent.current = false;
      hasSuccessfulRequestResult.current = false;
      hasHighchartsRendered.current = false;
      renderedTargets.current.clear();
      pendingDependencyFailure.current = highchartsModuleFailure.current;
      currentAttempt.current = {
        ...attemptMetadataRef.current,
        attemptId: uuidService.generateRandomUuid(),
        requestStartedAt: startedAt,
      };
    },
    [clearDependencyTimeout],
  );

  useLayoutEffect(() => {
    const committedAt = performance.now();
    domCommittedAt.current = committedAt;
    beginAttempt(committedAt);
  }, [beginAttempt]);

  const emitTerminalEvent = useCallback(
    (
      outcome: ChartLoadOutcome,
      options?: { error?: Error | null; blockedOn?: ChartLoadDependency },
    ) => {
      clearDependencyTimeout();
      if (terminalEventSent.current) {
        return;
      }
      terminalEventSent.current = true;
      const completedAt = performance.now();
      const attempt: ChartLoadAttempt = currentAttempt.current ?? {
        ...attemptMetadataRef.current,
        attemptId: uuidService.generateRandomUuid(),
        requestStartedAt: completedAt,
      };
      const errorType = getErrorType(options?.error);
      logFlagGatedImpressionEvent(unifiedLogger, {
        eventName: AnalyticsChartLoadEventType,
        parameters: {
          schemaVersion: String(ChartLoadSchemaVersion),
          attemptId: attempt.attemptId,
          outcome,
          requestDurationMs: String(elapsedMilliseconds(attempt.requestStartedAt, completedAt)),
          ...(domCommittedAt.current === undefined
            ? {}
            : {
                domDurationMs: String(elapsedMilliseconds(domCommittedAt.current, completedAt)),
              }),
          ...(attempt.componentKey === undefined ? {} : { componentKey: attempt.componentKey }),
          ...(attempt.universeId === undefined ? {} : { universeId: String(attempt.universeId) }),
          metric: attempt.metric,
          breakdownDimensions: attempt.breakdownDimensions,
          breakdownDimensionCount: String(attempt.breakdownDimensionCount),
          ...(attempt.timeInterval === undefined ? {} : { timeInterval: attempt.timeInterval }),
          expectedDataPoints: String(attempt.expectedDataPoints),
          ...(attempt.clientCacheStatus === undefined
            ? {}
            : { clientCacheStatus: attempt.clientCacheStatus }),
          ...(options?.blockedOn === undefined ? {} : { blockedOn: options.blockedOn }),
          ...(errorType === undefined ? {} : { errorType }),
        },
      });
    },
    [clearDependencyTimeout, unifiedLogger],
  );
  const emitTerminalEventRef = useRef(emitTerminalEvent);

  useLayoutEffect(() => {
    emitTerminalEventRef.current = emitTerminalEvent;
  }, [emitTerminalEvent]);

  const startDependencyTimeout = useCallback(
    (blockedOn: ChartLoadDependency) => {
      if (dependencyTimeout.current !== undefined && timedDependency.current === blockedOn) {
        return;
      }
      clearDependencyTimeout();
      timedDependency.current = blockedOn;
      dependencyTimeout.current = setTimeout(() => {
        emitTerminalEvent('dependencyTimeout', { blockedOn });
      }, ChartDependencyTimeoutMilliseconds);
    },
    [clearDependencyTimeout, emitTerminalEvent],
  );

  const completeChartRender = useCallback(
    (status: ChartRenderStatus, target = DefaultRenderTarget) => {
      if (!isSuccessfulChartRender(status)) {
        return;
      }
      const clientCacheStatus = status.clientCacheStatus ?? status.getClientCacheStatus?.();
      if (clientCacheStatus !== undefined && currentAttempt.current !== undefined) {
        currentAttempt.current.clientCacheStatus = clientCacheStatus;
      }
      renderedTargets.current.add(target);
      if (renderedTargets.current.size < requiredRenderTargetCount) {
        return;
      }
      hasHighchartsRendered.current = true;
      clearDependencyTimeout();
      if (hasSuccessfulRequestResult.current) {
        emitTerminalEvent('success');
      }
    },
    [clearDependencyTimeout, emitTerminalEvent, requiredRenderTargetCount],
  );

  const handleChartDependencyStatus = useCallback(
    (status: ChartDependencyStatus) => {
      if (status.status === 'failed') {
        if (terminalEventSent.current) {
          return;
        }
        highchartsModulesStatus.current = 'failed';
        highchartsModuleFailure.current = status;
        pendingDependencyFailure.current = status;
        if (!hasSuccessfulRequestResult.current) {
          return;
        }
        emitTerminalEvent('dependencyFailed', {
          blockedOn: status.dependency,
          error: status.error,
        });
        return;
      }

      highchartsModulesStatus.current = status.status;
      if (status.status === 'ready') {
        highchartsModuleFailure.current = undefined;
      }
      if (!hasSuccessfulRequestResult.current || hasHighchartsRendered.current) {
        return;
      }
      startDependencyTimeout(status.status === 'pending' ? 'highchartsModules' : 'chartRender');
    },
    [emitTerminalEvent, startDependencyTimeout],
  );

  const handleRAQIV2RequestResult = useCallback(
    ({
      isDataLoading,
      isUserForbidden,
      isResponseFailed,
      hasNoData,
      error,
      isClassificationReady = true,
      isRequestInFlight = isDataLoading,
      clientCacheStatus,
      getClientCacheStatus,
      requestIdentity,
      requestVersion,
    }: ChartLoadRequestStatus) => {
      let beganAttempt = false;
      if (requestIdentity !== undefined) {
        const isReplacementRequest =
          lastSeenRequestIdentity.current !== undefined &&
          lastSeenRequestIdentity.current !== requestIdentity;
        const isCacheOnlyReplacement =
          isReplacementRequest &&
          !isRequestInFlight &&
          !isDataLoading &&
          (clientCacheStatus ?? getClientCacheStatus?.()) === 'hit';
        if (
          isReplacementRequest &&
          (isRequestInFlight || !terminalEventSent.current || isCacheOnlyReplacement)
        ) {
          if (!terminalEventSent.current) {
            emitTerminalEvent('interruptedByUiChange');
          }
          beginAttempt();
          beganAttempt = true;
        }
        lastSeenRequestIdentity.current = requestIdentity;
      }

      if (requestVersion !== undefined) {
        if (
          lastSeenRequestVersion.current !== undefined &&
          lastSeenRequestVersion.current !== requestVersion
        ) {
          if (terminalEventSent.current) {
            beginAttempt();
            beganAttempt = true;
          }
        }
        lastSeenRequestVersion.current = requestVersion;
      }

      if (
        !beganAttempt &&
        (currentAttempt.current === undefined || terminalEventSent.current) &&
        !lastSeenDataLoading.current &&
        isRequestInFlight
      ) {
        beginAttempt();
      }
      lastSeenDataLoading.current = isRequestInFlight;
      const resolvedClientCacheStatus = clientCacheStatus ?? getClientCacheStatus?.();
      if (resolvedClientCacheStatus !== undefined && currentAttempt.current !== undefined) {
        currentAttempt.current.clientCacheStatus = resolvedClientCacheStatus;
      }

      if (isDataLoading || isRequestInFlight) {
        clearDependencyTimeout();
        return;
      }
      if (isUserForbidden) {
        emitTerminalEvent('forbidden', { error });
      } else if (isResponseFailed) {
        emitTerminalEvent('responseFailed', { error });
      } else if (!isClassificationReady) {
        startDependencyTimeout('translations');
      } else if (hasNoData) {
        emitTerminalEvent('noData');
      } else if (hasNoData === false) {
        hasSuccessfulRequestResult.current = true;
        const dependencyFailure = pendingDependencyFailure.current;
        if (dependencyFailure !== undefined) {
          emitTerminalEvent('dependencyFailed', {
            blockedOn: dependencyFailure.dependency,
            error: dependencyFailure.error,
          });
        } else if (hasHighchartsRendered.current) {
          emitTerminalEvent('success');
        } else {
          startDependencyTimeout(
            highchartsModulesStatus.current === 'pending' ? 'highchartsModules' : 'chartRender',
          );
        }
      }
    },
    [beginAttempt, clearDependencyTimeout, emitTerminalEvent, startDependencyTimeout],
  );

  useLayoutEffect(() => {
    return () => {
      emitTerminalEventRef.current('unmountWhilePending');
    };
  }, []);

  return useMemo(
    () => ({
      completeChartRender,
      handleChartDependencyStatus,
      handleRAQIV2RequestResult,
    }),
    [completeChartRender, handleChartDependencyStatus, handleRAQIV2RequestResult],
  );
};

export default useChartLoadTelemetry;
