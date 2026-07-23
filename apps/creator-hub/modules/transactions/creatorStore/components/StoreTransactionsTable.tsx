import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import type {
  RobloxMarketplaceFiatSharedV1Beta1Payout as Payout,
  RobloxMarketplaceFiatSharedV1Beta1PurchaserPayment as PurchaserPayment,
  RobloxMarketplaceFiatSharedV1Beta1SellerPayment as SellerPayemnt,
  RobloxMarketplaceFiatSharedV1Beta1PurchasePriceFilter as PurchasePriceFilter,
} from '@rbx/client-marketplace-fiat-service/v1';
import { useTranslation } from '@rbx/intl';
import {
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
} from '@rbx/ui';
import GenericTablePagination, {
  unknownDueToCursorBasedPagination,
} from '@modules/charts-generic/tables/GenericTablePagination';
import {
  useFetchSellerPayouts,
  useFetchSellerPayments,
  useFetchPurchaserPayments,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceQueries';
import EmptyResultsCard from '../../components/EmptyResultsCard/EmptyResultsCard';
import { StoreTableType } from '../constants/StoreTableType';
import type { ColumnType } from '../constants/TableInfo';
import { ColumnTypesToTranslationKey, ColumnsMap } from '../constants/TableInfo';
import PaymentsCell from './payments/PaymentsCell';
import PayoutsCell from './payouts/PayoutsCell';
import useStoreTransactionsTableStyles from './StoreTransactionsTable.styles';

export type StoreTransactionsTableProps = {
  tableType: StoreTableType;
  startDate?: Date;
  endDate?: Date;
  priceFilter?: PurchasePriceFilter;
};

const StoreTransactionsTable: FunctionComponent<
  React.PropsWithChildren<StoreTransactionsTableProps>
> = ({ tableType, startDate, endDate, priceFilter }) => {
  const { translate } = useTranslation();
  const { classes: styles } = useStoreTransactionsTableStyles();
  const [pageSize, setPageSize] = useState<number>(10);
  const [isNavigatingBackwards, setIsNavigatingBackwards] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string>('');
  const pageSizeOptions = [10, 25, 50, 100];
  const columns = useMemo(() => ColumnsMap.get(tableType) || [], [tableType]);

  // Payouts
  const { data: sellerPayoutsData, isPending: isSellerPayoutsLoading } = useFetchSellerPayouts(
    pageSize,
    cursor,
    isNavigatingBackwards,
    tableType === StoreTableType.Payouts,
  );

  // Incoming Payments
  const { data: incomingPaymentsData, isPending: isIncomingPaymentsLoading } =
    useFetchSellerPayments(
      pageSize,
      cursor,
      isNavigatingBackwards,
      startDate,
      endDate,
      priceFilter,
      tableType === StoreTableType.IncomingPayments,
    );

  // Outgoing Payments
  const { data: outgoingPaymentsData, isPending: isOutgoingPaymentsLoading } =
    useFetchPurchaserPayments(
      pageSize,
      cursor,
      isNavigatingBackwards,
      startDate,
      endDate,
      priceFilter,
      tableType === StoreTableType.OutgoingPayments,
    );

  let pageInfo = sellerPayoutsData?.pageInfo;
  if (tableType === StoreTableType.IncomingPayments) {
    pageInfo = incomingPaymentsData?.pageInfo;
  } else if (tableType === StoreTableType.OutgoingPayments) {
    pageInfo = outgoingPaymentsData?.pageInfo;
  } else if (tableType === StoreTableType.Payouts) {
    pageInfo = sellerPayoutsData?.pageInfo;
  }

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(pageInfo?.hasMore || false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);

  useEffect(() => {
    // reset navigation state when changing table type, dates, or price filter
    setIsNavigatingBackwards(false);
    setCursor('');
    setHasPrevious(false);
    setCurrentPage(0);
  }, [tableType, startDate, endDate, priceFilter]);

  useEffect(() => {
    if (isNavigatingBackwards) {
      setHasPrevious(pageInfo?.hasMore || false);
    } else {
      setHasNext(pageInfo?.hasMore || false);
    }
  }, [isNavigatingBackwards, pageInfo?.hasMore]);

  const onNextPage = useCallback(() => {
    setIsNavigatingBackwards(false);
    setCursor(pageInfo?.nextCursor || '');
    setHasNext(pageInfo?.hasMore || false);
    setHasPrevious(true);
  }, [pageInfo?.hasMore, pageInfo?.nextCursor]);

  const onPreviousPage = useCallback(() => {
    setIsNavigatingBackwards(true);
    setCursor(pageInfo?.previousCursor || '');
    setHasNext(true);
    setHasPrevious(pageInfo?.hasMore || false);
  }, [pageInfo?.hasMore, pageInfo?.previousCursor]);

  // If we change the page size, we need to reset the cursor and previous state
  const onSetPageSize = useCallback((newNumber: number) => {
    setPageSize(newNumber);
    setCursor('');
    setIsNavigatingBackwards(false);
    setHasPrevious(false);
    setCurrentPage(0);
  }, []);

  const renderPaymentsData = useCallback(
    (data: PurchaserPayment | SellerPayemnt, index: number) => {
      return (
        <TableRow key={index} data-testid='table-row-id'>
          {columns.map((columnType: ColumnType) => {
            return (
              <PaymentsCell key={`${columnType}-${index}`} columnType={columnType} rowData={data} />
            );
          })}
        </TableRow>
      );
    },
    [columns],
  );

  const renderPayoutsData = useCallback(
    (data: Payout, index: number) => {
      return (
        <TableRow key={index} data-testid='table-row-id'>
          {columns.map((columnType: ColumnType) => {
            return (
              <PayoutsCell key={`${columnType}-${index}`} columnType={columnType} rowData={data} />
            );
          })}
        </TableRow>
      );
    },
    [columns],
  );

  if (
    (tableType === StoreTableType.Payouts && isSellerPayoutsLoading) ||
    (tableType === StoreTableType.IncomingPayments && isIncomingPaymentsLoading) ||
    (tableType === StoreTableType.OutgoingPayments && isOutgoingPaymentsLoading)
  ) {
    return (
      <Grid container data-testid='eligibility-loading-id' item>
        <CircularProgress />
      </Grid>
    );
  }

  if (
    (tableType === StoreTableType.Payouts &&
      (!sellerPayoutsData || sellerPayoutsData?.payouts?.length === 0)) ||
    (tableType === StoreTableType.OutgoingPayments &&
      (!outgoingPaymentsData || outgoingPaymentsData?.purchaserPayments?.length === 0)) ||
    (tableType === StoreTableType.IncomingPayments &&
      (!incomingPaymentsData || incomingPaymentsData?.sellerPayments?.length === 0))
  ) {
    return <EmptyResultsCard />;
  }

  let renderedData;
  switch (tableType) {
    case StoreTableType.Payouts:
      renderedData = sellerPayoutsData?.payouts?.map(renderPayoutsData);
      break;
    case StoreTableType.IncomingPayments:
      renderedData = incomingPaymentsData?.sellerPayments?.map(renderPaymentsData);
      break;
    case StoreTableType.OutgoingPayments:
      renderedData = outgoingPaymentsData?.purchaserPayments?.map(renderPaymentsData);
      break;
    default:
      break;
  }

  return (
    <TableContainer>
      <Table padding='normal' size='medium'>
        <TableHead>
          <TableRow>
            {columns?.map((columnType: ColumnType) => (
              <TableCell className={styles.tableHeaderCell} key={columnType}>
                {ColumnTypesToTranslationKey.get(columnType) === ''
                  ? ''
                  : translate(ColumnTypesToTranslationKey.get(columnType) || '')}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{renderedData}</TableBody>
        <GenericTablePagination
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          setPageSize={(newNumber) => onSetPageSize(newNumber)}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          page={currentPage} // does not matter, since we are using cursor based pagination
          total={unknownDueToCursorBasedPagination}
        />
      </Table>
    </TableContainer>
  );
};

export default StoreTransactionsTable;
