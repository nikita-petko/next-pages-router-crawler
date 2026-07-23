import React, { FC, useCallback, useMemo } from 'react';
import { Button, Grid, useMediaQuery } from '@rbx/ui';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RecommendedEventType } from '@modules/clients/analytics';
import LiveEventsTable from './RecommendedEventsLiveEventsTable';
import useRecommendedEventsLiveEventsTableDialogStyles from './RecommendedEventsLiveEventsTableDialog.styles';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { useNonRAQIAnalyticsCurrentFilterBundle } from '../../../context/AnalyticsCurrentFilterBundleProvider';
import {
  type FilterBarConfig,
  recommendedEventsLiveEventsFilterDimensions,
} from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import { NonRAQIUIDimension } from '../../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import ExperienceAnalyticsPageFilterBarControl from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';

const EventTypeToTranslationKey: Record<RecommendedEventType, TranslationKey> = {
  [RecommendedEventType.EconomyEvents]: translationKey(
    'Label.Dimension.EventType.EconomyEvents',
    TranslationNamespace.Analytics,
  ),
  [RecommendedEventType.ProgressionEvents]: translationKey(
    'Label.Dimension.EventType.ProgressionEvents',
    TranslationNamespace.Analytics,
  ),
  [RecommendedEventType.CustomEvents]: translationKey(
    'Label.Dimension.EventType.CustomEvents',
    TranslationNamespace.Analytics,
  ),
  [RecommendedEventType.Invalid]: translationKey('Label.Invalid', TranslationNamespace.Analytics),
};

const filterOptions = [
  RecommendedEventType.EconomyEvents,
  RecommendedEventType.ProgressionEvents,
  RecommendedEventType.CustomEvents,
];

const RecommendedEventsLiveEventsTableWithFilters: FC<{
  defaultEventType: RecommendedEventType;
}> = ({ defaultEventType }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { dialogContent },
  } = useRecommendedEventsLiveEventsTableDialogStyles();

  const { filters, onFiltersChange } = useNonRAQIAnalyticsCurrentFilterBundle(
    recommendedEventsLiveEventsFilterDimensions,
  );

  const filterBarConfig: FilterBarConfig = useMemo(() => {
    return [
      {
        type: 'single',
        dimension: NonRAQIUIDimension.LiveEventType,
        dimensionNameKey: translationKey(
          'Label.Dimension.EventType',
          TranslationNamespace.Analytics,
        ),
        options: filterOptions,
        blankOption: defaultEventType,
        renderOption: (opt: RecommendedEventType) => {
          return translate(EventTypeToTranslationKey[opt]);
        },
      },
      {
        type: 'numeric-text',
        dimension: NonRAQIUIDimension.UserId,
        dimensionNameKey: translationKey(
          'Label.UserIdFilterPlaceholder',
          TranslationNamespace.Analytics,
        ),
      },
      {
        type: 'text',
        dimension: NonRAQIUIDimension.Text,
        dimensionNameKey: translationKey(
          'Label.TextFilterPlaceholder',
          TranslationNamespace.Analytics,
        ),
      },
    ];
  }, [defaultEventType, translate]);

  const clearLiveEventsFilters = useCallback(
    () =>
      onFiltersChange(
        filters.filter(
          ({ dimension }) =>
            !recommendedEventsLiveEventsFilterDimensions.find(
              (recommendedEventsDim) => recommendedEventsDim === dimension,
            ),
        ),
      ),
    [filters, onFiltersChange],
  );

  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const filterBarDirection = useMemo(() => (isCompactView ? 'column' : 'row'), [isCompactView]);

  return (
    <Grid container direction='column' className={dialogContent} spacing={3}>
      <Grid item>
        <Grid
          container
          justifyContent='space-between'
          direction={filterBarDirection}
          alignItems='stretch'
          wrap='nowrap'
          spacing={2}>
          <Grid item>
            <Grid
              container
              justifyContent='flex-start'
              direction={filterBarDirection}
              spacing={1}
              wrap='nowrap'>
              <ExperienceAnalyticsPageFilterBarControl
                config={filterBarConfig}
                filters={filters}
                onFiltersChange={onFiltersChange}
                showIconWithText={false}
              />
            </Grid>
          </Grid>
          <Grid item>
            <Button variant='contained' color='secondary' onClick={clearLiveEventsFilters}>
              {translate(translationKey('Action.ResetFilters', TranslationNamespace.Analytics))}
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <LiveEventsTable />
      </Grid>
    </Grid>
  );
};

export default RecommendedEventsLiveEventsTableWithFilters;
