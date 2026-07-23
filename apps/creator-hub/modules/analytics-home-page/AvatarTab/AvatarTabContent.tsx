import { formatSingleDate, useLocale } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  AnalyticsTabContentLayout,
  ExperienceAnalyticsPageDateRangeControl,
  useAnalyticsCurrentDateRangeBundle,
  useOwner,
  useApiRequest,
  useRAQIV2TranslationDependencies,
  GenericAnalyticsLayoutItem,
  RAQIV2SpecialLayoutType,
} from '@modules/experience-analytics-shared';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Button, Grid, Link, Typography } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useAvatarAnalyticsClient } from '@modules/avatar-analytics/context/AvatarAnalyticsClientProvider';
import { urls, Asset, EmptyGrid } from '@modules/miscellaneous/common';
import { EmptyState, Flex } from '@modules/miscellaneous/common/components';
import TopAvatarItemsCards from './TopAvatarItemsCards';
import AvatarItemsTableWithFilters from './AvatarItemsTableWithFilters';
import AvatarSummaryTabbedCharts from './AvatarSummaryTabbedCharts';
import useAvatarTabContentStyles from './AvatarTabContent.styles';

const {
  creatorHub: { dashboard },
} = urls;
const minItemsToShow = {
  heroCards: 3,
  seeAllText: 200,
};

type AvatarTabContentSpec = {
  forceNonStickyControlBar?: boolean;
};

const makeTShirtLinkContent = (chunks: React.ReactNode) => {
  return (
    <Link href={dashboard.getUrl(undefined, Asset.TShirt)} target='_blank' underline='none'>
      {chunks}
    </Link>
  );
};

const AvatarTabContent: FunctionComponent<AvatarTabContentSpec> = ({
  forceNonStickyControlBar,
}) => {
  const locale = useLocale();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const owner = useOwner();
  const avatarItemsClient = useAvatarAnalyticsClient();

  const {
    classes: { zeroStateContainer, contentContainer },
  } = useAvatarTabContentStyles();

  const fetchTotalItemCount = useCallback(async () => {
    if (!owner.isFetched) return undefined;
    const apiResponse = await avatarItemsClient.getAvatarItemDetails({
      ...owner,
      startTime: startDate,
      endTime: endDate,
      pagination: {
        pageSize: 1,
      },
    });
    return apiResponse.total;
  }, [avatarItemsClient, endDate, owner, startDate]);

  const { data: totalItemCount, isDataLoading } = useApiRequest(fetchTotalItemCount);

  const hasMoreOrEqualItemsThan = useCallback(
    (count: number) => {
      if (!totalItemCount) {
        return false;
      }
      return totalItemCount >= count;
    },
    [totalItemCount],
  );

  const itemsData = useMemo(
    () => (
      <React.Fragment>
        {hasMoreOrEqualItemsThan(minItemsToShow.heroCards) && (
          <Grid item>
            <TopAvatarItemsCards data-testid='hero-cards' />
          </Grid>
        )}
        <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
          <AvatarSummaryTabbedCharts data-testid='summary-overview' />
        </GenericAnalyticsLayoutItem>
        {hasMoreOrEqualItemsThan(minItemsToShow.seeAllText) && (
          <Grid item>
            <Typography variant='body1' data-testid='see-all-text'>
              {translateHTML(
                translationKey(
                  'Description.SeeAllAvatarItems',
                  TranslationNamespace.AvatarAnalytics,
                ),
                [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    content: makeTShirtLinkContent,
                  },
                ],
              )}
            </Typography>
          </Grid>
        )}
        <Grid item>
          <AvatarItemsTableWithFilters data-testid='avatar-items-table' />
        </Grid>
      </React.Fragment>
    ),
    [hasMoreOrEqualItemsThan, translateHTML],
  );

  const zeroState = useMemo(
    () => (
      <Flex
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        classes={{ root: zeroStateContainer }}>
        <EmptyState
          title={translate(
            translationKey('Heading.AvatarZeroState', TranslationNamespace.AvatarAnalytics),
          )}
          description={translate(
            translationKey('Description.AvatarZeroState', TranslationNamespace.AvatarAnalytics),
          )}
          size='small'
          illustration='analytics'>
          <Button
            size='large'
            variant='contained'
            color='primary'
            data-testid='zero-state-cta-button'
            href={dashboard.getUrl(undefined, Asset.TShirt)}>
            {translate(
              translationKey('Action.AvatarZeroState', TranslationNamespace.AvatarAnalytics),
            )}
          </Button>
        </EmptyState>
      </Flex>
    ),
    [translate, zeroStateContainer],
  );

  const loadingGrid = useMemo(
    () => (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    ),
    [],
  );

  const itemDataOrZeroState = useMemo(() => {
    if (
      isDataLoading ||
      owner === undefined ||
      totalItemCount === undefined ||
      totalItemCount === null
    )
      return loadingGrid;
    return hasMoreOrEqualItemsThan(1) ? itemsData : zeroState;
  }, [
    hasMoreOrEqualItemsThan,
    isDataLoading,
    itemsData,
    loadingGrid,
    owner,
    totalItemCount,
    zeroState,
  ]);

  return (
    <AnalyticsTabContentLayout
      controls={[<ExperienceAnalyticsPageDateRangeControl key='date' />]}
      forceNonStickyControlBar={forceNonStickyControlBar}>
      <Flex classes={{ root: contentContainer }} flexDirection='column'>
        {hasMoreOrEqualItemsThan(1) && (
          <Grid item>
            <Typography variant='body1' data-testid='date-description'>
              {translate(
                translationKey('Description.DataFromDateRange', TranslationNamespace.Analytics),
                {
                  startDate: formatSingleDate(locale, startDate),
                  endDate: formatSingleDate(locale, endDate),
                },
              )}
            </Typography>
          </Grid>
        )}
        {itemDataOrZeroState}
      </Flex>
    </AnalyticsTabContentLayout>
  );
};

export default withTranslation(AvatarTabContent, [
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
]);
