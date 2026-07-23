import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type AnalyticsNavigationItem,
  AnalyticsQueryParams,
  AnalyticsExploreModeProvider,
  getAnalyticsNavigationItemFromPath,
} from '@modules/charts-generic';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import emptyFunction from '../constants/emptyFunction';
import { type TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { ComputedMetric, MetricLike } from '../types/ComputedMetric';
import { serializeComputedMetricToQueryParam } from '../types/ComputedMetricQueryParam';
import {
  type FormulaAstNode,
  parseComputedMetricFormula,
} from '../utils/computedMetrics/parseComputedMetricFormula';
import {
  type TExploreModeMetrics,
  getAllExploreModeMetrics,
  isExploreModeMetric,
} from './exploreModeMetricsConfig';
import resolveExploreModeQueryState, {
  isComputedMetricAllowedForExploreMode,
} from './resolveExploreModeQueryState';
import {
  isCentralizedPredefinedChartKey,
  TRAQIV2PredefinedChartKey,
} from '../constants/RAQIV2PredefinedChartConfig';

type TMetric = TExploreModeMetrics | null;
type TSetMetric = (nextMetric: TMetric) => void;
type TExperienceAnalyticsExploreModeContext = {
  priorUri: string | null;
  priorPage: AnalyticsNavigationItem | null;
  preset: TRAQIV2PredefinedChartKey | null;
  metric: TMetric;
  allowedMetrics: readonly TExploreModeMetrics[];
  enableComputedMetrics: boolean;
  setMetric: TSetMetric;
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null;
  setComputedMetric: (cm: ComputedMetric<TRAQIV2NumericUIMetric> | null) => void;
  executionMetric: MetricLike<TRAQIV2NumericUIMetric> | null;
  hasInvalidMetricQueryParam: boolean;
  hasInvalidComputedMetricQueryParam: boolean;
  l7SmoothingFromUrl: boolean;
};

const ExperienceAnalyticsExploreModeContext = createContext<TExperienceAnalyticsExploreModeContext>(
  {
    preset: null,
    priorUri: null,
    priorPage: null,
    metric: null,
    allowedMetrics: getAllExploreModeMetrics(),
    enableComputedMetrics: false,
    setMetric: emptyFunction,
    computedMetric: null,
    setComputedMetric: emptyFunction,
    executionMetric: null,
    hasInvalidMetricQueryParam: false,
    hasInvalidComputedMetricQueryParam: false,
    l7SmoothingFromUrl: false,
  },
);

const exploreModeKeys = [
  AnalyticsQueryParams.Metric,
  AnalyticsQueryParams.Preset,
  AnalyticsQueryParams.Referrer,
  AnalyticsQueryParams.ComputedMetric,
  AnalyticsQueryParams.Overlays,
  AnalyticsQueryParams.OverlayBenchmarkType,
] as const;
const ComputedMetricUrlSyncDebounceMs = 500;

const getIdentitySourceKeyFromFormulaAst = (node: FormulaAstNode): string | null => {
  if (node.type === 'identifier') {
    return node.name;
  }
  if (node.type === 'number') {
    return null;
  }
  if (node.operator === '/' && node.right.type === 'number' && node.right.value === 1) {
    return getIdentitySourceKeyFromFormulaAst(node.left);
  }
  if (node.operator === '*' && node.left.type === 'number' && node.left.value === 1) {
    return getIdentitySourceKeyFromFormulaAst(node.right);
  }
  if (node.operator === '*' && node.right.type === 'number' && node.right.value === 1) {
    return getIdentitySourceKeyFromFormulaAst(node.left);
  }
  if (node.operator === '+' && node.left.type === 'number' && node.left.value === 0) {
    return getIdentitySourceKeyFromFormulaAst(node.right);
  }
  if (node.operator === '+' && node.right.type === 'number' && node.right.value === 0) {
    return getIdentitySourceKeyFromFormulaAst(node.left);
  }
  if (node.operator === '-' && node.right.type === 'number' && node.right.value === 0) {
    return getIdentitySourceKeyFromFormulaAst(node.left);
  }
  return null;
};

const getIdentityMetricFromComputedMetric = (
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric>,
): TExploreModeMetrics | null => {
  const parseResult = parseComputedMetricFormula(
    computedMetric.formula,
    computedMetric.sources.map((source) => source.key),
  );
  if (!parseResult.ok) {
    return null;
  }
  const identitySourceKey = getIdentitySourceKeyFromFormulaAst(parseResult.ast);
  if (!identitySourceKey) {
    return null;
  }
  const identitySourceMetric = computedMetric.sources.find(
    (source) => source.key === identitySourceKey,
  )?.metric;
  return identitySourceMetric && isExploreModeMetric(identitySourceMetric)
    ? identitySourceMetric
    : null;
};

const usePreviousUriIfValidAndRemoveQueryParams = (
  queryReferrer: string | string[] | null | undefined,
  queryPreset: string | string[] | null | undefined,
): Pick<TExperienceAnalyticsExploreModeContext, 'preset' | 'priorUri' | 'priorPage'> & {
  clearPreset: () => void;
} => {
  const [validUri, setValidUri] = useState<string | null>(null);
  const [validPage, setValidPage] = useState<AnalyticsNavigationItem | null>(null);
  const [validPreset, setValidPreset] = useState<TRAQIV2PredefinedChartKey | null>(null);
  const [, setQueryParams] = useQueryParams(exploreModeKeys);
  useEffect(() => {
    let needsClear = false;
    if (typeof queryReferrer === 'string') {
      needsClear = true;
      const decodedUri = atob(queryReferrer);
      const navItem = decodedUri ? getAnalyticsNavigationItemFromPath(decodedUri) : undefined;
      if (navItem) {
        setValidUri(decodedUri);
        setValidPage(navItem);
      }
    }
    if (typeof queryPreset === 'string') {
      needsClear = true;
      if (isCentralizedPredefinedChartKey(queryPreset)) {
        setValidPreset(queryPreset);
      }
    }
    if (needsClear) {
      setQueryParams(
        { [AnalyticsQueryParams.Referrer]: null, [AnalyticsQueryParams.Preset]: null },
        { skipHistory: true },
      );
    }
  }, [queryPreset, queryReferrer, setQueryParams]);

  const clearPreset = useCallback(() => {
    setValidPreset(null);
  }, []);

  return { priorUri: validUri, priorPage: validPage, preset: validPreset, clearPreset };
};

type ExperienceAnalyticsExploreModeContextProviderProps = PropsWithChildren<{
  enableComputedMetrics?: boolean;
  enableL7Smoothing?: boolean;
  allowedMetrics?: readonly TExploreModeMetrics[];
  featureFlagsFetched?: boolean;
}>;

const ExperienceAnalyticsExploreModeContextProvider: FC<
  ExperienceAnalyticsExploreModeContextProviderProps
> = ({
  children,
  enableComputedMetrics = false,
  enableL7Smoothing = false,
  allowedMetrics = getAllExploreModeMetrics(),
  featureFlagsFetched = true,
}) => {
  const [
    {
      [AnalyticsQueryParams.Metric]: queryMetric,
      [AnalyticsQueryParams.Preset]: queryPreset,
      [AnalyticsQueryParams.Referrer]: queryReferrer,
      [AnalyticsQueryParams.ComputedMetric]: queryComputedMetric,
    },
    setQueryParams,
  ] = useQueryParams(exploreModeKeys);

  const { priorUri, priorPage, preset, clearPreset } = usePreviousUriIfValidAndRemoveQueryParams(
    queryReferrer,
    queryPreset,
  );
  const queryStateResolution = useMemo(
    () =>
      resolveExploreModeQueryState({
        queryMetric,
        queryComputedMetric,
        allowedMetrics,
        enableComputedMetrics,
        enableL7Smoothing,
        featureFlagsFetched,
      }),
    [
      allowedMetrics,
      enableComputedMetrics,
      enableL7Smoothing,
      featureFlagsFetched,
      queryComputedMetric,
      queryMetric,
    ],
  );
  const {
    metric,
    computedMetric: computedMetricFromQuery,
    hasInvalidMetricQueryParam: hasInvalidMetricQueryParamFromQuery,
    hasInvalidComputedMetricQueryParam: hasInvalidComputedMetricQueryParamFromQuery,
    cleanupQueryParams,
    l7SmoothingFromUrl,
  } = queryStateResolution;

  const [hasInvalidMetricQueryParam, setHasInvalidMetricQueryParam] = useState<boolean>(
    () => hasInvalidMetricQueryParamFromQuery,
  );

  const [computedMetricState, setComputedMetricState] =
    useState<ComputedMetric<TRAQIV2NumericUIMetric> | null>(() => {
      return enableComputedMetrics ? computedMetricFromQuery : null;
    });
  const [hasInvalidComputedMetricQueryParam, setHasInvalidComputedMetricQueryParam] =
    useState<boolean>(() => hasInvalidComputedMetricQueryParamFromQuery);
  const lastRegularMetricRef = useRef<TMetric>(metric);
  const pendingComputedMetricUrlSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingComputedMetricUrlSync = useCallback(() => {
    if (pendingComputedMetricUrlSyncRef.current) {
      clearTimeout(pendingComputedMetricUrlSyncRef.current);
      pendingComputedMetricUrlSyncRef.current = null;
    }
  }, []);

  const setMetric = useCallback(
    (nextMetric: TMetric) => {
      const sanitizedNextMetric =
        nextMetric && isValidArrayEnumValue(allowedMetrics, nextMetric) ? nextMetric : null;
      clearPreset();
      clearPendingComputedMetricUrlSync();
      setHasInvalidMetricQueryParam(false);
      setHasInvalidComputedMetricQueryParam(false);
      if (sanitizedNextMetric) {
        lastRegularMetricRef.current = sanitizedNextMetric;
      }
      if (enableComputedMetrics) {
        setComputedMetricState(null);
        setQueryParams({
          [AnalyticsQueryParams.Metric]: sanitizedNextMetric,
          [AnalyticsQueryParams.ComputedMetric]: null,
        });
        return;
      }
      setQueryParams({
        [AnalyticsQueryParams.Metric]: sanitizedNextMetric,
      });
    },
    [
      clearPendingComputedMetricUrlSync,
      clearPreset,
      enableComputedMetrics,
      allowedMetrics,
      setQueryParams,
    ],
  );

  const setComputedMetric = useCallback(
    (cm: ComputedMetric<TRAQIV2NumericUIMetric> | null) => {
      clearPendingComputedMetricUrlSync();
      if (!enableComputedMetrics) {
        setComputedMetricState(null);
        if (featureFlagsFetched && typeof queryComputedMetric === 'string') {
          setQueryParams({ [AnalyticsQueryParams.ComputedMetric]: null }, { skipHistory: true });
        }
        return;
      }
      clearPreset();
      setHasInvalidMetricQueryParam(false);
      if (!cm) {
        setHasInvalidComputedMetricQueryParam(false);
        const identityMetric = computedMetricState
          ? getIdentityMetricFromComputedMetric(computedMetricState)
          : null;
        const restoredMetricCandidate = identityMetric ?? lastRegularMetricRef.current ?? null;
        const restoredMetric =
          restoredMetricCandidate && isValidArrayEnumValue(allowedMetrics, restoredMetricCandidate)
            ? restoredMetricCandidate
            : null;
        setComputedMetricState(null);
        setQueryParams(
          {
            [AnalyticsQueryParams.Metric]: restoredMetric,
            [AnalyticsQueryParams.ComputedMetric]: null,
          },
          { skipHistory: true },
        );
        return;
      }
      if (
        !isComputedMetricAllowedForExploreMode({
          computedMetric: cm,
          allowedMetrics,
        })
      ) {
        setHasInvalidComputedMetricQueryParam(true);
        setComputedMetricState(null);
        setQueryParams({ [AnalyticsQueryParams.ComputedMetric]: null }, { skipHistory: true });
        return;
      }
      setHasInvalidComputedMetricQueryParam(false);
      if (metric) {
        lastRegularMetricRef.current = metric;
      }
      setComputedMetricState(cm);
      const encodedMetric = cm ? serializeComputedMetricToQueryParam(cm) : null;
      const currentEncodedMetric =
        typeof queryComputedMetric === 'string' ? queryComputedMetric : null;
      // Avoid redundant router.replace calls that can trigger history throttling.
      if (encodedMetric === currentEncodedMetric) {
        return;
      }
      pendingComputedMetricUrlSyncRef.current = setTimeout(() => {
        pendingComputedMetricUrlSyncRef.current = null;
        setQueryParams(
          {
            [AnalyticsQueryParams.Metric]: null,
            [AnalyticsQueryParams.ComputedMetric]: encodedMetric,
          },
          { skipHistory: true },
        );
      }, ComputedMetricUrlSyncDebounceMs);
    },
    [
      clearPendingComputedMetricUrlSync,
      clearPreset,
      computedMetricState,
      enableComputedMetrics,
      metric,
      queryComputedMetric,
      allowedMetrics,
      setQueryParams,
      featureFlagsFetched,
    ],
  );

  useEffect(() => {
    return () => {
      clearPendingComputedMetricUrlSync();
    };
  }, [clearPendingComputedMetricUrlSync]);

  const executionMetric: MetricLike<TRAQIV2NumericUIMetric> | null = useMemo(() => {
    if (enableComputedMetrics && computedMetricState) {
      return computedMetricState;
    }
    return metric;
  }, [computedMetricState, enableComputedMetrics, metric]);

  useEffect(() => {
    if (metric) {
      lastRegularMetricRef.current = metric;
    }
  }, [metric]);

  useEffect(() => {
    if (!cleanupQueryParams) {
      return;
    }
    setQueryParams(cleanupQueryParams, { skipHistory: true });
  }, [cleanupQueryParams, setQueryParams]);

  useEffect(() => {
    if (!enableComputedMetrics) {
      setComputedMetricState(null);
      return;
    }
    if (pendingComputedMetricUrlSyncRef.current) {
      return;
    }
    const nextComputedMetric = computedMetricFromQuery;
    setComputedMetricState((previous) => {
      const previousEncoded = previous ? serializeComputedMetricToQueryParam(previous) : null;
      const nextEncoded = nextComputedMetric
        ? serializeComputedMetricToQueryParam(nextComputedMetric)
        : null;
      return previousEncoded === nextEncoded ? previous : nextComputedMetric;
    });
  }, [enableComputedMetrics, computedMetricFromQuery]);

  useEffect(() => {
    if (hasInvalidMetricQueryParamFromQuery) {
      setHasInvalidMetricQueryParam(true);
    }
  }, [hasInvalidMetricQueryParamFromQuery]);

  useEffect(() => {
    if (hasInvalidComputedMetricQueryParamFromQuery) {
      setHasInvalidComputedMetricQueryParam(true);
    }
  }, [hasInvalidComputedMetricQueryParamFromQuery]);

  useEffect(() => {
    if (metric || computedMetricState) {
      setHasInvalidMetricQueryParam(false);
      setHasInvalidComputedMetricQueryParam(false);
    }
  }, [computedMetricState, metric]);

  useEffect(() => {
    if (!enableComputedMetrics || !computedMetricState) {
      return;
    }
    if (pendingComputedMetricUrlSyncRef.current) {
      return;
    }
    if (queryMetric === null || queryMetric === undefined) {
      return;
    }
    setQueryParams({ [AnalyticsQueryParams.Metric]: null }, { skipHistory: true });
  }, [computedMetricState, enableComputedMetrics, queryMetric, setQueryParams]);

  const value = useMemo(
    () => ({
      priorUri,
      priorPage,
      metric,
      allowedMetrics,
      enableComputedMetrics,
      preset,
      setMetric,
      computedMetric: computedMetricState,
      setComputedMetric,
      executionMetric,
      hasInvalidMetricQueryParam,
      hasInvalidComputedMetricQueryParam,
      l7SmoothingFromUrl,
    }),
    [
      priorUri,
      priorPage,
      metric,
      allowedMetrics,
      enableComputedMetrics,
      preset,
      setMetric,
      computedMetricState,
      setComputedMetric,
      executionMetric,
      hasInvalidMetricQueryParam,
      hasInvalidComputedMetricQueryParam,
      l7SmoothingFromUrl,
    ],
  );
  return (
    <AnalyticsExploreModeProvider value>
      <ExperienceAnalyticsExploreModeContext.Provider value={value}>
        {children}
      </ExperienceAnalyticsExploreModeContext.Provider>
    </AnalyticsExploreModeProvider>
  );
};
export default ExperienceAnalyticsExploreModeContextProvider;

export const useExperienceAnalyticsExploreModeContext =
  (): TExperienceAnalyticsExploreModeContext => {
    const result = useContext(ExperienceAnalyticsExploreModeContext);
    if (!result) {
      throw new Error(
        'useExperienceAnalyticsExploreModeContext must be used within ExperienceAnalyticsExploreModeContextProvider',
      );
    }
    return result;
  };
