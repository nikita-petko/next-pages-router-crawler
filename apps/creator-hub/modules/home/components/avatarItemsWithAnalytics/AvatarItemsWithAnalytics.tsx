// NOTE(shumingxu, 10/28/2023): This is adapted from ../avatarItems/AvatarItems.tsx
// Keeping it as a separate component version since there are quite a couple scattered changes.
// Can deprecate the old AvatarItems component once this fully rolls out.
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Button, useMediaQuery, FileUploadOutlinedIcon } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AvatarItemDetailsDimension,
  AvatarItemDetailsRequest,
  AvatarItemDetailsResponse,
  AvatarItemDetailsSortOrder,
} from '@modules/clients/analytics';
import { urls, Asset, components } from '@modules/miscellaneous/common';
import { useMappedApiRequest, useOwner } from '@modules/experience-analytics-shared';
import { subDays } from '@rbx/core';
import { useAvatarAnalyticsClient } from '@modules/avatar-analytics/context/AvatarAnalyticsClientProvider';
import useAvatarItemDetailsRequest from '@modules/avatar-analytics/hooks/useAvatarItemDetailsRequest';
import { getShowMoreTileData } from '../../constants/tileConstants';
import Section from '../common/Section';
import SectionHeader from '../common/SectionHeader';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import AvatarItemWithAnalyticsTile from './AvatarItemWithAnalyticsTile';
import AvatarItemWithAnalyticsLoadingTile from './AvatarItemWithAnalyticsLoadingTile';

type TAvatarId = string & { _avatarID: TAvatarId };
const metricsDateRange = 7;
const { Carousel, LoadingCarousel } = components;
const AvatarItemsWithAnalytics: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const owner = useOwner();
  const avatarItemsClient = useAvatarAnalyticsClient();
  const { startTime, endTime, comparisonStartTime, comparisonEndTime } = useMemo(() => {
    const now = new Date();
    return {
      startTime: subDays(now, metricsDateRange),
      endTime: now,
      comparisonStartTime: subDays(now, 2 * metricsDateRange + 1),
      comparisonEndTime: subDays(now, metricsDateRange + 1),
    };
  }, []);
  const baseRequest: AvatarItemDetailsRequest | undefined = useMemo(
    () =>
      owner.isFetched
        ? {
            ...owner,
            startTime,
            endTime,
            sortOrder: AvatarItemDetailsSortOrder.Revenue,
            pagination: {
              pageSize: 10,
            },
          }
        : undefined,
    [endTime, owner, startTime],
  );

  const { data, isDataLoading } = useAvatarItemDetailsRequest(baseRequest, avatarItemsClient);
  const avatarItemIds = useMemo(() => data.map((item) => item.targetIdString as TAvatarId), [data]);

  const makeComparisonRequest = useCallback(
    async (targetIds: TAvatarId[]) => {
      if (!owner.isFetched) {
        return new Map();
      }
      const request = {
        ...owner,
        startTime: comparisonStartTime,
        endTime: comparisonEndTime,
        filters: [
          {
            dimension: AvatarItemDetailsDimension.TargetId,
            values: targetIds,
          },
        ],
      };
      const response: AvatarItemDetailsResponse =
        await avatarItemsClient.getAvatarItemDetails(request);
      return new Map(response?.values?.map((value) => [value.targetIdString as TAvatarId, value]));
    },
    [owner, comparisonStartTime, comparisonEndTime, avatarItemsClient],
  );
  const { data: comparisonData } = useMappedApiRequest(avatarItemIds, makeComparisonRequest);

  // Hide section if creator owns no items
  if (!isDataLoading && data.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeader
        header={translate('Heading.AvatarItemsOverview')}
        body={translate('Description.AvatarItemsRevenueSorted')}
        viewAllHref={urls.creatorHub.dashboard.getUrl(undefined, Asset.TShirt)}
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
              href={urls.creatorHub.dashboard.getUploadUrl(Asset.TShirt)}
              variant='outlined'>
              {translate('Action.UploadAsset')}
            </Button>
          )
        }
      />
      {isDataLoading ? (
        <LoadingCarousel>
          {new Array(10).fill(0).map((_, id) => (
            // eslint-disable-next-line react/no-array-index-key -- NOTE(jcountryman, 03/06/24): Not important since this are throwaway components that do not have a true lifecycle in application
            <AvatarItemWithAnalyticsLoadingTile key={id} />
          ))}
        </LoadingCarousel>
      ) : (
        <Carousel>
          {[
            ...data.map((dataValue) => ({
              id: dataValue.targetIdString ?? '',
              type: 'data' as const,
              item: dataValue,
              comparisonItem: comparisonData.get(dataValue.targetIdString as TAvatarId) ?? null,
              datePeriodLength: metricsDateRange,
            })),
            getShowMoreTileData(),
          ].map((item) => (
            <AvatarItemWithAnalyticsTile key={item.id} data={item} />
          ))}
        </Carousel>
      )}
    </Section>
  );
};

export default withTranslation(AvatarItemsWithAnalytics, [TranslationNamespace.Home]);
