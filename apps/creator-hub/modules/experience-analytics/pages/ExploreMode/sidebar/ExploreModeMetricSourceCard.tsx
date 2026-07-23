import React, { FC, useMemo } from 'react';
import { Badge, Button, IconButton } from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ExperienceAnalyticsFilterDrawerButton,
  getAnalyticsMetricDisplayConfig,
  TExploreModeMetrics,
  type UIFilters,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { useTranslation } from '@rbx/intl';
import ExploreModeMetricSelector from './ExploreModeMetricSelector';

export type ExploreModeMetricSourceFilterDrawerConfig = Pick<
  React.ComponentProps<typeof ExperienceAnalyticsFilterDrawerButton>,
  'resource' | 'dimensions'
>;

type ExploreModeMetricSourceCardProps = {
  variableKey: string;
  metric: TExploreModeMetrics | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMetricChange: (metric: TExploreModeMetrics | null) => void;
  onClearFilters?: () => void;
  sourceFilters?: UIFilters;
  onSourceFiltersChange?: (filters: UIFilters) => void;
  sourceFilterDrawerConfig?: ExploreModeMetricSourceFilterDrawerConfig;
  onRemove?: () => void;
  availableMetrics: TExploreModeMetrics[];
  filterSummary?: string;
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

const ExploreModeMetricSourceCard: FC<ExploreModeMetricSourceCardProps> = ({
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
  const selectMetricPlaceholder = tPendingTranslation(
    'Select a metric',
    'Placeholder text in the metric dropdown before a metric is selected.',
    translationKey('Placeholder.ExploreMode.SelectMetric', TranslationNamespace.Analytics),
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

  const metricLabel = useMemo(() => {
    if (!metric) return null;
    const { localizedName } = getAnalyticsMetricDisplayConfig(metric);
    const translatedLabel = localizedName ? translate(localizedName) : null;
    return (translatedLabel || `[${metric}]?`) as FormattedText;
  }, [metric, translate]);

  if (!isExpanded) {
    return (
      <div className={`${card} bg-surface-100 stroke-standard stroke-default radius-small`}>
        <div className={headerRow}>
          <Badge variant='Neutral' label={`${metricBadgePrefix} ${variableKey}`} />
          <span className={headerLabel}>{metricLabel ?? noMetricSelectedLabel}</span>
          <IconButton
            icon='icon-filled-pencil'
            variant='Utility'
            size='Small'
            ariaLabel={editMetricSourceLabel}
            onClick={onToggleExpand}
          />
        </div>
        {filterSummary && (
          <span className={filterSummaryClass}>{`${filtersPrefixLabel}: ${filterSummary}`}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`${card} bg-surface-100 stroke-standard stroke-default radius-small`}>
      <div className={headerRow}>
        <Badge variant='Neutral' label={`${metricBadgePrefix} ${variableKey}`} />
        <span className={headerLabel}>{metricLabel ?? noMetricSelectedLabel}</span>
        <Button variant='Emphasis' size='Small' onClick={onToggleExpand}>
          {doneLabel}
        </Button>
      </div>

      <div className={expandedBody}>
        <ExploreModeMetricSelector
          options={availableMetrics}
          value={metric}
          onChange={onMetricChange}
          label={selectMetricLabel}
          placeholder={selectMetricPlaceholder}
        />

        {sourceFilters && sourceFilters.length > 0 && (
          <div className={filterChipsRow}>
            {sourceFilters.map((filter) => (
              <span
                key={`${String(filter.dimension)}-${filter.values.join(',')}`}
                className={filterChip}>
                {`${String(filter.dimension)}: ${filter.values.join(', ')}`}
              </span>
            ))}
          </div>
        )}

        <div className={addFilterRow}>
          {metric && sourceFilterDrawerConfig && onSourceFiltersChange ? (
            <ExperienceAnalyticsFilterDrawerButton
              resource={sourceFilterDrawerConfig.resource}
              dimensions={sourceFilterDrawerConfig.dimensions}
              filters={sourceFilters ?? []}
              onFiltersChange={onSourceFiltersChange}
              triggerVariant='utilityPlus'
              triggerLabel={addFilterLabel}
            />
          ) : (
            <Button variant='Utility' size='Small' icon='icon-filled-plus-large' isDisabled>
              {addFilterLabel}
            </Button>
          )}
        </div>

        {((onClearFilters && filterSummary) || onRemove) && (
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

export default ExploreModeMetricSourceCard;
