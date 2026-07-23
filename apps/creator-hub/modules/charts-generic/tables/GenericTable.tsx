import React, { PropsWithChildren, useMemo } from 'react';

import { Table, TableHead, TableRow } from '@rbx/ui';

import { GenericChartState } from '../charts/types/ChartTypes';
import GenericTablePagination, { GenericTablePaginationSpec } from './GenericTablePagination';
import GenericTableHeader, { GenericTableHeaderProps } from './GenericTableHeader';
import GenericTableBodyWrapper from './GenericTableBodyWrapper';

export type HeaderProps<TColumnKey> = Omit<GenericTableHeaderProps<TColumnKey>, 'width'> & {
  widthWeight: number;
};

type GenericTableProps<TColumnKey> = GenericChartState & {
  headers: HeaderProps<TColumnKey>[];
  pagination?: GenericTablePaginationSpec;
  showNoDataMessage?: boolean;
};

const GenericTable = <TColumnKey extends string | number>({
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  showNoDataMessage,
  pagination,
  headers,
  children,
}: PropsWithChildren<GenericTableProps<TColumnKey>>) => {
  const totalWidth = useMemo(
    () => headers.reduce((prev, curr) => prev + curr.widthWeight, 0),
    [headers],
  );

  const isColumnKeyDistinct = useMemo(
    () => new Set(headers.map((header) => header.columnKey)).size === headers.length,
    [headers],
  );
  if (!isColumnKeyDistinct) {
    throw new Error('column keys are not distinct');
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <GenericTableHeader
              {...header}
              key={header.columnKey}
              width={(100 * header.widthWeight) / totalWidth}
            />
          ))}
        </TableRow>
      </TableHead>
      <GenericTableBodyWrapper
        columns={headers.length}
        isDataLoading={isDataLoading}
        isUserForbidden={isUserForbidden}
        isResponseFailed={isResponseFailed}
        showNoDataMessage={showNoDataMessage || pagination?.total === 0}>
        {children}
      </GenericTableBodyWrapper>
      {pagination && <GenericTablePagination {...pagination} />}
    </Table>
  );
};

export default GenericTable;
