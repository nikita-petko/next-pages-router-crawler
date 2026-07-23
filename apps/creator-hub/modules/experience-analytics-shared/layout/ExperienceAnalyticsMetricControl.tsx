import React, { useCallback, useMemo } from 'react';
import { AutocompleteChoiceControl } from '@modules/charts-generic';
import { FormattedText, translationKey, TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAnalyticsMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';
import { codegenExploreModeMetricToGroup } from '../exploreMode/codegenExploreModeMetricGrouping';

const defaultMetricGroupLabel = <T extends TRAQIV2NumericUIMetric>(option: T) =>
  codegenExploreModeMetricToGroup(option);

type ExperienceAnalyticsMetricControlProps<T extends TRAQIV2NumericUIMetric> = {
  options: T[];
  value: T | null;
  setMetric: (value: T | null) => void;
  getGroupLabel?: (option: T) => TranslationKey;
};

const ExperienceAnalyticsMetricControl = <T extends TRAQIV2NumericUIMetric>({
  options,
  value: currentMetric,
  setMetric,
  getGroupLabel,
}: ExperienceAnalyticsMetricControlProps<T>) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const getOptionLabel = useCallback(
    (option: T) => {
      const { localizedName } = getAnalyticsMetricDisplayConfig(option);
      return (localizedName && translate(localizedName)) || (`[${option}]?` as FormattedText);
    },
    [translate],
  );

  const metricSelectorLabel = translate(
    translationKey('Label.ExploreModeMetric', TranslationNamespace.Analytics),
  );

  const groupBy = useMemo(
    () =>
      getGroupLabel
        ? (option: T) => translate(getGroupLabel(option) ?? defaultMetricGroupLabel(option))
        : (option: T) => translate(defaultMetricGroupLabel(option)),
    [getGroupLabel, translate],
  );

  return (
    <AutocompleteChoiceControl
      options={options}
      value={currentMetric}
      setValue={setMetric}
      getOptionFormattedLabel={getOptionLabel}
      selectorLabel={metricSelectorLabel}
      groupBy={groupBy}
    />
  );
};

export default ExperienceAnalyticsMetricControl;
