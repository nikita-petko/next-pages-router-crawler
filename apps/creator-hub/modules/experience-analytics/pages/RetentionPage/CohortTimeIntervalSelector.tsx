import type { FC } from 'react';
import React, { useCallback } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { makeStyles, MenuItem, Select } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CohortTimeInterval } from './useRetentionCohortPagination';
import { cohortTimeIntervals } from './useRetentionCohortPagination';

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
