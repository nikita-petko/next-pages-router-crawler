import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Divider } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ComboboxTypeahead, {
  ComboboxTypeaheadOption,
} from '@modules/charts-generic/components/ComboboxTypeahead';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { groupMetricsByCategory, type MetricGroup } from './utils/chartConfiguratorMetricGrouping';

type ChartConfiguratorMetricSelectorProps = {
  options: TChartConfiguratorMetrics[];
  value: TChartConfiguratorMetrics | null;
  onChange: (value: TChartConfiguratorMetrics | null) => void;
  showCategoryLabels?: boolean;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
};

function filterGroups(groups: MetricGroup[], query: string): MetricGroup[] {
  if (!query) {
    return groups;
  }
  const lowerQuery = query.toLowerCase();
  return groups
    .map((group) => {
      const groupLabel = group.groupLabel;
      const groupMatches = groupLabel.toLowerCase().includes(lowerQuery);
      return {
        ...group,
        metrics: groupMatches
          ? group.metrics
          : group.metrics.filter((m) => m.label.toLowerCase().includes(lowerQuery)),
      };
    })
    .filter((group) => group.metrics.length > 0);
}

const ChartConfiguratorMetricSelector: FC<ChartConfiguratorMetricSelectorProps> = ({
  options,
  value,
  onChange,
  showCategoryLabels = true,
  label,
  placeholder,
  isRequired,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const metricSelectorLabel = tPendingTranslation(
    'Metric',
    'Label for the metric dropdown selector.',
    translationKey('Label.ExploreMode.MetricSelector', TranslationNamespace.Analytics),
  );
  const selectMetricPlaceholder = tPendingTranslation(
    'Select a metric',
    'Placeholder text in the metric dropdown before a metric is selected.',
    translationKey('Placeholder.ExploreMode.SelectMetric', TranslationNamespace.Analytics),
  );

  const groups = useMemo(() => groupMetricsByCategory(options, translate), [options, translate]);

  const selectedLabel = useMemo(() => {
    if (!value) {
      return '';
    }
    const match = groups.flatMap((group) => group.metrics).find((m) => m.metric === value);
    return match ? match.label : '';
  }, [value, groups]);

  const handleSelect = useCallback(
    (metric: TChartConfiguratorMetrics, close: () => void) => {
      onChange(metric);
      close();
    },
    [onChange],
  );

  return (
    <ComboboxTypeahead
      label={label ?? metricSelectorLabel}
      placeholder={placeholder ?? selectMetricPlaceholder}
      selectedLabel={selectedLabel}
      hasResults={groups.length > 0}
      isRequired={isRequired}>
      {({ searchText, close }) => {
        const filtered = filterGroups(groups, searchText);
        return filtered.map((group, idx) => (
          <React.Fragment key={group.groupKey.key}>
            {showCategoryLabels && idx > 0 && <Divider variant='Standard' />}
            <div className='padding-y-small'>
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

export default ChartConfiguratorMetricSelector;
