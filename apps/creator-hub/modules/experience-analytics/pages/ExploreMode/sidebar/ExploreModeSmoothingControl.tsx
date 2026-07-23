import React, { FC } from 'react';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';

export type SmoothingOption = 'none' | 'l7-moving-average';

type ExploreModeSmoothingControlProps = {
  value: SmoothingOption;
  onChange: (value: SmoothingOption) => void;
};

const ExploreModeSmoothingControl: FC<ExploreModeSmoothingControlProps> = ({ value, onChange }) => {
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

  return (
    <RadioGroup
      groupLabel={smoothingLabel}
      size='Small'
      value={value}
      onValueChange={(v) => onChange(v as SmoothingOption)}>
      <Radio value='none' label={noneLabel} />
      <Radio value='l7-moving-average' label={l7MovingAverageLabel} />
    </RadioGroup>
  );
};

export default ExploreModeSmoothingControl;
