import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2UIMetric,
  type TRAQIV2APIMetric,
} from '@rbx/creator-hub-analytics-config';
import { Badge, Button, Icon, IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import { codegenChartConfiguratorMetricToGroup } from '../../chartConfigurator/codegenChartConfiguratorMetricGrouping';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import ExperienceAnalyticsFilterDrawerButton from '../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterDrawerButton';
import {
  getFilterValueForDimension,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { getAPIMetricFromUIMetric } from '../../utils/getAPIMetricFromUIMetric';
import { SourceMetricContextProvider } from '../RAQIV2/layout/RAQIV2ConfigurablePageContext';
import ChartConfiguratorCustomEventControls from './ChartConfiguratorCustomEventControls';
import ChartConfiguratorMetricSelector from './ChartConfiguratorMetricSelector';
import ChartConfiguratorSourceSelector from './ChartConfiguratorSourceSelector';
import {
  computeSourceChange,
  customEventsMetric,
  customEventsSourceKey,
  filterMetricsForSource,
  isCustomEventsSource,
} from './useChartConfiguratorSourceSelection';

const emptyFilters: UIFilters = [];

const initMetricSourceCategoryFromMetric = (
  m: TChartConfiguratorMetrics | null,
): TranslationKey | null => {
  if (!m) {
    return null;
  }
  if (m === customEventsMetric) {
    return customEventsSourceKey;
  }
  return codegenChartConfiguratorMetricToGroup(m);
};

export type ExploreModeMetricSourceFilterDrawerConfig = Pick<
  React.ComponentProps<typeof ExperienceAnalyticsFilterDrawerButton>,
  'resource' | 'dimensions'
>;

type ChartConfiguratorMetricSourceCardProps = {
  variableKey: string;
  metric: TChartConfiguratorMetrics | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMetricChange: (metric: TChartConfiguratorMetrics | null) => void;
  onClearFilters?: () => void;
  sourceFilters?: UIFilters;
  onSourceFiltersChange?: (filters: UIFilters) => void;
  sourceFilterDrawerConfig?: ExploreModeMetricSourceFilterDrawerConfig;
  onRemove?: () => void;
  availableMetrics: TChartConfiguratorMetrics[];
  filterSummary?: string;
  customEventResource?: RAQIV2ChartResource;
};

const useStyles = makeStyles()((theme) => ({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    minHeight: '32px',
  },
  headerLabel: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    color: 'var(--content-emphasis)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  filterSummary: {
    fontSize: '12px',
    lineHeight: '16px',
    color: 'var(--content-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  expandedBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  filterChipsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '6px',
  },
  filterChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.surface[200],
    fontSize: '12px',
    lineHeight: '16px',
    color: 'var(--content-default)',
    whiteSpace: 'nowrap',
  },
  addFilterRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryActionsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
  },
}));

const ChartConfiguratorMetricSourceCard: FC<ChartConfiguratorMetricSourceCardProps> = ({
  variableKey,
  metric,
  isExpanded,
  onToggleExpand,
  onMetricChange,
  onClearFilters,
  sourceFilters,
  onSourceFiltersChange,
  sourceFilterDrawerConfig,
  onRemove,
  availableMetrics,
  filterSummary,
  customEventResource,
}) => {
  const {
    classes: {
      card,
      headerRow,
      headerLabel,
      filterSummary: filterSummaryClass,
      expandedBody,
      filterChipsRow,
      filterChip,
      addFilterRow,
      secondaryActionsRow,
    },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const metricBadgePrefix = tPendingTranslation(
    'Metric',
    'Badge label prefix identifying a card as a metric source (e.g. "Metric A").',
    translationKey('Label.ExploreMode.Metric', TranslationNamespace.Analytics),
  );
  const noMetricSelectedLabel = tPendingTranslation(
    'No metric selected',
    'Text shown on a metric source card when no metric has been chosen yet.',
    translationKey('Label.ExploreMode.NoMetricSelected', TranslationNamespace.Analytics),
  );
  const editMetricSourceLabel = tPendingTranslation(
    'Edit metric source',
    'Tooltip for the button to expand and edit a metric source configuration.',
    translationKey('Action.ExploreMode.EditMetricSource', TranslationNamespace.Analytics),
  );
  const doneLabel = tPendingTranslation(
    'Done',
    'Label on a Done button',
    translationKey('Action.Done', TranslationNamespace.Analytics),
  );
  const selectMetricLabel = tPendingTranslation(
    'Select metric',
    'Label for the metric dropdown inside an expanded metric source card.',
    translationKey('Label.ExploreMode.SelectMetric', TranslationNamespace.Analytics),
  );
  const addFilterLabel = tPendingTranslation(
    'Add filter',
    'Button label to add a dimension filter to a metric source.',
    translationKey('Action.ExploreMode.AddFilter', TranslationNamespace.Analytics),
  );
  const clearFiltersLabel = tPendingTranslation(
    'Clear filters',
    'Button label to remove all applied dimension filters from a metric source.',
    translationKey('Action.ExploreMode.ClearFilters', TranslationNamespace.Analytics),
  );
  const removeLabel = tPendingTranslation(
    'Remove',
    'Button label to remove a metric source card from the equation builder.',
    translationKey('Action.Remove', TranslationNamespace.Analytics),
  );
  const filtersPrefixLabel = tPendingTranslation(
    'Filters',
    'Label prefix shown before the list of applied filter chips on a metric source card.',
    translationKey('Label.ExploreMode.Filters', TranslationNamespace.Analytics),
  );

  const sourceLabel = tPendingTranslation(
    'Source',
    'Label for the source category dropdown inside an expanded metric source card.',
    translationKey('Label.ExploreMode.Source', TranslationNamespace.Analytics),
  );

  const [selectedSourceCategory, setSelectedSourceCategory] = useState<TranslationKey | null>(() =>
    initMetricSourceCategoryFromMetric(metric),
  );

  const isCustomEvents = metric === customEventsMetric;
  const isSourceCustomEvents = isCustomEventsSource(selectedSourceCategory);

  const filteredMetrics = useMemo(
    () =>
      filterMetricsForSource(
        availableMetrics,
        selectedSourceCategory,
        isSourceCustomEvents,
        translate,
      ),
    [availableMetrics, selectedSourceCategory, isSourceCustomEvents, translate],
  );

  const handleSourceChange = useCallback(
    (newSource: TranslationKey | null) => {
      const result = computeSourceChange(newSource, metric, translate);
      setSelectedSourceCategory(newSource);
      if (result.nextMetric !== 'keep') {
        onMetricChange(result.nextMetric);
      }
    },
    [metric, translate, onMetricChange],
  );

  const resolvedApiMetrics = useMemo((): TRAQIV2APIMetric[] => {
    if (!metric) {
      return [];
    }
    if (isValidEnumValue(RAQIV2UIMetric, metric)) {
      return [
        getAPIMetricFromUIMetric(metric, {
          percentile: null,
          aggregationType: null,
        }),
      ];
    }
    return [metric];
  }, [metric]);

  const metricLabel = useMemo(() => {
    if (!metric) {
      return null;
    }
    if (metric === customEventsMetric) {
      const customEventName = getFilterValueForDimension(
        sourceFilters ?? emptyFilters,
        RAQIV2Dimension.CustomEventName,
        null,
      );
      if (customEventName) {
        return customEventName;
      }
    }
    const { localizedName } = getAnalyticsMetricDisplayConfig(metric);
    return localizedName ? translate(localizedName) : null;
  }, [metric, sourceFilters, translate]);

  const selectEventTypeError = tPendingTranslation(
    'Select an event type to use Custom Events',
    'Validation error shown when a Custom Events metric source is missing an event type selection.',
    translationKey('Error.ExploreMode.SelectEventType', TranslationNamespace.Analytics),
  );

  const isReady = useMemo(() => {
    if (!metric) {
      return false;
    }
    if (metric === customEventsMetric) {
      const eventName = getFilterValueForDimension(
        sourceFilters ?? emptyFilters,
        RAQIV2Dimension.CustomEventName,
        null,
      );
      return eventName != null && eventName.length > 0;
    }
    return true;
  }, [metric, sourceFilters]);

  const validationError =
    metric && !isReady && metric === customEventsMetric ? selectEventTypeError : null;

  if (!isExpanded) {
    return (
      <div className={`${card} bg-surface-100 stroke-standard stroke-default radius-medium`}>
        <div className={headerRow}>
          <Badge variant='Neutral' label={`${metricBadgePrefix} ${variableKey}`} />
          <span className={headerLabel}>{metricLabel ?? noMetricSelectedLabel}</span>
          {validationError && (
            <Icon
              name='icon-filled-triangle-exclamation'
              size='Medium'
              className='content-system-warning'
            />
          )}
          <IconButton
            icon='icon-filled-pencil'
            variant='Utility'
            size='Small'
            ariaLabel={editMetricSourceLabel}
            onClick={onToggleExpand}
          />
        </div>
        {validationError && (
          <span className='text-caption-medium content-system-warning'>{validationError}</span>
        )}
        {filterSummary && (
          <span className={filterSummaryClass}>{`${filtersPrefixLabel}: ${filterSummary}`}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`${card} bg-surface-100 stroke-standard stroke-default radius-medium`}>
      <div className={headerRow}>
        <Badge variant='Neutral' label={`${metricBadgePrefix} ${variableKey}`} />
        <span className={headerLabel}>{metricLabel ?? noMetricSelectedLabel}</span>
        <Button variant='Emphasis' size='Small' onClick={onToggleExpand}>
          {doneLabel}
        </Button>
      </div>

      <div className={expandedBody}>
        <ChartConfiguratorSourceSelector
          value={selectedSourceCategory}
          onChange={handleSourceChange}
          availableMetrics={availableMetrics}
          label={sourceLabel}
        />

        {!isSourceCustomEvents && (
          <ChartConfiguratorMetricSelector
            options={filteredMetrics}
            value={metric}
            onChange={onMetricChange}
            label={selectMetricLabel}
          />
        )}

        {isCustomEvents && customEventResource && onSourceFiltersChange && (
          <ChartConfiguratorCustomEventControls
            resource={customEventResource}
            filters={sourceFilters ?? emptyFilters}
            onFiltersChange={onSourceFiltersChange}
            hasEventTypeError={!isReady}
          />
        )}

        {validationError && (
          <div className='flex items-center gap-small'>
            <Icon
              name='icon-filled-triangle-exclamation'
              size='Small'
              className='content-system-warning'
            />
            <span className='text-caption-medium content-system-warning'>{validationError}</span>
          </div>
        )}

        {sourceFilters && sourceFilters.length > 0 && (
          <div className={filterChipsRow}>
            {sourceFilters.map((filter) => (
              <span key={`${filter.dimension}-${filter.values.join(',')}`} className={filterChip}>
                {`${filter.dimension}: ${filter.values.join(', ')}`}
              </span>
            ))}
          </div>
        )}

        <div className={addFilterRow}>
          {metric && sourceFilterDrawerConfig && onSourceFiltersChange ? (
            <SourceMetricContextProvider metrics={resolvedApiMetrics}>
              <ExperienceAnalyticsFilterDrawerButton
                resource={sourceFilterDrawerConfig.resource}
                dimensions={sourceFilterDrawerConfig.dimensions}
                filters={sourceFilters ?? emptyFilters}
                onFiltersChange={onSourceFiltersChange}
                triggerVariant='utilityPlus'
                triggerLabel={addFilterLabel}
              />
            </SourceMetricContextProvider>
          ) : (
            <Button variant='Utility' size='Small' icon='icon-filled-plus-large' isDisabled>
              {addFilterLabel}
            </Button>
          )}
        </div>

        {((onClearFilters && filterSummary) ?? onRemove) && (
          <div className={secondaryActionsRow}>
            {onClearFilters && filterSummary && (
              <Button variant='Utility' size='Small' onClick={onClearFilters}>
                {clearFiltersLabel}
              </Button>
            )}
            {onRemove && (
              <Button variant='Utility' size='Small' onClick={onRemove}>
                {removeLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartConfiguratorMetricSourceCard;
