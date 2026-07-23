import type { FC, PropsWithChildren } from 'react';
import {
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
  getAnalyticsNavigationItemFromPath,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  type TChartConfiguratorMetrics,
  getAllChartConfiguratorMetrics,
  isChartConfiguratorMetric,
} from '../chartConfigurator/chartConfiguratorMetricsConfig';
import emptyFunction from '../constants/emptyFunction';
import type { TRAQIV2PredefinedChartKey } from '../constants/RAQIV2PredefinedChartConfig';
import { isCentralizedPredefinedChartKey } from '../constants/RAQIV2PredefinedChartConfig';
import type { ComputedMetric, MetricLike } from '../types/ComputedMetric';
import { getUIMetricFromAtomicMetricLike } from '../types/ComputedMetric';
import {
  type FormulaAstNode,
  parseComputedMetricFormula,
} from '../utils/computedMetrics/parseComputedMetricFormula';
import resolveExploreModeQueryState, {
  isComputedMetricAllowedForExploreMode,
} from './resolveExploreModeQueryState';

type TMetric = TChartConfiguratorMetrics | null;
type TSetMetric = (nextMetric: TMetric) => void;
type TExperienceAnalyticsExploreModeContext = {
  priorUri: string | null;
  priorPage: AnalyticsNavigationItem | null;
  preset: TRAQIV2PredefinedChartKey | null;
  clearPreset: () => void;
  metric: TMetric;
  allowedMetrics: readonly TChartConfiguratorMetrics[];
  featureFlagsFetched: boolean;
  setMetric: TSetMetric;
  computedMetric: ComputedMetric | null;
  setComputedMetric: (cm: ComputedMetric | null) => void;
  executionMetric: MetricLike | null;
  hasInvalidMetricQueryParam: boolean;
  hasInvalidComputedMetricQueryParam: boolean;
  l7SmoothingFromUrl: boolean;
};

const ExperienceAnalyticsExploreModeContext = createContext<TExperienceAnalyticsExploreModeContext>(
  {
    preset: null,
    priorUri: null,
    priorPage: null,
    clearPreset: emptyFunction,
    metric: null,
    allowedMetrics: getAllChartConfiguratorMetrics(),
    featureFlagsFetched: true,
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

const getIdentitySourceKeyFromFormulaAst = (node: FormulaAstNode): string | null => {
  if (node.type === 'identifier') {
    return node.name;
  }
  if (node.type !== 'binary') {
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
  computedMetric: ComputedMetric,
): TChartConfiguratorMetrics | null => {
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
  const uiMetric = identitySourceMetric
    ? getUIMetricFromAtomicMetricLike(identitySourceMetric)
    : null;
  return uiMetric && isChartConfiguratorMetric(uiMetric) ? uiMetric : null;
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
  allowedMetrics?: readonly TChartConfiguratorMetrics[];
  featureFlagsFetched?: boolean;
}>;

const ExperienceAnalyticsExploreModeContextProvider: FC<
  ExperienceAnalyticsExploreModeContextProviderProps
> = ({
  children,
  allowedMetrics = getAllChartConfiguratorMetrics(),
  featureFlagsFetched = true,
}) => {
  const [
    {
      [AnalyticsQueryParams.Metric]: queryMetric,
      [AnalyticsQueryParams.Preset]: queryPreset,
      [AnalyticsQueryParams.Referrer]: queryReferrer,
      [AnalyticsQueryParams.ComputedMetric]: queryComputedMetric,
    },
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
        featureFlagsFetched,
      }),
    [allowedMetrics, featureFlagsFetched, queryComputedMetric, queryMetric],
  );
  const {
    metric,
    computedMetric: computedMetricFromQuery,
    hasInvalidMetricQueryParam: hasInvalidMetricQueryParamFromQuery,
    hasInvalidComputedMetricQueryParam: hasInvalidComputedMetricQueryParamFromQuery,
    l7SmoothingFromUrl,
  } = queryStateResolution;

  const [hasInvalidMetricQueryParam, setHasInvalidMetricQueryParam] = useState<boolean>(
    () => hasInvalidMetricQueryParamFromQuery,
  );

  const [computedMetricState, setComputedMetricState] = useState<ComputedMetric | null>(
    () => computedMetricFromQuery,
  );
  const [hasInvalidComputedMetricQueryParam, setHasInvalidComputedMetricQueryParam] =
    useState<boolean>(() => hasInvalidComputedMetricQueryParamFromQuery);
  const lastRegularMetricRef = useRef<TMetric>(metric);

  const setMetric = useCallback(
    (nextMetric: TMetric) => {
      const sanitizedNextMetric =
        nextMetric && isValidArrayEnumValue(allowedMetrics, nextMetric) ? nextMetric : null;
      clearPreset();
      setHasInvalidMetricQueryParam(false);
      setHasInvalidComputedMetricQueryParam(false);
      if (sanitizedNextMetric) {
        lastRegularMetricRef.current = sanitizedNextMetric;
      }
      setComputedMetricState(null);
    },
    [clearPreset, allowedMetrics],
  );

  const setComputedMetric = useCallback(
    (cm: ComputedMetric | null) => {
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
        if (restoredMetric) {
          lastRegularMetricRef.current = restoredMetric;
        }
        setComputedMetricState(null);
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
        return;
      }
      setHasInvalidComputedMetricQueryParam(false);
      if (metric) {
        lastRegularMetricRef.current = metric;
      }
      setComputedMetricState(cm);
    },
    [clearPreset, computedMetricState, metric, allowedMetrics],
  );

  const executionMetric: MetricLike | null = useMemo(() => {
    if (computedMetricState) {
      return computedMetricState;
    }
    return metric;
  }, [computedMetricState, metric]);

  useEffect(() => {
    if (metric) {
      lastRegularMetricRef.current = metric;
    }
  }, [metric]);

  useEffect(() => {
    const nextComputedMetric = computedMetricFromQuery;
    setComputedMetricState((previous) => {
      return previous === nextComputedMetric ? previous : nextComputedMetric;
    });
  }, [computedMetricFromQuery]);

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

  const value = useMemo(
    () => ({
      priorUri,
      priorPage,
      metric,
      allowedMetrics,
      featureFlagsFetched,
      preset,
      clearPreset,
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
      featureFlagsFetched,
      preset,
      clearPreset,
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
    <ExperienceAnalyticsExploreModeContext.Provider value={value}>
      {children}
    </ExperienceAnalyticsExploreModeContext.Provider>
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
