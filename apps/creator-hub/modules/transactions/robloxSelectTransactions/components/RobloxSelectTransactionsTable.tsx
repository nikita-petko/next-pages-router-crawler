import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ProgressCircle,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericTablePagination, {
  unknownDueToCursorBasedPagination,
} from '@modules/charts-generic/tables/GenericTablePagination';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFetchRobloxSelectTransactions } from '@modules/react-query/transactionRecords/transactionRecordsQueries';
import EmptyResultsCard from '../../components/EmptyResultsCard/EmptyResultsCard';
import VirtualTransactionCell from '../../virtualTransactions/components/VirtualTransactionCell';
import {
  canGoNext,
  canGoPrevious,
  currentCursor,
  INITIAL_CURSOR_STACK,
  popCursor,
  pushCursor,
} from '../../virtualTransactions/constants/virtualPagination';
import {
  VirtualColumns,
  VirtualColumnType,
} from '../../virtualTransactions/constants/VirtualTableInfo';
import { mapV1TransactionToRecord } from '../utils/mapV1TransactionToRecord';
import styles from '../../virtualTransactions/components/VirtualTransactionsTable.module.css';

export type RobloxSelectTransactionsTableProps = {
  // Exactly one of userId / groupId. groupId takes precedence.
  userId?: number;
  groupId?: number;
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [DEFAULT_PAGE_SIZE, 25, 50, 100];

const RobloxSelectTransactionsTable: FunctionComponent<
  React.PropsWithChildren<RobloxSelectTransactionsTableProps>
> = ({ userId, groupId }) => {
  const intl = useTranslation();
  const { translate } = useTranslationWrapper(intl);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  // The pagination logic diverfes from VirtualTransactionsTable due to the
  // different API endpoints / cursor types.
  // Stack of opaque v1 nextPageCursors; '' is the first page. One server page per UI page via
  // `limit` + `cursor` (not Virtual's v2 block fetch + client-side slice).
  const [pageStack, setPageStack] = useState<string[]>(() => [...INITIAL_CURSOR_STACK]);

  const cursor = currentCursor(pageStack);

  const { data, isLoading, isFetching, error, refetch } = useFetchRobloxSelectTransactions({
    userId,
    groupId,
    limit: pageSize,
    cursor: cursor || undefined,
  });

  const rows = useMemo(
    () => (data?.data ?? []).map((row) => mapV1TransactionToRecord(row)),
    [data?.data],
  );

  // Only advance when the server hands back a non-empty nextPageCursor. An empty/null cursor means
  // the current page is the last — do not keep Next enabled off a stale stack entry.
  const nextCursor = data?.nextPageCursor ?? null;
  const hasNext = canGoNext(!!nextCursor, nextCursor) && !isFetching;
  const hasPrevious = canGoPrevious(pageStack) && !isFetching;
  // 0-based page index for GenericTablePagination ("1–10", "11–20", …).
  const page = pageStack.length - 1;

  const onNextPage = useCallback(() => {
    if (isFetching || !nextCursor) {
      return;
    }
    setPageStack((stack) => pushCursor(stack, nextCursor));
  }, [isFetching, nextCursor]);

  const onPreviousPage = useCallback(() => {
    if (isFetching || !canGoPrevious(pageStack)) {
      return;
    }
    setPageStack((stack) => popCursor(stack));
  }, [isFetching, pageStack]);

  const onSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageStack([...INITIAL_CURSOR_STACK]);
  }, []);

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const responseStatus = getResponseFromError(error)?.status;
  const isForbidden = responseStatus === 403;
  const isRateLimited = responseStatus === 429;

  // Clear the previous page while the next cursor fetch is in flight (avoid stale rows under a
  // new "11–20" / "101–110" label from keepPreviousData).
  if (isLoading || isFetching) {
    return (
      <div className='flex justify-center' data-testid='roblox-select-transactions-loading-id'>
        <ProgressCircle variant='Indeterminate' ariaLabel={intl.translate('Label.Loading')} />
      </div>
    );
  }

  if (error) {
    const message = isForbidden
      ? translate(translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics))
      : isRateLimited
        ? translate(translationKey('Message.RateLimited', TranslationNamespace.Transactions))
        : translate(
            translationKey('Message.TransactionsLoadError', TranslationNamespace.Transactions),
          );
    const showBack = !isForbidden && hasPrevious;
    return (
      <Alert
        data-testid='roblox-select-transactions-error-id'
        severity='Error'
        variant='Feedback'
        hasCloseAffordance={false}
        primaryActionLabel={
          isForbidden
            ? undefined
            : translate(translationKey('Action.Retry', TranslationNamespace.Transactions))
        }
        onPrimaryAction={isForbidden ? undefined : onRetry}
        secondaryActionLabel={
          showBack
            ? translate(translationKey('Action.Back', TranslationNamespace.Controls))
            : undefined
        }
        onSecondaryAction={showBack ? onPreviousPage : undefined}>
        {message}
      </Alert>
    );
  }

  if (rows.length === 0) {
    return <EmptyResultsCard />;
  }

  const columnHeader = (columnType: VirtualColumnType) => {
    switch (columnType) {
      case VirtualColumnType.Date:
        return translate(translationKey('Label.DateIssued', TranslationNamespace.Transactions));
      case VirtualColumnType.Source:
        return translate(translationKey('Label.Source', TranslationNamespace.Transactions));
      case VirtualColumnType.TransactionType:
        return translate(translationKey('Label.Type', TranslationNamespace.Transactions));
      case VirtualColumnType.Status:
        return translate(translationKey('Label.Status', TranslationNamespace.Transactions));
      case VirtualColumnType.Amount:
      default:
        return translate(translationKey('Label.Amount', TranslationNamespace.Transactions));
    }
  };

  return (
    <>
      <div className='width-full radius-medium clip stroke-standard stroke-default'>
        <div className={styles.scrollX}>
          <Table size='Medium' variant='Divided'>
            <TableHeader>
              <TableRow>
                {VirtualColumns.map((columnType) => (
                  <TableHeaderCell
                    key={columnType}
                    align={columnType === VirtualColumnType.Amount ? 'end' : undefined}>
                    <span className='content-emphasis'>{columnHeader(columnType)}</span>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  // eslint-disable-next-line react/no-array-index-key -- v1 rows may lack a stable id
                  key={index}
                  data-testid='table-row-id'>
                  {VirtualColumns.map((columnType) => (
                    <VirtualTransactionCell
                      key={`${columnType}-${index}`}
                      columnType={columnType}
                      record={row.record}
                      counterPartyName={row.agentName}
                    />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <GenericTablePagination
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={onSetPageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        page={page}
        total={unknownDueToCursorBasedPagination}
      />
    </>
  );
};

export default RobloxSelectTransactionsTable;
