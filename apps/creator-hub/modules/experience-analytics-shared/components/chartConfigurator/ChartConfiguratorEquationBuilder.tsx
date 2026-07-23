import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetricFanoutDimensionValues } from '@rbx/creator-hub-analytics-config';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import {
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import {
  setComputedMetricValidationError,
  setComputedMetricFormulaLabel,
} from '../../chartConfigurator/computedMetricValidationStore';
import isDurationChartMetric from '../../chartConfigurator/isDurationChartMetric';
import validateComputedMetricSemantics, {
  ComputedMetricSemanticErrorType,
  type ComputedMetricSemanticError,
  type ComputedMetricSemanticsChartContext,
} from '../../chartConfigurator/validateComputedMetricSemantics';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../../constants/AnalyticsMetricDisplayConfig';
import {
  getFilterValueForDimension,
  type UIFilterDimension,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import useTextFilterValidation from '../../text-filter/useTextFilterValidation';
import type {
  AtomicMetricLike,
  ComputedMetric,
  ComputedMetricSource,
  ComputedMetricSourceFilter,
} from '../../types/ComputedMetric';
import {
  getUIMetricFromAtomicMetricLike,
  isCustomEventsAtomicMetricLike,
} from '../../types/ComputedMetric';
import { serializeComputedMetricToQueryParam } from '../../types/ComputedMetricQueryParam';
import {
  COMPUTED_METRIC_VARIABLE_KEYS,
  parseComputedMetricFormula,
  type FormulaParseResult,
} from '../../utils/computedMetrics/parseComputedMetricFormula';
import extractPseudoDimensionsFromFilters, {
  hasPseudoDimensionValues,
} from '../../utils/extractPseudoDimensionsFromFilters';
import ChartConfiguratorFormulaCard from './ChartConfiguratorFormulaCard';
import ChartConfiguratorMetricSourceCard, {
  type ExploreModeMetricSourceFilterDrawerConfig,
} from './ChartConfiguratorMetricSourceCard';
import { customEventsMetric } from './useChartConfiguratorSourceSelection';

export type MetricSource = {
  key: string;
  metric: TChartConfiguratorMetrics | null;
  // Real query filters only. Fanout pseudo-dimensions (AggregationType /
  // PercentileType) and source identity (CustomEventName) are stored
  // separately and structurally excluded from this slot by
  // `ComputedMetricSourceFilter`, so the partition is enforced at the type
  // level both inside the builder and when emitting downstream
  // `ComputedMetricSource` payloads.
  filters?: readonly ComputedMetricSourceFilter[];
  customEventName?: string;
  pseudoDimensionValues?: TRAQIV2UIMetricFanoutDimensionValues;
};

// A MetricSource becomes "complete" once the user has picked a numeric metric
// for it. Only complete sources can be serialized to a ComputedMetricSource
// and emitted downstream; the equation-builder effect won't compose a
// ComputedMetric until every source in `sources` is complete.
type CompleteMetricSource = MetricSource & { metric: TRAQIV2NumericUIMetric };

const isCompleteMetricSource = (source: MetricSource): source is CompleteMetricSource =>
  source.metric !== null && isNumericUIMetric(source.metric);

const areMetricSourcesComplete = (
  sources: readonly MetricSource[],
): sources is readonly [CompleteMetricSource, ...CompleteMetricSource[]] =>
  sources.length > 0 && sources.every(isCompleteMetricSource);

export const getReferencedMetricSourcesForFormula = (
  sources: readonly MetricSource[],
  formula: string,
): {
  parseResult: FormulaParseResult | undefined;
  referencedSources: readonly MetricSource[];
} => {
  const variableKeys = sources.map((source) => source.key);
  const parseResult = formula.trim()
    ? parseComputedMetricFormula(formula, variableKeys)
    : undefined;
  const referencedSources = parseResult?.ok
    ? sources.filter((source) => parseResult.identifiers.includes(source.key))
    : [];

  return { parseResult, referencedSources };
};

export const buildComputedMetricSourceFromMetricSource = (
  source: Pick<MetricSource, 'key' | 'filters' | 'customEventName' | 'pseudoDimensionValues'> & {
    metric: TRAQIV2NumericUIMetric;
  },
): ComputedMetricSource => {
  const metric: AtomicMetricLike =
    source.metric === customEventsMetric && source.customEventName
      ? {
          metric: RAQIV2UIMetric.CustomEventsV2,
          customEventName: source.customEventName,
          ...(source.pseudoDimensionValues?.aggregationType
            ? { aggregationType: source.pseudoDimensionValues.aggregationType }
            : {}),
        }
      : source.metric;
  return {
    key: source.key,
    metric,
    filters: source.filters,
    ...(source.pseudoDimensionValues
      ? { pseudoDimensionValues: source.pseudoDimensionValues }
      : {}),
  };
};

export type SourceFilterDimensionsByMetric = Partial<
  Record<TChartConfiguratorMetrics, ExploreModeMetricSourceFilterDrawerConfig['dimensions']>
>;

type ChartConfiguratorEquationBuilderProps = {
  availableMetrics: TChartConfiguratorMetrics[];
  sourceFilterResource?: ExploreModeMetricSourceFilterDrawerConfig['resource'];
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
  onComputedMetricChange: (cm: ComputedMetric | null) => void;
  initialComputedMetric?: ComputedMetric | null;
  defaultMetric?: TChartConfiguratorMetrics | null;
  chartContext?: ComputedMetricSemanticsChartContext;
};

const nextVariableKey = (sources: MetricSource[]): string | null => {
  const used = new Set(sources.map((s) => s.key));
  const available = COMPUTED_METRIC_VARIABLE_KEYS.find((key) => !used.has(key));
  return available ?? null;
};

const useStyles = makeStyles()(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  addButton: {
    alignSelf: 'flex-start',
  },
}));

const ChartConfiguratorEquationBuilder: FC<ChartConfiguratorEquationBuilderProps> = ({
  availableMetrics,
  sourceFilterResource,
  sourceFilterDimensionsByMetric,
  onComputedMetricChange,
  initialComputedMetric,
  defaultMetric,
  chartContext,
}) => {
  const {
    classes: { root, addButton },
  } = useStyles();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const addMetricLabel = tPendingTranslation(
    'Add metric',
    'Button label to add another metric source to the equation builder.',
    translationKey('Label.ExploreMode.AddMetric', TranslationNamespace.Analytics),
  );
  const formulaNameBlockedError = tPendingTranslation(
    'This name contains words that aren’t allowed. Please choose a different name.',
    'Error shown below the formula name input when the entered name fails text moderation (e.g. profanity).',
    translationKey('Error.ExploreMode.FormulaNameBlocked', TranslationNamespace.Analytics),
  );

  const [sources, setSources] = useState<MetricSource[]>(() => {
    if (initialComputedMetric) {
      return initialComputedMetric.sources
        .slice(0, COMPUTED_METRIC_VARIABLE_KEYS.length)
        .map((s) => {
          const uiMetric = getUIMetricFromAtomicMetricLike(s.metric);
          return {
            key: s.key,
            metric: isChartConfiguratorMetric(uiMetric) ? uiMetric : null,
            filters: s.filters,
            customEventName: isCustomEventsAtomicMetricLike(s.metric)
              ? s.metric.customEventName
              : undefined,
            pseudoDimensionValues: {
              aggregationType: isCustomEventsAtomicMetricLike(s.metric)
                ? (s.metric.aggregationType ?? s.pseudoDimensionValues?.aggregationType ?? null)
                : (s.pseudoDimensionValues?.aggregationType ?? null),
              percentile: s.pseudoDimensionValues?.percentile ?? null,
            },
          };
        });
    }
    return [{ key: 'A', metric: defaultMetric ?? null }];
  });

  const [formula, setFormula] = useState(
    () => initialComputedMetric?.formula ?? (defaultMetric ? 'A' : ''),
  );
  // Leave the editable formula-name input empty until the user types into it.
  // The card and chart title both fall back to "Untitled formula" when this
  // is empty, so we never thread the raw formula expression — or any
  // placeholder seed value — into the saved metric or the chart title.
  const [formulaName, setFormulaName] = useState(() => initialComputedMetric?.name ?? '');
  const [semanticErrors, setSemanticErrors] = useState<readonly ComputedMetricSemanticError[]>([]);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const lastEmittedComputedMetricRef = useRef<string | null>(
    initialComputedMetric ? serializeComputedMetricToQueryParam(initialComputedMetric) : null,
  );

  const variableKeys = useMemo(() => sources.map((s) => s.key), [sources]);
  const canAddSource = sources.length < COMPUTED_METRIC_VARIABLE_KEYS.length;

  // Strictly non-optimistic moderation of the typed formula name: only the
  // `confirmedFormulaName` returned by the hook flows downstream into the
  // emitted computed metric and chart title, so a name that's still being
  // checked or has been blocked never reaches persisted state.
  //
  // We deliberately do NOT seed `initialConfirmedValue` from
  // `initialComputedMetric?.name`: that value is reflected from the URL,
  // which is sharable, untrusted user input. Treating it as already-moderated
  // would let a profanity-laden URL bypass the text-filter service. Letting
  // the hook re-validate the seed through the normal pending → ok flow costs
  // one moderation call on page load when there's a pre-existing name, which
  // is cheap.
  const { confirmedValue: confirmedFormulaName, isBlocked: isFormulaNameBlocked } =
    useTextFilterValidation(formulaName);

  const nameError = isFormulaNameBlocked ? formulaNameBlockedError : undefined;

  /* oxlint-disable react/react-compiler -- existing effect derives computed-metric validation state from formula/source inputs */
  useEffect(() => {
    return () => {
      setComputedMetricValidationError(false);
      setComputedMetricFormulaLabel(undefined);
    };
  }, []);

  const handleAddSource = useCallback(() => {
    setSources((prev) => {
      const key = nextVariableKey(prev);
      if (!key) {
        return prev;
      }
      return [...prev, { key, metric: null }];
    });
  }, []);

  const handleRemoveSource = useCallback((index: number) => {
    setSources((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
    setExpandedCardIndex(null);
  }, []);

  const handleMetricChange = useCallback(
    (index: number, metric: TChartConfiguratorMetrics | null) => {
      setSources((prev) =>
        prev.map((s, i) => {
          if (i !== index) {
            return s;
          }
          const wasCustomEvents = s.metric === customEventsMetric;
          const isCustomEvents = metric === customEventsMetric;
          if (wasCustomEvents && !isCustomEvents) {
            // Drop custom-event-specific state (CustomEventName source identity
            // and the AggregationType fanout selection) when switching away.
            return {
              ...s,
              metric,
              filters: undefined,
              customEventName: undefined,
              pseudoDimensionValues: undefined,
            };
          }
          return { ...s, metric };
        }),
      );
    },
    [],
  );
  // Translate the internal split (`filters` + `pseudoDimensionValues`) into
  // the flat `UIFilters` shape the drawer expects. The drawer is oblivious
  // to the split — it keeps rendering an AggregationType / PercentileType
  // chip alongside real filter chips.
  const sourceStateToUIFilters = useCallback(
    (
      source: Pick<MetricSource, 'filters' | 'customEventName' | 'pseudoDimensionValues'>,
    ): UIFilters => {
      const uiFilters: UIFilters =
        source.filters?.map((filter) => ({
          dimension: filter.dimension as UIFilterDimension,
          values: [...filter.values],
        })) ?? [];
      if (source.customEventName) {
        uiFilters.push({
          dimension: RAQIV2Dimension.CustomEventName,
          values: [source.customEventName],
        });
      }
      if (source.pseudoDimensionValues?.aggregationType) {
        uiFilters.push({
          dimension: RAQIV2UIPseudoDimension.AggregationType as UIFilterDimension,
          values: [source.pseudoDimensionValues.aggregationType],
        });
      }
      if (source.pseudoDimensionValues?.percentile) {
        uiFilters.push({
          dimension: RAQIV2UIPseudoDimension.PercentileType as UIFilterDimension,
          values: [source.pseudoDimensionValues.percentile],
        });
      }
      return uiFilters;
    },
    [],
  );
  const handleSourceFiltersChange = useCallback((index: number, nextFilters: UIFilters) => {
    const raqiFilters = legacyFiltersToRAQIV2(nextFilters);
    // Split at the drawer seam into three slots:
    //   1. `pseudoDimensionValues` — fanout pseudo-dimensions (extracted
    //      structurally below, narrowing the residue to `RAQIV2APIQueryFilter`).
    //   2. `customEventName` — source identity for CustomEventsV2.
    //   3. `filters` — real, source-scoped query filters; narrowed via a
    //      type-guarded `.filter` so the slot's stored type is
    //      `ComputedMetricSourceFilter`, matching `MetricSource.filters`
    //      and (transitively) `ComputedMetricSource.filters`.
    // Downstream consumers (DAG builder, serializer) never see mixed state.
    const { realFilters, pseudoDimensionValues } = extractPseudoDimensionsFromFilters(raqiFilters);
    const customEventName = realFilters.find(
      (filter) => filter.dimension === RAQIV2Dimension.CustomEventName,
    )?.values[0];
    const sourceFilters = realFilters.filter(
      (filter): filter is ComputedMetricSourceFilter =>
        filter.dimension !== RAQIV2Dimension.CustomEventName && filter.values.length > 0,
    );
    setSources((prev) =>
      prev.map((source, sourceIndex) =>
        sourceIndex === index
          ? {
              ...source,
              filters: sourceFilters.length > 0 ? sourceFilters : undefined,
              customEventName,
              pseudoDimensionValues: hasPseudoDimensionValues(pseudoDimensionValues)
                ? pseudoDimensionValues
                : undefined,
            }
          : source,
      ),
    );
  }, []);
  const getSourceFilterDrawerConfigForMetric = useCallback(
    (
      sourceMetric: TChartConfiguratorMetrics | null,
    ): ExploreModeMetricSourceFilterDrawerConfig | undefined => {
      if (!sourceMetric || !sourceFilterResource) {
        return undefined;
      }
      const dimensions = sourceFilterDimensionsByMetric?.[sourceMetric];
      if (!dimensions || dimensions.length === 0) {
        return undefined;
      }
      return {
        resource: sourceFilterResource,
        dimensions,
      };
    },
    [sourceFilterDimensionsByMetric, sourceFilterResource],
  );

  const handleClearSourceFilters = useCallback((index: number) => {
    setSources((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              filters: undefined,
              customEventName: undefined,
              pseudoDimensionValues: undefined,
            }
          : s,
      ),
    );
  }, []);

  const handleToggleSourceExpand = useCallback((index: number) => {
    setExpandedCardIndex((prev) => (prev === index ? null : index));
  }, []);

  const formulaCardIndex = sources.length;
  const isFormulaExpanded = expandedCardIndex === formulaCardIndex;
  const handleToggleFormulaExpand = useCallback(() => {
    setExpandedCardIndex((prev) => (prev === formulaCardIndex ? null : formulaCardIndex));
  }, [formulaCardIndex]);

  const semanticErrorMessages = useMemo(() => {
    if (semanticErrors.length === 0) {
      return [];
    }
    return semanticErrors.map((error) => {
      switch (error.type) {
        case ComputedMetricSemanticErrorType.UnsupportedSource:
          return tPendingTranslation(
            'One or more selected metrics are not supported in this context',
            'Error shown when a computed metric includes a source metric that is not available in explore mode.',
            translationKey(
              'Error.ExploreMode.UnsupportedSourceMetric',
              TranslationNamespace.Analytics,
            ),
          );
        case ComputedMetricSemanticErrorType.NoSharedDateRanges:
          return tPendingTranslation(
            'Selected metrics do not share a compatible time range',
            'Error shown when the source metrics in a computed metric have no overlapping date range options.',
            translationKey('Error.ExploreMode.NoSharedDateRanges', TranslationNamespace.Analytics),
          );
        case ComputedMetricSemanticErrorType.NoSharedGranularities:
          return tPendingTranslation(
            'Selected metrics do not share a compatible time interval',
            'Error shown when the source metrics in a computed metric have no shared granularity options for the current date range.',
            translationKey(
              'Error.ExploreMode.NoSharedGranularities',
              TranslationNamespace.Analytics,
            ),
          );
        default:
          return tPendingTranslation(
            'The selected metric combination is not valid',
            'Generic fallback error when a computed metric combination fails semantic validation.',
            translationKey(
              'Error.ExploreMode.InvalidMetricCombination',
              TranslationNamespace.Analytics,
            ),
          );
      }
    });
  }, [semanticErrors, tPendingTranslation]);

  const emitComputedMetricIfChanged = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      const nextValue = nextComputedMetric
        ? serializeComputedMetricToQueryParam(nextComputedMetric)
        : null;
      if (lastEmittedComputedMetricRef.current === nextValue) {
        return;
      }
      lastEmittedComputedMetricRef.current = nextValue;
      onComputedMetricChange(nextComputedMetric);
    },
    [onComputedMetricChange],
  );

  useEffect(() => {
    // Only thread an explicit, *moderation-confirmed* user-set formula name
    // through to the chart title. Never use the raw formula expression, and
    // never use the still-typing input value — `confirmedFormulaName` only
    // updates after a successful text-filter response. When the user has not
    // explicitly named the formula, leave the label undefined and let the
    // chart fall back to its "Untitled formula" empty-state title.
    const explicitName = confirmedFormulaName.trim();
    setComputedMetricFormulaLabel(explicitName || undefined);
    const { parseResult, referencedSources } = getReferencedMetricSourcesForFormula(
      sources,
      formula,
    );
    const referencedSourcesComplete = areMetricSourcesComplete(referencedSources);
    const hasDurationSource = referencedSources.some(
      (s) => s.metric && isDurationChartMetric(s.metric),
    );

    if (!formula.trim() || !parseResult?.ok || !referencedSourcesComplete || hasDurationSource) {
      setSemanticErrors([]);
      emitComputedMetricIfChanged(null);
      setComputedMetricValidationError(false);
      return;
    }

    const hasUnreadyCustomEventSource = referencedSources.some((s) => {
      if (s.metric !== customEventsMetric) {
        return false;
      }
      const eventName = getFilterValueForDimension(
        sourceStateToUIFilters(s),
        RAQIV2Dimension.CustomEventName,
        null,
      );
      return eventName == null || eventName.length === 0;
    });
    if (hasUnreadyCustomEventSource) {
      setSemanticErrors([]);
      emitComputedMetricIfChanged(null);
      setComputedMetricValidationError(true);
      return;
    }

    const [firstSource, ...otherSources] = referencedSources;

    const computedMetric: ComputedMetric = {
      sources: [
        buildComputedMetricSourceFromMetricSource(firstSource),
        ...otherSources.map(buildComputedMetricSourceFromMetricSource),
      ],
      name: explicitName || undefined,
      formula,
    };

    const semanticsResult = validateComputedMetricSemantics(
      computedMetric,
      availableMetrics,
      chartContext,
    );
    setSemanticErrors(semanticsResult.errors);

    if (!semanticsResult.isValid) {
      emitComputedMetricIfChanged(null);
      setComputedMetricValidationError(false);
      return;
    }

    emitComputedMetricIfChanged(computedMetric);
    setComputedMetricValidationError(false);
  }, [
    sources,
    formula,
    confirmedFormulaName,
    variableKeys,
    availableMetrics,
    chartContext,
    emitComputedMetricIfChanged,
    sourceStateToUIFilters,
  ]);
  /* oxlint-enable react/react-compiler */

  return (
    <div className={root}>
      {sources.map((source, index) => {
        const uiFiltersForSource = sourceStateToUIFilters(source);
        const filterSummary =
          uiFiltersForSource.length > 0
            ? uiFiltersForSource.map((f) => `${f.dimension}: ${f.values.join(', ')}`).join(' | ')
            : undefined;
        return (
          <ChartConfiguratorMetricSourceCard
            key={source.key}
            variableKey={source.key}
            metric={source.metric}
            isExpanded={expandedCardIndex === index}
            onToggleExpand={() => handleToggleSourceExpand(index)}
            onMetricChange={(m) => handleMetricChange(index, m)}
            onClearFilters={() => handleClearSourceFilters(index)}
            sourceFilters={uiFiltersForSource}
            onSourceFiltersChange={(nextFilters) => handleSourceFiltersChange(index, nextFilters)}
            sourceFilterDrawerConfig={getSourceFilterDrawerConfigForMetric(source.metric)}
            onRemove={sources.length > 1 ? () => handleRemoveSource(index) : undefined}
            availableMetrics={availableMetrics}
            filterSummary={filterSummary}
            customEventResource={sourceFilterResource}
          />
        );
      })}

      <ChartConfiguratorFormulaCard
        formula={formula}
        formulaName={formulaName}
        displayName={confirmedFormulaName}
        variableKeys={variableKeys}
        isExpanded={isFormulaExpanded}
        onToggleExpand={handleToggleFormulaExpand}
        onFormulaChange={setFormula}
        onNameChange={setFormulaName}
        semanticErrors={semanticErrorMessages}
        nameError={nameError}
      />

      <div className={addButton}>
        <Button
          variant='Utility'
          size='Small'
          icon='icon-filled-plus-large'
          isDisabled={!canAddSource}
          onClick={handleAddSource}>
          {addMetricLabel}
        </Button>
      </div>
    </div>
  );
};

export default ChartConfiguratorEquationBuilder;
