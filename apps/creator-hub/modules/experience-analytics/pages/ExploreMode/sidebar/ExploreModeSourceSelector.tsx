import { FC, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  codegenExploreModeMetricToGroup,
  TExploreModeMetrics,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { RAQIV2MetricDisplayConfig } from '@rbx/creator-hub-analytics-config';
import {
  translationKey,
  TranslationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { ComboboxTypeahead, ComboboxTypeaheadOption } from '@modules/charts-generic';
import { isCustomEventsSource } from './useExploreModeSourceSelection';
import { getGroupSortIndex } from './utils/exploreMetricGrouping';

type ExploreModeSourceSelectorProps = {
  value: TranslationKey | null;
  onChange: (value: TranslationKey | null) => void;
  availableMetrics: readonly TExploreModeMetrics[];
};

type SourceOption = {
  key: TranslationKey | null;
  id: string;
  label: string;
};

const ALL_SOURCES_ID = '$__ALL__$';

const ExploreModeSourceSelector: FC<ExploreModeSourceSelectorProps> = ({
  value,
  onChange,
  availableMetrics,
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
  const sourceRequiredLabel = tPendingTranslation(
    'Source *',
    'Label for the required source dropdown selector. The asterisk indicates the field is required.',
    translationKey('Label.ExploreMode.SourceRequired', TranslationNamespace.Analytics),
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
      if (!config.exploreMode || config.exploreMode.disabled || !config.exploreMode.group) return;
      const groupKey = codegenExploreModeMetricToGroup(metric);
      const id = groupKey.key;
      if (seen.has(id)) return;
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
      label={sourceRequiredLabel}
      placeholder={selectSourcePlaceholder}
      selectedLabel={selectedOption?.label ?? ''}
      hasResults={sourceOptions.length > 0}>
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

export default ExploreModeSourceSelector;
