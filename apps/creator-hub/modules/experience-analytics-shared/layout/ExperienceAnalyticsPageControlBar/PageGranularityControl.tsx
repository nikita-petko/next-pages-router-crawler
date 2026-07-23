import React, { FC, useCallback, useMemo } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MenuItem, Grid, Select, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { useAnalyticsCurrentGranularityBundle } from '../../context/AnalyticsCurrentGranularityProvider';
import granularityLabels from '../../constants/granularityLabels';
import { TUIGranularity, UIGranularities } from '../../utils/seriesGranularities';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import type { PageGranularityOption } from '../../utils/getPageGranularityOptions';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';

type PageGranularityControlProps = {
  options: PageGranularityOption[];
  chartContext?: RAQIV2ChartContext;
};

const PageGranularityControl: FC<PageGranularityControlProps> = ({ options, chartContext }) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { granularity: currentGranularityFromBundle, onChangeGranularity } =
    useAnalyticsCurrentGranularityBundle();
  const currentGranularity = chartContext?.granularity ?? currentGranularityFromBundle;
  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const granularityMenuItems = useMemo(
    () =>
      options.map(({ granularity, ...opt }) => {
        const label = translate(granularityLabels[granularity]);

        if (!opt.isAllowed) {
          const tooltip = translate(
            translationKey('Description.UnsupportedGranularity', TranslationNamespace.Analytics),
          );
          return (
            <Tooltip key={granularity} title={tooltip} placement='left' arrow>
              <div>
                <MenuItem value={granularity} disabled>
                  {label}
                </MenuItem>
              </div>
            </Tooltip>
          );
        }

        if (opt.isPartial) {
          const tooltip = tPendingTranslation(
            'Some charts on this page do not support this time interval.',
            'Tooltip on granularity options that only apply to some charts',
            translationKey('Description.PartialGranularitySupport', TranslationNamespace.Analytics),
          );
          return (
            <MenuItem key={granularity} value={granularity}>
              <Tooltip title={tooltip} placement='top' arrow>
                <span style={{ display: 'block', width: '100%' }}>{label}</span>
              </Tooltip>
            </MenuItem>
          );
        }

        return (
          <MenuItem key={granularity} value={granularity}>
            {label}
          </MenuItem>
        );
      }),
    [options, translate, tPendingTranslation],
  );

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

  const renderGranularityValue = useCallback(
    (val: unknown) => translate(granularityLabels[val as TUIGranularity]),
    [translate],
  );

  return (
    <Grid item>
      <Select
        label={selectorLabel}
        className={controlBarSelector}
        data-testid='select'
        value={currentGranularity}
        renderValue={renderGranularityValue}
        onChange={onGranularityChangeEvent}>
        {granularityMenuItems}
      </Select>
    </Grid>
  );
};

export default PageGranularityControl;
