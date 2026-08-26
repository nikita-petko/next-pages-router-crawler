import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GroupedComboboxSelect, {
  type GroupedComboboxGroup,
} from '@modules/charts-generic/components/GroupedComboboxSelect';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import useChartConfiguratorMetricOptionState from '../../chartConfigurator/useChartConfiguratorMetricOptionState';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { groupMetricsByCategory } from './utils/chartConfiguratorMetricGrouping';

type ChartConfiguratorMetricSelectorProps = {
  options: TChartConfiguratorMetrics[];
  value: TChartConfiguratorMetrics | null;
  onChange: (value: TChartConfiguratorMetrics | null) => void;
  showCategoryLabels?: boolean;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
};

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
  const performanceIneligibleReason = translate(
    translationKey('Message.PerformanceChartsNoPermission', TranslationNamespace.Analytics),
  );
  const optionStateByMetric = useChartConfiguratorMetricOptionState(options);

  const groups = useMemo<GroupedComboboxGroup[]>(
    () =>
      groupMetricsByCategory(options, translate).map((group) => ({
        id: group.groupKey.key,
        label: group.groupLabel,
        options: group.metrics.map(({ metric, label: metricLabel }) => {
          const optionState = optionStateByMetric.get(metric);
          const isDisabled = optionState?.disabled === true;
          return {
            value: metric,
            label: metricLabel,
            disabled: isDisabled,
            tooltip:
              isDisabled && optionState?.disabledReason === 'performanceIneligible'
                ? performanceIneligibleReason
                : undefined,
          };
        }),
      })),
    [optionStateByMetric, options, performanceIneligibleReason, translate],
  );

  // Map the string option value the combobox reports back to the typed metric.
  const metricByValue = useMemo(
    () => new Map<string, TChartConfiguratorMetrics>(options.map((metric) => [metric, metric])),
    [options],
  );
  const handleChange = useCallback(
    (next: string) => {
      const metric = metricByValue.get(next) ?? null;
      if (metric && optionStateByMetric.get(metric)?.disabled) {
        return;
      }
      onChange(metric);
    },
    [metricByValue, onChange, optionStateByMetric],
  );

  return (
    <GroupedComboboxSelect
      groups={groups}
      value={value}
      onChange={handleChange}
      label={label ?? metricSelectorLabel}
      placeholder={placeholder ?? selectMetricPlaceholder}
      isRequired={isRequired}
      showGroupLabels={showCategoryLabels}
      size='Medium'
    />
  );
};

export default ChartConfiguratorMetricSelector;
