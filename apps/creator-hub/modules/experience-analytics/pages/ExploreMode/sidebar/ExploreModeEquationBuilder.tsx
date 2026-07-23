import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { makeStyles } from '@rbx/ui';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { useTranslation } from '@rbx/intl';
import {
  COMPUTED_METRIC_VARIABLE_KEYS,
  TExploreModeMetrics,
  isExploreModeMetric,
  isDurationChartMetric,
  type ComputedMetric,
  type UIFilterDimension,
  type UIFilters,
  type TRAQIV2NumericUIMetric,
  legacyFiltersToRAQIV2,
  parseComputedMetricFormula,
  serializeComputedMetricToQueryParam,
} from '@modules/experience-analytics-shared';
import ExploreModeMetricSourceCard, {
  type ExploreModeMetricSourceFilterDrawerConfig,
} from './ExploreModeMetricSourceCard';
import ExploreModeFormulaCard from './ExploreModeFormulaCard';

type MetricSource = {
  key: string;
  metric: TExploreModeMetrics | null;
  filters?: readonly RAQIV2QueryFilter[];
};

export type SourceFilterDimensionsByMetric = Partial<
  Record<TExploreModeMetrics, ExploreModeMetricSourceFilterDrawerConfig['dimensions']>
>;

const cloneQueryFilters = (filters: readonly RAQIV2QueryFilter[]): readonly RAQIV2QueryFilter[] => {
  return filters.map((filter) => ({
    ...filter,
    values: [...filter.values],
  })) as readonly RAQIV2QueryFilter[];
};

type ExploreModeEquationBuilderProps = {
  availableMetrics: TExploreModeMetrics[];
  sourceFilterResource?: ExploreModeMetricSourceFilterDrawerConfig['resource'];
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
  onComputedMetricChange: (cm: ComputedMetric<TRAQIV2NumericUIMetric> | null) => void;
  initialComputedMetric?: ComputedMetric<TRAQIV2NumericUIMetric> | null;
  defaultMetric?: TExploreModeMetrics | null;
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

const ExploreModeEquationBuilder: FC<ExploreModeEquationBuilderProps> = ({
  availableMetrics,
  sourceFilterResource,
  sourceFilterDimensionsByMetric,
  onComputedMetricChange,
  initialComputedMetric,
  defaultMetric,
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

  const [sources, setSources] = useState<MetricSource[]>(() => {
    if (initialComputedMetric) {
      return initialComputedMetric.sources
        .slice(0, COMPUTED_METRIC_VARIABLE_KEYS.length)
        .map((s) => ({
          key: s.key,
          metric: isExploreModeMetric(s.metric) ? s.metric : null,
          filters: s.filters,
        }));
    }
    return [{ key: 'A', metric: defaultMetric ?? null }];
  });

  const [formula, setFormula] = useState(
    () => initialComputedMetric?.formula ?? (defaultMetric ? 'A' : ''),
  );
  const [formulaName, setFormulaName] = useState(() => initialComputedMetric?.name ?? '');
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const lastEmittedComputedMetricRef = useRef<string | null>(
    initialComputedMetric ? serializeComputedMetricToQueryParam(initialComputedMetric) : null,
  );

  const variableKeys = useMemo(() => sources.map((s) => s.key), [sources]);
  const canAddSource = sources.length < COMPUTED_METRIC_VARIABLE_KEYS.length;

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
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setExpandedCardIndex(null);
  }, []);

  const handleMetricChange = useCallback((index: number, metric: TExploreModeMetrics | null) => {
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, metric } : s)));
  }, []);
  const sourceFiltersToUIFilters = useCallback(
    (filters: readonly RAQIV2QueryFilter[] | undefined): UIFilters => {
      if (!filters?.length) return [];
      return filters.map((filter) => ({
        dimension: filter.dimension as UIFilterDimension,
        values: [...filter.values],
      }));
    },
    [],
  );
  const handleSourceFiltersChange = useCallback((index: number, nextFilters: UIFilters) => {
    const nextSourceFilters = cloneQueryFilters(legacyFiltersToRAQIV2(nextFilters));
    setSources((prev) =>
      prev.map((source, sourceIndex) =>
        sourceIndex === index
          ? {
              ...source,
              filters: nextSourceFilters.length > 0 ? nextSourceFilters : undefined,
            }
          : source,
      ),
    );
  }, []);
  const getSourceFilterDrawerConfigForMetric = useCallback(
    (
      sourceMetric: TExploreModeMetrics | null,
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

  const emitComputedMetricIfChanged = useCallback(
    (nextComputedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null) => {
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
    const allSourcesFilled = sources.every((s) => s.metric !== null);
    if (!allSourcesFilled || !formula.trim()) {
      emitComputedMetricIfChanged(null);
      return;
    }

    const parseResult = parseComputedMetricFormula(formula, variableKeys);
    if (!parseResult.ok) {
      emitComputedMetricIfChanged(null);
      return;
    }

    const hasDurationSource = sources.some((s) => s.metric && isDurationChartMetric(s.metric));
    if (hasDurationSource) {
      emitComputedMetricIfChanged(null);
      return;
    }

    const firstSource = sources[0];
    if (!firstSource.metric) {
      emitComputedMetricIfChanged(null);
      return;
    }

    const computedMetric: ComputedMetric<TRAQIV2NumericUIMetric> = {
      sources: [
        {
          key: firstSource.key,
          metric: firstSource.metric as TRAQIV2NumericUIMetric,
          filters: firstSource.filters,
        },
        ...sources.slice(1).map((s) => ({
          key: s.key,
          metric: s.metric as TRAQIV2NumericUIMetric,
          filters: s.filters,
        })),
      ],
      name: formulaName.trim() || undefined,
      formula,
    };
    emitComputedMetricIfChanged(computedMetric);
  }, [sources, formula, formulaName, variableKeys, emitComputedMetricIfChanged]);

  return (
    <div className={root}>
      {sources.map((source, index) => (
        <ExploreModeMetricSourceCard
          key={source.key}
          variableKey={source.key}
          metric={source.metric}
          isExpanded={expandedCardIndex === index}
          onToggleExpand={() => handleToggleSourceExpand(index)}
          onMetricChange={(m) => handleMetricChange(index, m)}
          onClearFilters={() => handleClearSourceFilters(index)}
          sourceFilters={sourceFiltersToUIFilters(source.filters)}
          onSourceFiltersChange={(nextFilters) => handleSourceFiltersChange(index, nextFilters)}
          sourceFilterDrawerConfig={getSourceFilterDrawerConfigForMetric(source.metric)}
          onRemove={sources.length > 1 ? () => handleRemoveSource(index) : undefined}
          availableMetrics={availableMetrics}
          filterSummary={source.filters
            ?.map((f) => `${f.dimension}: ${f.values.join(', ')}`)
            .join(' | ')}
        />
      ))}

      <ExploreModeFormulaCard
        formula={formula}
        formulaName={formulaName}
        variableKeys={variableKeys}
        isExpanded={isFormulaExpanded}
        onToggleExpand={handleToggleFormulaExpand}
        onFormulaChange={setFormula}
        onNameChange={setFormulaName}
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

export default ExploreModeEquationBuilder;
