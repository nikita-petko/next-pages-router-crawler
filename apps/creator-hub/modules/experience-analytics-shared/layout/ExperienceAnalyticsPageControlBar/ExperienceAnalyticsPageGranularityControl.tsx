import React, { FC, useCallback, useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MenuItem, Grid, Select, Tooltip } from '@rbx/ui';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import { useAnalyticsCurrentGranularityBundle } from '../../context/AnalyticsCurrentGranularityProvider';
import granularityLabels from '../../constants/granularityLabels';
import {
  TUIGranularity,
  UIGranularities,
  getAllowedGranularities,
} from '../../utils/seriesGranularities';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import RAQIV2ChartContext from '../../types/RAQIV2ChartContext';

type ExperienceAnalyticsPageGranularityControlProps = {
  granularityOptions: readonly TUIGranularity[];
  chartContext?: RAQIV2ChartContext;
};

/**
 * This component depends on AnalyticsCurrentGranularityProvider, which provides the current granularity
 * and a function to change the granularity.
 * It also depends on AnalyticsCurrentDateRangeBundleProvider, which provides the current date range
 * and a function to change the date range.
 */
/** @deprecated Use PageGranularityControl instead (DSA-5051). */
const ExperienceAnalyticsPageGranularityControl: FC<
  ExperienceAnalyticsPageGranularityControlProps
> = ({ granularityOptions: givenOptions, chartContext }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { granularity: currentGranularityFromBundle, onChangeGranularity } =
    useAnalyticsCurrentGranularityBundle();
  const currentGranularity = chartContext?.granularity ?? currentGranularityFromBundle;
  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();
  const dateTimeBundle = useAnalyticsCurrentDateRangeBundle();
  const unsupportedGranularity = useMemo(() => {
    return UIGranularities.filter(
      (granularity) => !givenOptions.includes(granularity) && currentGranularity === granularity,
    );
  }, [currentGranularity, givenOptions]);

  const granularityMenuItems = useMemo(() => {
    // eslint-disable-next-line deprecation/deprecation -- this component is itself deprecated (DSA-5051)
    const options = getAllowedGranularities({ ...dateTimeBundle, granularities: givenOptions });
    const result = options.map((granularity: TUIGranularity) => {
      const label = translate(granularityLabels[granularity]);
      return (
        <MenuItem key={granularity} value={granularity}>
          {label}
        </MenuItem>
      );
    });
    unsupportedGranularity.forEach(
      (granularity) => {
        const tooltip = translate(
          translationKey('Description.UnsupportedGranularity', TranslationNamespace.Analytics),
        );
        result.push(
          <Tooltip key={granularity} title={tooltip} placement='left' arrow>
            <div>
              <MenuItem value={granularity} disabled>
                {translate(granularityLabels[granularity])}
              </MenuItem>
            </div>
          </Tooltip>,
        );
      },
      [dateTimeBundle, givenOptions, translate],
    );
    return result;
  }, [dateTimeBundle, givenOptions, translate, unsupportedGranularity]);

  const onGranularityChangeEvent = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const newGranularity = event.target.value;
      if (isValidArrayEnumValue(UIGranularities, newGranularity)) {
        onChangeGranularity(newGranularity);
      }
    },
    [onChangeGranularity],
  );
  const selectorLabel = translate(
    translationKey('Label.Granularity', TranslationNamespace.Analytics),
  );

  return (
    <Grid item>
      <Select
        label={selectorLabel}
        className={controlBarSelector}
        data-testid='select'
        value={currentGranularity}
        onChange={onGranularityChangeEvent}>
        {granularityMenuItems}
      </Select>
    </Grid>
  );
};

// eslint-disable-next-line deprecation/deprecation -- kept until all consumers migrate (DSA-3131)
export default ExperienceAnalyticsPageGranularityControl;
