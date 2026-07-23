import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { RAQIV2MetricDisplayConfig } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ComboboxTypeahead, {
  ComboboxTypeaheadOption,
} from '@modules/charts-generic/components/ComboboxTypeahead';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import { codegenChartConfiguratorMetricToGroup } from '../../chartConfigurator/codegenChartConfiguratorMetricGrouping';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import { isCustomEventsSource } from './useChartConfiguratorSourceSelection';
import { getGroupSortIndex } from './utils/chartConfiguratorMetricGrouping';

type ChartConfiguratorSourceSelectorProps = {
  value: TranslationKey | null;
  onChange: (value: TranslationKey | null) => void;
  availableMetrics: readonly TChartConfiguratorMetrics[];
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
};

type SourceOption = {
  key: TranslationKey | null;
  id: string;
  label: string;
};

const ALL_SOURCES_ID = '$__ALL__$';

const ChartConfiguratorSourceSelector: FC<ChartConfiguratorSourceSelectorProps> = ({
  value,
  onChange,
  availableMetrics,
  label: labelOverride,
  placeholder: placeholderOverride,
  isRequired,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const allSourcesLabel = tPendingTranslation(
    'All sources',
    'Option label to show metrics from all data sources combined.',
    translationKey('Label.ExploreMode.AllSources', TranslationNamespace.Analytics),
  );
  const customLabel = tPendingTranslation(
    'Custom events',
    'Option label for the custom events source group in explore mode.',
    translationKey('Label.ExploreMode.CustomSource', TranslationNamespace.Analytics),
  );
  const sourceLabel = tPendingTranslation(
    'Source',
    'Label for the source dropdown selector.',
    translationKey('Label.ExploreMode.SourceSelector', TranslationNamespace.Analytics),
  );
  const selectSourcePlaceholder = tPendingTranslation(
    'Select a source',
    'Placeholder text in the source dropdown before a source is selected.',
    translationKey('Placeholder.ExploreMode.SelectSource', TranslationNamespace.Analytics),
  );

  const sourceOptions = useMemo<SourceOption[]>(() => {
    const allOption: SourceOption = {
      key: null,
      id: ALL_SOURCES_ID,
      label: allSourcesLabel,
    };
    const seen = new Map<string, SourceOption>();
    availableMetrics.forEach((metric) => {
      const config = RAQIV2MetricDisplayConfig[metric];
      if (!config.exploreMode || config.exploreMode.disabled || !config.exploreMode.group) {
        return;
      }
      const groupKey = codegenChartConfiguratorMetricToGroup(metric);
      const id = groupKey.key;
      if (seen.has(id)) {
        return;
      }
      const isCustomEvents = isCustomEventsSource(groupKey);
      const label = isCustomEvents ? customLabel : translate(groupKey) || '';
      seen.set(id, { key: groupKey, id, label });
    });
    const sorted = Array.from(seen.values()).sort(
      (a, b) =>
        getGroupSortIndex(a.id, a.key?.namespace) - getGroupSortIndex(b.id, b.key?.namespace),
    );
    return [allOption, ...sorted];
  }, [allSourcesLabel, customLabel, availableMetrics, translate]);

  const selectedOption = useMemo(
    () => sourceOptions.find((o) => (value ? o.id === value.key : o.id === ALL_SOURCES_ID)),
    [sourceOptions, value],
  );

  const handleSelect = useCallback(
    (option: SourceOption, close: () => void) => {
      onChange(option.key);
      close();
    },
    [onChange],
  );

  return (
    <ComboboxTypeahead
      label={labelOverride ?? sourceLabel}
      placeholder={placeholderOverride ?? selectSourcePlaceholder}
      selectedLabel={selectedOption?.label ?? ''}
      hasResults={sourceOptions.length > 0}
      isRequired={isRequired}
      renderListboxInPortal>
      {({ searchText, close }) => {
        const filtered = searchText
          ? sourceOptions.filter((o) => o.label.toLowerCase().includes(searchText.toLowerCase()))
          : sourceOptions;
        return filtered.map((option) => (
          <ComboboxTypeaheadOption
            key={option.id}
            label={option.label}
            isSelected={selectedOption?.id === option.id}
            onClick={() => handleSelect(option, close)}
          />
        ));
      }}
    </ComboboxTypeahead>
  );
};

export default ChartConfiguratorSourceSelector;
