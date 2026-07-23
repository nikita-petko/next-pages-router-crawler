import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FeedbackBanner,
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
import { LedgerReason } from '@modules/clients/transactionRecords';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useCounterPartyNames,
  useFetchTransactions,
} from '@modules/react-query/transactionRecords/transactionRecordsQueries';
import EmptyResultsCard from '../../components/EmptyResultsCard/EmptyResultsCard';
import {
  canGoNext,
  canGoPrevious,
  currentCursor,
  INITIAL_CURSOR_STACK,
  popCursor,
  pushCursor,
} from '../constants/virtualPagination';
import { VirtualColumns, VirtualColumnType } from '../constants/VirtualTableInfo';
import VirtualTransactionCell from './VirtualTransactionCell';
import styles from './VirtualTransactionsTable.module.css';

// How the current fetch resolved, from the viewer's access standpoint. 'allowed' covers success and
// non-403 errors (the chrome stays, the table surfaces its own error); 'forbidden' is a 403.
export type VirtualAccessState = 'allowed' | 'forbidden';

export type VirtualTransactionsTableProps = {
  // Exactly one of userId / groupId identifies the virtual. groupId takes precedence.
  userId?: number;
  groupId?: number;
  startTimeMillis?: number;
  endTimeMillis?: number;
  // Reports how the current fetch resolved so the parent can gate the surrounding chrome (banner,
  // date filter, export): it is left unreported during the initial load — so the parent keeps the
  // chrome hidden and avoids an allowed→blocked flash — then fires 'forbidden' on a 403 (viewer
  // lacks ViewGroupTransactions) or 'allowed' otherwise.
  onAccessChange?: (state: VirtualAccessState) => void;
};

const DEFAULT_PAGE_SIZE = 10;
// Fetch a block of records once and page through it client-side, so moving between pages inside a
// block needs no network round-trip; the cursor only advances when crossing a block boundary.
const BLOCK_SIZE = 100;

const VirtualTransactionsTable: FunctionComponent<
  React.PropsWithChildren<VirtualTransactionsTableProps>
> = ({ userId, groupId, startTimeMillis, endTimeMillis, onAccessChange }) => {
  const intl = useTranslation();
  const { translate } = useTranslationWrapper(intl);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  // Stack of the forward cursors for each fetched block; the top is the current block ('' = first
  // block). See virtualPagination for why the endpoint is forward-only. Reset by remounting via the
  // `key` on this component whenever the virtual or date range changes.
  const [blockStack, setBlockStack] = useState<string[]>(() => [...INITIAL_CURSOR_STACK]);
  // 0-based display page within the currently loaded block.
  const [pageInBlock, setPageInBlock] = useState<number>(0);

  const cursor = currentCursor(blockStack);

  const { data, isLoading, isFetching, error, refetch } = useFetchTransactions({
    userId,
    groupId,
    // Fetch a whole block; the visible page is sliced from it client-side.
    limit: BLOCK_SIZE,
    cursor: cursor || undefined,
    // The v2 endpoint requires an allowed ledgerReason; creator virtual transactions surface
    // sales. Omitting it (or sending Unknown) is rejected with a 400.
    ledgerReason: LedgerReason.SaleOfGood,
    startTimeMillis,
    endTimeMillis,
  });

  const transactions = useMemo(() => data?.transactions ?? [], [data?.transactions]);

  // The slice of the fetched block shown on the current display page.
  const pageRows = useMemo(
    () => transactions.slice(pageInBlock * pageSize, pageInBlock * pageSize + pageSize),
    [transactions, pageInBlock, pageSize],
  );

  // Display pages the current block splits into (at least one). Every non-terminal block is a full
  // BLOCK_SIZE, so a block we can page *back* to always has `pagesPerFullBlock` pages.
  const pagesInBlock = Math.max(1, Math.ceil(transactions.length / pageSize));
  const pagesPerFullBlock = Math.ceil(BLOCK_SIZE / pageSize);

  // While a page change is in flight, keepPreviousData keeps the old block visible. Disabling
  // navigation until the fetch settles stops a second click from re-pushing the same cursor.
  const nextCursor = data?.nextCursor;
  const hasMoreBlocks = canGoNext(data?.hasMore ?? false, nextCursor);
  const hasNext = (pageInBlock < pagesInBlock - 1 || hasMoreBlocks) && !isFetching;
  const hasPrevious = (pageInBlock > 0 || canGoPrevious(blockStack)) && !isFetching;

  const onNextPage = useCallback(() => {
    if (isFetching) {
      return;
    }
    // Page within the loaded block first; only fetch the next block once it is exhausted.
    if (pageInBlock < pagesInBlock - 1) {
      setPageInBlock((page) => page + 1);
      return;
    }
    if (nextCursor) {
      setBlockStack((stack) => pushCursor(stack, nextCursor));
      setPageInBlock(0);
    }
  }, [isFetching, pageInBlock, pagesInBlock, nextCursor]);

  const onPreviousPage = useCallback(() => {
    if (isFetching) {
      return;
    }
    if (pageInBlock > 0) {
      setPageInBlock((page) => page - 1);
      return;
    }
    if (canGoPrevious(blockStack)) {
      // The previous block is always full (only the last block is short), so land on its last page.
      setBlockStack((stack) => popCursor(stack));
      setPageInBlock(pagesPerFullBlock - 1);
    }
  }, [isFetching, pageInBlock, blockStack, pagesPerFullBlock]);

  const onSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setBlockStack([...INITIAL_CURSOR_STACK]);
    setPageInBlock(0);
  }, []);

  const onRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Batches counterparty name lookups for the whole block (one users + one groups request) so
  // paging within the block needs no further name lookups.
  const resolveCounterPartyName = useCounterPartyNames(transactions);

  const responseStatus = getResponseFromError(error)?.status;
  const isForbidden = responseStatus === 403;
  const isRateLimited = responseStatus === 429;

  // Report resolved access to the parent once the fetch settles. Skipping it while isLoading keeps
  // the parent's chrome hidden through the initial load (no allowed→blocked flash); after that a
  // 403 is 'forbidden' (hide chrome) and anything else is 'allowed' (show chrome).
  useEffect(() => {
    if (isLoading) {
      return;
    }
    onAccessChange?.(isForbidden ? 'forbidden' : 'allowed');
  }, [isLoading, isForbidden, onAccessChange]);

  if (isLoading) {
    return (
      <div className='flex justify-center' data-testid='virtual-transactions-loading-id'>
        <ProgressCircle variant='Indeterminate' ariaLabel={intl.translate('Label.Loading')} />
      </div>
    );
  }

  if (error) {
    // The tab is gated behind the feature flag (and can't be deep-linked when off), so a 403 that
    // reaches a mounted table is the ViewGroupTransactions permission case — retrying won't help, so
    // drop the recovery actions. A 429 is transient rate limiting, so it keeps Retry with a specific
    // message. Other errors keep Retry (re-fetches the current page) and Back (returns to the
    // previous cached page) so a failed later page doesn't strand the user.
    const message = isForbidden
      ? translate(translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics))
      : isRateLimited
        ? translate(translationKey('Message.RateLimited', TranslationNamespace.Transactions))
        : translate(
            translationKey('Message.TransactionsLoadError', TranslationNamespace.Transactions),
          );
    const showBack = !isForbidden && hasPrevious;
    return (
      <FeedbackBanner
        data-testid='virtual-transactions-error-id'
        severity='Error'
        title={message}
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
        onSecondaryAction={showBack ? onPreviousPage : undefined}
      />
    );
  }

  if (transactions.length === 0) {
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
      {/* This wrapper supplies the rounded outer border and clips it; the inner .scrollX handles
          horizontal overflow and zeroes the bg-surface-100 fill on Foundation's Table wrapper. */}
      <div className='width-full radius-medium clip stroke-standard stroke-default'>
        {/* Inner scroll container so a table wider than the viewport scrolls horizontally on narrow
            screens; the outer `clip` still rounds the corners. */}
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
              {pageRows.map((record, index) => {
                const counterPartyName = resolveCounterPartyName(record.counterParty);
                return (
                  <TableRow
                    // eslint-disable-next-line react/no-array-index-key -- records have no stable id
                    key={index}
                    data-testid='table-row-id'>
                    {VirtualColumns.map((columnType) => (
                      <VirtualTransactionCell
                        key={`${columnType}-${index}`}
                        columnType={columnType}
                        record={record}
                        counterPartyName={counterPartyName}
                      />
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Cursor-based (forward-only, unknown total) pagination — Foundation TablePagination models
          offset pagination with a known total and a last-page jump, which this endpoint can't
          provide, so the cursor-aware shared control is kept. */}
      <GenericTablePagination
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
        pageSize={pageSize}
        pageSizeOptions={[DEFAULT_PAGE_SIZE, 25, 50, 100]}
        setPageSize={onSetPageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        page={(blockStack.length - 1) * pagesPerFullBlock + pageInBlock}
        total={unknownDueToCursorBasedPagination}
      />
    </>
  );
};

export default VirtualTransactionsTable;
