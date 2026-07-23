import { translationKey } from '@modules/analytics-translations';
import {
  getGranularityOptionsForMetric,
  granularityLabels,
  RAQIV2ChartContext,
  UIGranularities,
  useAnalyticsCurrentDateRangeBundle,
  useAnalyticsCurrentGranularityBundle,
  useExperienceAnalyticsExploreModeContext,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, makeStyles, MenuItem, Select, Tooltip } from '@rbx/ui';
import React, { FC, useCallback, useMemo } from 'react';

type ExploreModeGranularityControlProps = {
  chartContext: RAQIV2ChartContext;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    margin: '0 8px 16px 0',
    width: '220px',
    [theme.breakpoints.down('XSmall')]: {
      width: '150px',
    },
  },
}));

/**
 * This component depends on ExploreModeContext, which determines the available granularities
 * according to the selected metric and the current date range (start date and duration).
 */
const ExploreModeGranularityControl: FC<ExploreModeGranularityControlProps> = ({
  chartContext,
}) => {
  const {
    classes: { root },
  } = useStyles();
  const { metric } = useExperienceAnalyticsExploreModeContext();
  const { translate } = useRAQIV2TranslationDependencies();
  const { onChangeGranularity } = useAnalyticsCurrentGranularityBundle();

  const dateTimeBundle = useAnalyticsCurrentDateRangeBundle();
  const granularityMenuItems = useMemo(() => {
    if (!metric) {
      return [];
    }

    return getGranularityOptionsForMetric({
      metric,
      startDate: dateTimeBundle.startDate,
      endDate: dateTimeBundle.endDate,
      breakdown: chartContext.breakdown,
    }).map(({ granularity, ...option }) => {
      if (!option.isAllowed) {
        return (
          <Tooltip key={granularity} title={translate(option.messageKey)} placement='left' arrow>
            <div>
              <MenuItem value={granularity} disabled>
                {translate(granularityLabels[granularity])}
              </MenuItem>
            </div>
          </Tooltip>
        );
      }

      return (
        <MenuItem key={granularity} value={granularity}>
          {translate(granularityLabels[granularity])}
        </MenuItem>
      );
    });
  }, [chartContext.breakdown, dateTimeBundle.endDate, dateTimeBundle.startDate, metric, translate]);

  const onGranularityChangeEvent = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const newGranularity = event.target.value;
      if (isValidArrayEnumValue(UIGranularities, newGranularity)) {
        onChangeGranularity(newGranularity);
      }
    },
    [onChangeGranularity],
  );

  return (
    <Grid item>
      <Select
        classes={{ root }}
        label={translate(translationKey('Label.Granularity', TranslationNamespace.Analytics))}
        data-testid='select'
        value={chartContext.granularity}
        onChange={onGranularityChangeEvent}>
        {granularityMenuItems}
      </Select>
    </Grid>
  );
};

export default ExploreModeGranularityControl;
