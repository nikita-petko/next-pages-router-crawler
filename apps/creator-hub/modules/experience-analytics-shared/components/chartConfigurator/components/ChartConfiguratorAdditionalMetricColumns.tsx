import type { FC } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2ChartResource, RAQIV2QueryFilter } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import legacyFiltersToRAQIV2 from '../../../adapters/legacyFiltersToRAQIV2';
import type { TChartConfiguratorMetrics } from '../../../chartConfigurator/chartConfiguratorMetricsConfig';
import type {
  UIFilterDimension,
  UIFilters,
} from '../../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { SourceFilterDimensionsByMetric } from '../ChartConfiguratorEquationBuilder';
import ChartConfiguratorMetricSourceCard, {
  type ExploreModeMetricSourceFilterDrawerConfig,
} from '../ChartConfiguratorMetricSourceCard';
import {
  MAX_TABLE_METRIC_COLUMNS,
  type ExploreModeTableMetricColumn,
} from '../chartConfiguratorTableColumns';

// Generic helper preserves each discriminated-union variant: spreading a
// `RAQIV2QueryFilter` and overriding `values` would otherwise widen the
// element type and break the dimension ↔ values pairing.
const cloneQueryFilter = <T extends RAQIV2QueryFilter>(filter: T): T => ({
  ...filter,
  values: filter.values.slice(),
});

const cloneQueryFilters = (filters: readonly RAQIV2QueryFilter[]): readonly RAQIV2QueryFilter[] =>
  filters.map(cloneQueryFilter);

const sourceFiltersToUIFilters = (filters: readonly RAQIV2QueryFilter[] | undefined): UIFilters => {
  if (!filters?.length) {
    return [];
  }
  return filters.map((filter) => ({
    dimension: filter.dimension as UIFilterDimension,
    values: [...filter.values],
  }));
};

type ChartConfiguratorAdditionalMetricColumnsProps = {
  /**
   * Existing additional metric columns (does not include the primary metric).
   */
  columns: ExploreModeTableMetricColumn[];
  onColumnsChange: (next: ExploreModeTableMetricColumn[]) => void;
  /**
   * Metrics available for column selection. Caller is responsible for already
   * filtering this to metrics that support all currently selected breakdown
   * dimensions.
   */
  availableMetrics: TChartConfiguratorMetrics[];
  sourceFilterResource?: RAQIV2ChartResource;
  sourceFilterDimensionsByMetric?: SourceFilterDimensionsByMetric;
  /** Total existing column count INCLUDING the primary metric column. */
  primaryColumnCount: number;
};

const ChartConfiguratorAdditionalMetricColumns: FC<
  ChartConfiguratorAdditionalMetricColumnsProps
> = ({
  columns,
  onColumnsChange,
  availableMetrics,
  sourceFilterResource,
  sourceFilterDimensionsByMetric,
  primaryColumnCount,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  // Per-component monotonic counter so newly-added column slots get a stable
  // React key that is unique across the lifetime of this component instance.
  // Using a ref (rather than a module-level mutable counter) keeps multiple
  // mounted instances independent and avoids cross-instance leakage in tests.
  const nextColumnKeySeedRef = useRef(0);
  const makeColumnKey = useCallback((): string => {
    nextColumnKeySeedRef.current += 1;
    return `tableCol_${Date.now().toString(36)}_${nextColumnKeySeedRef.current}`;
  }, []);
  const headingLabel = tPendingTranslation(
    'Metric columns',
    'Heading for the list of additional metric columns shown in explore mode table view.',
    translationKey('Heading.ExploreMode.MetricColumns', TranslationNamespace.Analytics),
  );
  const addColumnLabel = tPendingTranslation(
    'Add column',
    'Button label to add another metric column to the table.',
    translationKey('Action.ExploreMode.AddColumn', TranslationNamespace.Analytics),
  );

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = useCallback(() => {
    const next: ExploreModeTableMetricColumn[] = [
      ...columns,
      { type: 'metric', key: makeColumnKey(), metric: null },
    ];
    onColumnsChange(next);
    setExpandedIndex(next.length - 1);
  }, [columns, onColumnsChange, makeColumnKey]);

  const handleRemove = useCallback(
    (index: number) => {
      const next = columns.filter((_, i) => i !== index);
      onColumnsChange(next);
      setExpandedIndex((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev === index) {
          return null;
        }
        return prev > index ? prev - 1 : prev;
      });
    },
    [columns, onColumnsChange],
  );

  const handleMetricChange = useCallback(
    (index: number, metric: TChartConfiguratorMetrics | null) => {
      const next: ExploreModeTableMetricColumn[] = columns.map((column, i) =>
        i === index
          ? {
              ...column,
              metric,
              ...(metric === null ? { filters: undefined } : {}),
            }
          : column,
      );
      onColumnsChange(next);
    },
    [columns, onColumnsChange],
  );

  const handleFiltersChange = useCallback(
    (index: number, nextFilters: UIFilters) => {
      const nextSourceFilters = cloneQueryFilters(legacyFiltersToRAQIV2(nextFilters));
      const next: ExploreModeTableMetricColumn[] = columns.map((column, i) =>
        i === index
          ? {
              ...column,
              filters: nextSourceFilters.length > 0 ? nextSourceFilters : undefined,
            }
          : column,
      );
      onColumnsChange(next);
    },
    [columns, onColumnsChange],
  );

  const handleClearFilters = useCallback(
    (index: number) => {
      const next: ExploreModeTableMetricColumn[] = columns.map((column, i) =>
        i === index ? { ...column, filters: undefined } : column,
      );
      onColumnsChange(next);
    },
    [columns, onColumnsChange],
  );

  const getSourceFilterDrawerConfigForMetric = useCallback(
    (
      metric: TChartConfiguratorMetrics | null,
    ): ExploreModeMetricSourceFilterDrawerConfig | undefined => {
      if (!metric || !sourceFilterResource) {
        return undefined;
      }
      const dimensions = sourceFilterDimensionsByMetric?.[metric];
      if (!dimensions || dimensions.length === 0) {
        return undefined;
      }
      return { resource: sourceFilterResource, dimensions };
    },
    [sourceFilterResource, sourceFilterDimensionsByMetric],
  );

  const totalColumnCount = primaryColumnCount + columns.length;
  const canAddColumn = totalColumnCount < MAX_TABLE_METRIC_COLUMNS;

  const cards = useMemo(
    () =>
      columns.map((column, index) => (
        <ChartConfiguratorMetricSourceCard
          key={column.key}
          variableKey={String(primaryColumnCount + index + 1)}
          metric={column.metric}
          isExpanded={expandedIndex === index}
          onToggleExpand={() => setExpandedIndex((prev) => (prev === index ? null : index))}
          onMetricChange={(metric) => handleMetricChange(index, metric)}
          onClearFilters={() => handleClearFilters(index)}
          sourceFilters={sourceFiltersToUIFilters(column.filters)}
          onSourceFiltersChange={(filters) => handleFiltersChange(index, filters)}
          sourceFilterDrawerConfig={getSourceFilterDrawerConfigForMetric(column.metric)}
          onRemove={() => handleRemove(index)}
          availableMetrics={availableMetrics}
          filterSummary={column.filters
            ?.map((f) => `${f.dimension}: ${f.values.join(', ')}`)
            .join(' | ')}
          customEventResource={sourceFilterResource}
        />
      )),
    [
      columns,
      expandedIndex,
      primaryColumnCount,
      handleMetricChange,
      handleClearFilters,
      handleFiltersChange,
      getSourceFilterDrawerConfigForMetric,
      handleRemove,
      availableMetrics,
      sourceFilterResource,
    ],
  );

  return (
    <div className='flex flex-col gap-medium'>
      <h3 className='text-title-medium content-emphasis margin-none'>{headingLabel}</h3>
      {cards}
      {canAddColumn && (
        <div className='self-start'>
          <Button variant='Utility' size='Small' icon='icon-filled-plus-large' onClick={handleAdd}>
            {addColumnLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChartConfiguratorAdditionalMetricColumns;
