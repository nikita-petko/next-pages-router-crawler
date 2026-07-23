import React, { FC, useCallback, useMemo } from 'react';
import { Divider } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  TExploreModeMetrics,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { ComboboxTypeahead, ComboboxTypeaheadOption } from '@modules/charts-generic';
import { groupMetricsByCategory, type MetricGroup } from './utils/exploreMetricGrouping';

type ExploreModeMetricSelectorProps = {
  options: TExploreModeMetrics[];
  value: TExploreModeMetrics | null;
  onChange: (value: TExploreModeMetrics | null) => void;
  showCategoryLabels?: boolean;
  label?: string;
  placeholder?: string;
};

function filterGroups(groups: MetricGroup[], query: string): MetricGroup[] {
  if (!query) return groups;
  const lowerQuery = query.toLowerCase();
  return groups
    .map((group) => {
      const groupLabel = `${group.groupLabel}`;
      const groupMatches = groupLabel.toLowerCase().includes(lowerQuery);
      return {
        ...group,
        metrics: groupMatches
          ? group.metrics
          : group.metrics.filter((m) => `${m.label}`.toLowerCase().includes(lowerQuery)),
      };
    })
    .filter((group) => group.metrics.length > 0);
}

const ExploreModeMetricSelector: FC<ExploreModeMetricSelectorProps> = ({
  options,
  value,
  onChange,
  showCategoryLabels = true,
  label,
  placeholder,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const metricRequiredLabel = tPendingTranslation(
    'Metric *',
    'Label for the required metric dropdown selector. The asterisk indicates the field is required.',
    translationKey('Label.ExploreMode.MetricRequired', TranslationNamespace.Analytics),
  );
  const selectMetricPlaceholder = tPendingTranslation(
    'Select a metric',
    'Placeholder text in the metric dropdown before a metric is selected.',
    translationKey('Placeholder.ExploreMode.SelectMetric', TranslationNamespace.Analytics),
  );

  const groups = useMemo(() => groupMetricsByCategory(options, translate), [options, translate]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const match = groups.flatMap((group) => group.metrics).find((m) => m.metric === value);
    return match ? match.label : '';
  }, [value, groups]);

  const handleSelect = useCallback(
    (metric: TExploreModeMetrics, close: () => void) => {
      onChange(metric);
      close();
    },
    [onChange],
  );

  return (
    <ComboboxTypeahead
      label={label ?? metricRequiredLabel}
      placeholder={placeholder ?? selectMetricPlaceholder}
      selectedLabel={selectedLabel}
      hasResults={groups.length > 0}>
      {({ searchText, close }) => {
        const filtered = filterGroups(groups, searchText);
        return filtered.map((group, idx) => (
          <React.Fragment key={group.groupKey.key}>
            {showCategoryLabels && idx > 0 && <Divider variant='Standard' />}
            <div role='group' className='padding-y-small'>
              {showCategoryLabels && (
                <div
                  role='none'
                  className='padding-x-medium padding-y-small text-caption-medium content-default bg-surface-100'
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}>
                  {group.groupLabel}
                </div>
              )}
              {group.metrics.map(({ metric, label: metricLabel }) => (
                <ComboboxTypeaheadOption
                  key={metric}
                  label={metricLabel}
                  isSelected={value === metric}
                  onClick={() => handleSelect(metric, close)}
                />
              ))}
            </div>
          </React.Fragment>
        ));
      }}
    </ComboboxTypeahead>
  );
};

export default ExploreModeMetricSelector;
