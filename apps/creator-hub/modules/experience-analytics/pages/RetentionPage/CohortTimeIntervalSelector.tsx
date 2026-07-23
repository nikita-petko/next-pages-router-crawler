import React, { FC, useCallback } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { makeStyles, MenuItem, Select } from '@rbx/ui';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { CohortTimeInterval, cohortTimeIntervals } from './useRetentionCohortPagination';

const timeIntervalLabels: Record<CohortTimeInterval, TranslationKey> = {
  [RAQIV2MetricGranularity.OneDay]: translationKey(
    'Label.Granularity.Daily',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.OneWeek]: translationKey(
    'Label.Granularity.Weekly',
    TranslationNamespace.Analytics,
  ),
};

const useStyles = makeStyles()((theme) => ({
  timeIntervalSelector: {
    width: '220px',
    [theme.breakpoints.down('XSmall')]: {
      width: '150px',
    },
  },
}));

type CohortTimeIntervalSelectorProps = {
  timeInterval: CohortTimeInterval;
  onTimeIntervalUpdate: (timeInterval: CohortTimeInterval) => void;
};

const CohortTimeIntervalSelector: FC<CohortTimeIntervalSelectorProps> = ({
  timeInterval,
  onTimeIntervalUpdate,
}) => {
  const {
    classes: { timeIntervalSelector },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const handleTimeIntervalChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const given = event.target.value as CohortTimeInterval;
      onTimeIntervalUpdate(given);
    },
    [onTimeIntervalUpdate],
  );

  return (
    <Select
      label={translate(translationKey('Label.Granularity', TranslationNamespace.Analytics))}
      variant='outlined'
      data-testid='select'
      value={timeInterval}
      onChange={handleTimeIntervalChange}
      classes={{ root: timeIntervalSelector }}
      size='small'>
      {cohortTimeIntervals.map((granularity) => (
        <MenuItem key={granularity} value={granularity}>
          {translate(timeIntervalLabels[granularity])}
        </MenuItem>
      ))}
    </Select>
  );
};

export default CohortTimeIntervalSelector;
