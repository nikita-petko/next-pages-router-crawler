// NOTE(shumingxu, 10/28/2023): This is adapted from ../avatarItems/AvatarItems.tsx
// Keeping it as a separate component version since there are quite a couple scattered changes.
// Can deprecate the old AvatarItems component once this fully rolls out.
import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, useMediaQuery, FileUploadOutlinedIcon } from '@rbx/ui';
import type { AvatarItemDetail } from '@modules/clients/analytics';
import getRouteToAvatarItemCreationsPage from '@modules/creations/avatarItem/utils/avatarMenuNavigationUtils';
import type { TUseOwnerResult } from '@modules/experience-analytics-shared/context/useOwner';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import { Asset } from '@modules/miscellaneous/common';
import { Carousel } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { getShowMoreTileData } from '../../constants/tileConstants';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Section from '../common/Section';
import SectionHeader from '../common/SectionHeader';
import AvatarItemWithAnalyticsTile from './AvatarItemWithAnalyticsTile';
import useHomepageAvatarItems from './useHomepageAvatarItems';

type FetchedOwner = Extract<TUseOwnerResult, { isFetched: true }>;

const metricsDateRange = 7;

type AvatarItemsWithAnalyticsViewProps = {
  data: AvatarItemDetail[];
  comparisonData: ReadonlyMap<string, AvatarItemDetail | null>;
  isDataLoading: boolean;
  viewAllHref: string;
};

const AvatarItemsWithAnalyticsView: FunctionComponent<AvatarItemsWithAnalyticsViewProps> = ({
  data,
  comparisonData,
  isDataLoading,
  viewAllHref,
}) => {
  const { translate } = useTranslation();
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  // Render nothing until data resolves non-empty. Most sessions does not render avatar
  // section, so showing a loading skeleton for all sessions caused a skeleton to null collapse
  if (isDataLoading || data.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeader
        header={translate('Heading.AvatarItemsOverview')}
        body={translate('Description.AvatarItemsRevenueSorted')}
        viewAllHref={viewAllHref}
        onViewAllClick={() => {
          captureHomepageEvent('clickViewAll', EHomepageSection.AvatarItems);
        }}
        adornment={
          !isSm && (
            <Button
              component='a'
              key='UploadAsset'
              onClick={() => {
                captureHomepageEvent('clickUploadAsset', EHomepageSection.AvatarItems);
              }}
              size='small'
              color='primary'
              startIcon={<FileUploadOutlinedIcon />}
              href={creatorHub.dashboard.getUploadUrl(Asset.TShirt)}
              variant='outlined'>
              {translate('Action.UploadAsset')}
            </Button>
          )
        }
      />
      <Carousel>
        {[
          ...data.map((dataValue) => ({
            id: dataValue.targetIdString ?? '',
            type: 'data' as const,
            item: dataValue,
            comparisonItem: comparisonData.get(dataValue.targetIdString ?? '') ?? null,
            datePeriodLength: metricsDateRange,
          })),
          getShowMoreTileData(),
        ].map((item) => (
          <AvatarItemWithAnalyticsTile key={item.id} data={item} />
        ))}
      </Carousel>
    </Section>
  );
};

// Data source: RAQI V2 analytics gateway (sales/revenue + trend) plus the
// catalog API (item metadata).
const RaqiAvatarItemsWithAnalytics: FunctionComponent<{ owner: FetchedOwner }> = ({ owner }) => {
  const { data, comparisonData, isDataLoading } = useHomepageAvatarItems(owner);

  return (
    <AvatarItemsWithAnalyticsView
      data={data}
      comparisonData={comparisonData}
      isDataLoading={isDataLoading}
      viewAllHref={getRouteToAvatarItemCreationsPage()}
    />
  );
};

const AvatarItemsWithAnalytics: FunctionComponent<React.PropsWithChildren> = () => {
  const owner = useOwner();

  if (!owner.isFetched) {
    return null;
  }

  return <RaqiAvatarItemsWithAnalytics owner={owner} />;
};

export default withTranslation(AvatarItemsWithAnalytics, [TranslationNamespace.Home]);
