import React, { FC, useCallback, useMemo, useState } from 'react';
import {
  AvatarItemDetailsDimension,
  AvatarItemDetailsRequest,
  AvatarItemDetailsResponse,
  AvatarItemDetailsSortOrder,
  AvatarItemSalesType,
  AvatarItemType,
} from '@modules/clients/analytics';
import {
  NonRAQIUIDimension,
  avatarFilterDimensions,
  getFilterValueForDimension,
  useAnalyticsCurrentDateRangeBundle,
  useMappedApiRequest,
  useNonRAQIAnalyticsCurrentFilterBundle,
  useOwner,
} from '@modules/experience-analytics-shared';
import {
  DailyTimeSeriesAlignedToUTCMidnight,
  comparisonTimeRangeOffset,
  getComparisonChipSpec,
  getComparisonTimeRange,
} from '@modules/charts-generic';
import { useAvatarAnalyticsClient } from '../context/AvatarAnalyticsClientProvider';
import AvatarItemsTable, { AvatarItemsColumns } from './AvatarItemsTable';
import AvatarItemsTableRow from './AvatarItemsTableRow';
import useAvatarItemDetailsRequest from '../hooks/useAvatarItemDetailsRequest';

type AvatarItemsSortableColumns =
  | AvatarItemsColumns.Revenue
  | AvatarItemsColumns.Sales
  | AvatarItemsColumns.CreatedTime;
const SortColumnToSortOrder: Record<AvatarItemsSortableColumns, AvatarItemDetailsSortOrder> = {
  [AvatarItemsColumns.Sales]: AvatarItemDetailsSortOrder.SalesCount,
  [AvatarItemsColumns.Revenue]: AvatarItemDetailsSortOrder.Revenue,
  [AvatarItemsColumns.CreatedTime]: AvatarItemDetailsSortOrder.CreatedTime,
};

type AvatarID = string & { _avatarID: AvatarID };

const AvatarItemsTableContent: FC<{ showLimitedFilterBar: boolean }> = ({
  showLimitedFilterBar,
}) => {
  const avatarItemsClient = useAvatarAnalyticsClient();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const { filters } = useNonRAQIAnalyticsCurrentFilterBundle(avatarFilterDimensions);
  const avatarItemTypeFilterValue = getFilterValueForDimension<AvatarItemType>(
    filters,
    NonRAQIUIDimension.AvatarItemCategory,
    null,
  );
  const salesTypeFilterValue = getFilterValueForDimension<AvatarItemSalesType>(
    filters,
    NonRAQIUIDimension.SalesType,
    null,
  );

  const [sortOrder, setSortOrder] = useState<AvatarItemsSortableColumns>(
    AvatarItemsColumns.Revenue,
  );
  const owner = useOwner();
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
      sortOrder: SortColumnToSortOrder[sortOrder],
      filters: [
        ...(avatarItemTypeFilterValue
          ? [
              {
                dimension: AvatarItemDetailsDimension.TargetType,
                values: [avatarItemTypeFilterValue],
              },
            ]
          : []),
        ...(showLimitedFilterBar && salesTypeFilterValue
          ? [
              {
                dimension: AvatarItemDetailsDimension.SalesType,
                values: [salesTypeFilterValue],
              },
            ]
          : []),
      ],
    };
  }, [
    owner,
    startDate,
    endDate,
    sortOrder,
    avatarItemTypeFilterValue,
    showLimitedFilterBar,
    salesTypeFilterValue,
  ]);

  const {
    data,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    page,
    total,
    nextPage,
    previousPage,
    pageSize,
    setPageSize,
    hasNext,
    hasPrevious,
  } = useAvatarItemDetailsRequest(baseRequest, avatarItemsClient);

  const makeComparisonRequest = useCallback(
    async (targetIds: AvatarID[]) => {
      if (!owner.isFetched) {
        return new Map();
      }
      const request = {
        ...owner,
        startTime: comparisonStartDate,
        endTime: comparisonEndDate,
        filters: [
          {
            dimension: AvatarItemDetailsDimension.TargetId,
            values: targetIds,
          },
        ],
      };
      const response: AvatarItemDetailsResponse =
        await avatarItemsClient.getAvatarItemDetails(request);
      return new Map(response?.values?.map((value) => [value.targetIdString as AvatarID, value]));
    },
    [owner, comparisonStartDate, comparisonEndDate, avatarItemsClient],
  );

  const { data: comparisonData } = useMappedApiRequest(
    data.map((item) => item.targetIdString as AvatarID),
    makeComparisonRequest,
  );

  const childrenRows = useMemo(() => {
    return data.map((avatarItemDetail) => (
      <AvatarItemsTableRow
        key={avatarItemDetail.targetIdString}
        avatarItemDetail={avatarItemDetail}
        salesComparisonChipSpec={
          avatarItemDetail.targetIdString
            ? getComparisonChipSpec({
                isPositiveGood: true,
                current: avatarItemDetail.salesCount ?? 0,
                previous:
                  comparisonData?.get(avatarItemDetail.targetIdString as AvatarID)?.salesCount ?? 0,
              })
            : undefined
        }
        revenueComparisonChipSpec={
          avatarItemDetail.targetIdString
            ? getComparisonChipSpec({
                isPositiveGood: true,
                current: avatarItemDetail.revenue ?? 0,
                previous:
                  comparisonData?.get(avatarItemDetail.targetIdString as AvatarID)?.revenue ?? 0,
              })
            : undefined
        }
      />
    ));
  }, [comparisonData, data]);

  const trySetOrder = useCallback((column: AvatarItemsColumns) => {
    if (
      column === AvatarItemsColumns.Revenue ||
      column === AvatarItemsColumns.Sales ||
      column === AvatarItemsColumns.CreatedTime
    ) {
      setSortOrder(column);
    }
  }, []);

  return (
    <AvatarItemsTable
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      total={total}
      page={page}
      pageSize={pageSize}
      pageSizeOptions={[10, 20, 50, 100]}
      setPageSize={setPageSize}
      onNextPage={nextPage}
      onPreviousPage={previousPage}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      sortOrder={sortOrder}
      onSortColumnClick={trySetOrder}>
      {childrenRows}
    </AvatarItemsTable>
  );
};

export default AvatarItemsTableContent;
