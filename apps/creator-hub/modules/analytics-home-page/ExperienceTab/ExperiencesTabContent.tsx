import {
  DateRangeType,
  alignToUTCMidnight,
  formatSingleDate,
  useLocale,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  AnalyticsTabContentLayout,
  useAnalyticsCurrentDateRangeBundle,
  useAnalyticsWatchlist,
  useOwner,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { subDays } from '@rbx/core';
import MostRecentExperiencesTableWithZeroState from './MostRecentExperiencesTableWithZeroState';
import WatchlistExperienceUrlInput from './WatchlistExperienceUrlInput';
import WatchlistExperienceTiles from './WatchlistExperienceTiles';
import WatchlistZeroState from './WatchlistZeroState';

export type ExperiencesTabContentSpec = {
  forceNonStickyControlBar?: boolean;
};

const ExperiencesTabContent: FunctionComponent<ExperiencesTabContentSpec> = ({
  forceNonStickyControlBar,
}) => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const isMobileView = useMediaQuery((theme) => theme.breakpoints.down('XLarge'));
  const isNoDragDrop = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const { startDate, endDate, rangeType, onChangeRangeType } = useAnalyticsCurrentDateRangeBundle();
  // Force 7 day average for experiences
  useEffect(() => {
    if (rangeType !== DateRangeType.Last7Days) {
      onChangeRangeType(DateRangeType.Last7Days);
    }
  }, [rangeType, onChangeRangeType]);

  const { currentWatchlist } = useAnalyticsWatchlist();
  const owner = useOwner();
  const hasWatchlist = useMemo(
    () =>
      currentWatchlist?.watchlistItems?.itemIds?.length !== undefined &&
      currentWatchlist?.watchlistItems?.itemIds?.length > 0,
    [currentWatchlist?.watchlistItems?.itemIds?.length],
  );

  return (
    <AnalyticsTabContentLayout controls={[]} forceNonStickyControlBar={forceNonStickyControlBar}>
      <Grid container spacing={6} direction='column'>
        <Grid item>
          <Typography variant='body1'>
            {translate(
              translationKey('Description.DataFromDateRange', TranslationNamespace.Analytics),
              {
                startDate: formatSingleDate(locale, startDate),
                endDate: formatSingleDate(locale, subDays(alignToUTCMidnight(endDate), 1)),
              },
            )}
          </Typography>
        </Grid>
        <Grid item>
          <Grid container direction='row' justifyContent='space-between' alignItems='top'>
            <Grid item>
              <Grid container direction='column' spacing={1}>
                <Grid item>
                  <Typography variant='h2'>
                    {translate(translationKey('Heading.Watchlist', TranslationNamespace.Analytics))}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body1'>
                    {translate(
                      translationKey(
                        isNoDragDrop
                          ? 'Description.WatchlistNoDragAndDrop'
                          : 'Description.Watchlist',
                        TranslationNamespace.Analytics,
                      ),
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            {!isMobileView && hasWatchlist && (
              <Grid item>
                <WatchlistExperienceUrlInput />
              </Grid>
            )}
          </Grid>
        </Grid>
        {hasWatchlist ? (
          <Grid item data-testid='watchlist-tiles'>
            <WatchlistExperienceTiles />
          </Grid>
        ) : (
          <Grid item data-testid='watchlist-zero-state'>
            <WatchlistZeroState />
          </Grid>
        )}
        <Grid item>
          <Typography variant='h2'>
            {translate(
              translationKey('Heading.ExperiencesForName', TranslationNamespace.Analytics),
              {
                name: owner.isFetched ? owner?.ownerName : '',
              },
            )}
          </Typography>
        </Grid>
        <Grid item>
          <MostRecentExperiencesTableWithZeroState />
        </Grid>
      </Grid>
    </AnalyticsTabContentLayout>
  );
};

export default withTranslation(ExperiencesTabContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Home,
  TranslationNamespace.Insights,
]);
