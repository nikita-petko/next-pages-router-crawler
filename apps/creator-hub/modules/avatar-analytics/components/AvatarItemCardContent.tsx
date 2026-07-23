import React, { FC, useCallback, useMemo } from 'react';
import {
  AnalyticsHeroItemCategory,
  HeroItemCardStyles,
  useAnalyticsCurrentDateRangeBundle,
  useApiRequest,
  useOwner,
} from '@modules/experience-analytics-shared';
import {
  AvatarItemDetail,
  AvatarItemDetailsDimension,
  AvatarItemDetailsRequest,
  AvatarItemDetailsSortOrder,
  AvatarItemType,
} from '@modules/clients/analytics';
import { useMediaQuery } from '@rbx/ui';
import {
  DailyTimeSeriesAlignedToUTCMidnight,
  comparisonTimeRangeOffset,
  getComparisonChipSpec,
  getComparisonTimeRange,
} from '@modules/charts-generic';
import { useAvatarAnalyticsClient } from '../context/AvatarAnalyticsClientProvider';
import AvatarItemCard from './AvatarItemCard';

type AvatarItemCardContentSpec = {
  topCategory: AnalyticsHeroItemCategory;
};

const topCategoryToSortOrder: Record<AnalyticsHeroItemCategory, AvatarItemDetailsSortOrder> = {
  [AnalyticsHeroItemCategory.TopSelling]: AvatarItemDetailsSortOrder.SalesCount,
  [AnalyticsHeroItemCategory.TopGrossing]: AvatarItemDetailsSortOrder.Revenue,
};

const getValueByTopCategory = (topCategory: AnalyticsHeroItemCategory, value: AvatarItemDetail) => {
  switch (topCategory) {
    case AnalyticsHeroItemCategory.TopSelling:
      return value.salesCount ?? 0;
    case AnalyticsHeroItemCategory.TopGrossing:
      return value.revenue ?? 0;
    default: {
      const exhaustiveCheck: never = topCategory;
      throw new Error(`Unhandled hero card category ${exhaustiveCheck}`);
    }
  }
};

const AvatarItemCardContent: FC<AvatarItemCardContentSpec> = ({ topCategory }) => {
  const avatarItemsClient = useAvatarAnalyticsClient();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const owner = useOwner();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const styleConfig = useMemo(
    () => (isCompactView ? HeroItemCardStyles.small : HeroItemCardStyles.large),
    [isCompactView],
  );
  const { comparisonStartDate, comparisonEndDate } = useMemo(
    () =>
      getComparisonTimeRange(
        startDate,
        endDate,
        DailyTimeSeriesAlignedToUTCMidnight,
        comparisonTimeRangeOffset.useOffsetForInclusiveDateRange,
      ),
    [startDate, endDate],
  );

  const baseRequest: AvatarItemDetailsRequest | undefined = useMemo(() => {
    if (!owner.isFetched) {
      return undefined;
    }
    return {
      ...owner,
      startTime: startDate,
      endTime: endDate,
      sortOrder: topCategoryToSortOrder[topCategory],
      pagination: {
        pageSize: 1,
      },
    };
  }, [owner, startDate, endDate, topCategory]);

  const fetchAvatarItemDetail = useCallback(async () => {
    if (baseRequest) {
      return avatarItemsClient.getAvatarItemDetails(baseRequest);
    }
    return undefined;
  }, [avatarItemsClient, baseRequest]);
  const { data, isDataLoading, isResponseFailed, isUserForbidden } =
    useApiRequest(fetchAvatarItemDetail);

  const avatarItem = useMemo(() => (data?.values?.length ? data.values[0] : null), [data?.values]);

  const fetchComparison = useCallback(async () => {
    if (!avatarItem || !avatarItem?.targetIdString || !owner.isFetched) {
      return null;
    }
    const comparisonResponse = await avatarItemsClient.getAvatarItemDetails({
      ...owner,
      startTime: comparisonStartDate,
      endTime: comparisonEndDate,
      filters: [
        {
          dimension: AvatarItemDetailsDimension.TargetId,
          values: [avatarItem.targetIdString],
        },
      ],
    });
    const comparisonItem = comparisonResponse?.values?.length ? comparisonResponse.values[0] : null;
    if (!comparisonItem) {
      return null;
    }
    return getComparisonChipSpec({
      isPositiveGood: true,
      current: getValueByTopCategory(topCategory, avatarItem),
      previous: getValueByTopCategory(topCategory, comparisonItem),
    });
  }, [avatarItem, avatarItemsClient, owner, comparisonStartDate, comparisonEndDate, topCategory]);

  const { data: comparisonChipSpec } = useApiRequest(fetchComparison);

  if (!avatarItem) {
    return null;
  }
  const { targetId, targetType, name } = avatarItem;

  return (
    <AvatarItemCard
      targetId={targetId ?? 0}
      itemType={targetType ?? AvatarItemType.TShirt}
      avatarItemName={name ?? ''}
      value={avatarItem ? getValueByTopCategory(topCategory, avatarItem) : null}
      topCategory={topCategory}
      comparisonChipSpec={comparisonChipSpec ?? undefined}
      styleConfig={styleConfig}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
    />
  );
};

export default AvatarItemCardContent;
