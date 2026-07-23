import React, { FC, useMemo } from 'react';
import { TableContainer } from '@rbx/ui';
import {
  GenericChartState,
  GenericTable,
  GenericTablePaginationSpec,
  HeaderProps,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';

export enum AvatarItemsColumns {
  AvatarItem = 'AvatarItem',
  Category = 'Category',
  CreatedTime = 'CreatedTime',
  Sales = 'Sales',
  Revenue = 'Revenue',
}

export type AvatarItemsTableSpec = GenericChartState &
  GenericTablePaginationSpec & {
    sortOrder: AvatarItemsColumns;
    onSortColumnClick: (column: AvatarItemsColumns) => void;
  };

const AvatarItemsTable: FC<React.PropsWithChildren<AvatarItemsTableSpec>> = ({
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  total,
  page,
  pageSize,
  pageSizeOptions,
  setPageSize,
  onNextPage,
  onPreviousPage,
  hasNext,
  hasPrevious,
  sortOrder,
  onSortColumnClick,
  children,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const tableHeaders: HeaderProps<AvatarItemsColumns>[] = useMemo(
    () => [
      {
        columnKey: AvatarItemsColumns.AvatarItem,
        label: translate(translationKey('Label.AvatarItem', TranslationNamespace.AvatarAnalytics)),
        widthWeight: 40,
      },
      {
        columnKey: AvatarItemsColumns.Category,
        label: translate(translationKey('Label.Category', TranslationNamespace.AvatarAnalytics)),
        widthWeight: 15,
      },
      {
        columnKey: AvatarItemsColumns.CreatedTime,
        label: translate(translationKey('Label.CreatedTime', TranslationNamespace.AvatarAnalytics)),
        align: 'right',
        widthWeight: 15,
        sort: {
          direction: 'desc',
          active: sortOrder === AvatarItemsColumns.CreatedTime,
          onClick: () => {
            onSortColumnClick(AvatarItemsColumns.CreatedTime);
          },
        },
      },
      {
        columnKey: AvatarItemsColumns.Sales,
        label: translate(translationKey('Label.Sales', TranslationNamespace.AvatarAnalytics)),
        widthWeight: 15,
        align: 'right',
        sort: {
          direction: 'desc',
          active: sortOrder === AvatarItemsColumns.Sales,
          onClick: () => {
            onSortColumnClick(AvatarItemsColumns.Sales);
          },
        },
      },
      {
        columnKey: AvatarItemsColumns.Revenue,
        label: translate(translationKey('Label.Revenue', TranslationNamespace.AvatarAnalytics)),
        widthWeight: 15,
        align: 'right',
        sort: {
          direction: 'desc',
          active: sortOrder === AvatarItemsColumns.Revenue,
          onClick: () => {
            onSortColumnClick(AvatarItemsColumns.Revenue);
          },
        },
      },
    ],
    [onSortColumnClick, sortOrder, translate],
  );

  const pagination = useMemo(
    () => ({
      total,
      page,
      pageSize,
      pageSizeOptions,
      setPageSize,
      onNextPage,
      onPreviousPage,
      hasNext,
      hasPrevious,
    }),
    [
      hasNext,
      hasPrevious,
      onNextPage,
      onPreviousPage,
      page,
      pageSize,
      pageSizeOptions,
      setPageSize,
      total,
    ],
  );

  return (
    <TableContainer>
      <GenericTable
        isDataLoading={isDataLoading}
        isResponseFailed={isResponseFailed}
        isUserForbidden={isUserForbidden}
        headers={tableHeaders}
        pagination={pagination}>
        {children}
      </GenericTable>
    </TableContainer>
  );
};

export default AvatarItemsTable;
