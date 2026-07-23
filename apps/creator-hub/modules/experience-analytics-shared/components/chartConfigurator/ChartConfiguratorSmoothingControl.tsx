import type { FC } from 'react';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  isSmoothingOption,
  SmoothingOptionValue,
  type SmoothingOption,
} from '../../chartConfigurator/smoothingOptions';
import type { L7SmoothingDisabledReason } from '../../exploreMode/l7SmoothingEligibility';
import RadioWithDisabledTooltip from './components/RadioWithDisabledTooltip';

export type { SmoothingOption };

type ChartConfiguratorSmoothingControlProps = {
  value: SmoothingOption;
  onChange: (value: SmoothingOption) => void;
  isL7Disabled?: boolean;
  l7SmoothingDisabledReason?: L7SmoothingDisabledReason | null;
};

const ChartConfiguratorSmoothingControl: FC<ChartConfiguratorSmoothingControlProps> = ({
  value,
  onChange,
  isL7Disabled = false,
  l7SmoothingDisabledReason = null,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const smoothingLabel = tPendingTranslation(
    'Smoothing',
    'Group label for the data smoothing options radio group.',
    translationKey('Label.ExploreMode.Smoothing', TranslationNamespace.Analytics),
  );
  const noneLabel = tPendingTranslation(
    'None',
    'Default view for the chart.',
    translationKey('Label.None', TranslationNamespace.Analytics),
  );
  const l7MovingAverageLabel = tPendingTranslation(
    'L7 moving average',
    'Radio option for the last-7-day moving average smoothing algorithm.',
    translationKey('Label.ExploreMode.Smoothing.L7MovingAverage', TranslationNamespace.Analytics),
  );
  const l7DisabledForDurationChartTooltip = tPendingTranslation(
    'L7 smoothing is not available for duration charts',
    'Tooltip shown when the L7 smoothing option is disabled because a duration chart is selected.',
    translationKey(
      'Label.ExploreMode.Smoothing.L7NotApplicableForDurationChart',
      TranslationNamespace.Analytics,
    ),
  );
  const l7DisabledForCumulativeGranularityTooltip = tPendingTranslation(
    'Rolling average is not available for cumulative metrics',
    'Tooltip shown when the L7 smoothing option is disabled because cumulative granularity is selected.',
    translationKey(
      'Label.ExploreMode.Smoothing.L7CumulativeDisabled',
      TranslationNamespace.Analytics,
    ),
  );
  const l7DisabledTooltip =
    l7SmoothingDisabledReason === 'cumulative-granularity'
      ? l7DisabledForCumulativeGranularityTooltip
      : l7DisabledForDurationChartTooltip;

  // When L7 is disabled for the current chart type, keep the user's stored
  // preference in `value` but display `none` so the group reflects what's
  // actually being applied to the chart.
  const displayValue: SmoothingOption = isL7Disabled ? SmoothingOptionValue.None : value;

  return (
    <RadioGroup
      groupLabel={smoothingLabel}
      size='Small'
      value={displayValue}
      onValueChange={(v) => {
        if (isSmoothingOption(v)) {
          onChange(v);
        }
      }}>
      <Radio value={SmoothingOptionValue.None} label={noneLabel} />
      <RadioWithDisabledTooltip
        value={SmoothingOptionValue.L7MovingAverage}
        label={l7MovingAverageLabel}
        isDisabled={isL7Disabled}
        tooltipText={l7DisabledTooltip}
      />
    </RadioGroup>
  );
};

export default ChartConfiguratorSmoothingControl;
