import { useCallback, useEffect, useState } from 'react';
import {
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { GenericTablePagination, unknownDueToCursorBasedPagination } from '@modules/charts-generic';
import { useGetPurchasesByProduct } from '@modules/react-query/fiatPaidAccess/fiatPaidAccessQueries';
import { RobloxPaidAccessFiatPaidAccessServiceV1PurchaseDetails as PurchaseDetails } from '@rbx/clients/fiatPaidAccessService';
import { universesClient } from '@modules/clients';
import EmptyResultsCard from '../../../components/EmptyResultsCard/EmptyResultsCard';
import { pageSizeOptions } from '../../constants/PaginationConstants';
import { PaidAccessProduct } from '../../constants/PaidAccessProductType';
import {
  ColumnType,
  ColumnTypesToTranslationKey,
  PaidAccessColumns,
} from '../../constants/TableInfo';
import PurchaseCell from '../PurchaseCell/PurchaseCell';

type PaidAccessTransactionsTableProps = {
  product: PaidAccessProduct;
  startDate?: Date;
  endDate?: Date;
};

function PaidAccessTransactionsTable({
  product,
  startDate,
  endDate,
}: PaidAccessTransactionsTableProps) {
  const { ready: areTranslationsReady, translate } = useTranslation();

  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[0]);
  const [isNavigatingBackwards, setIsNavigatingBackwards] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string>('');

  const { data: productPurchases } = useGetPurchasesByProduct(
    product.rootPlaceId,
    pageSize,
    isNavigatingBackwards,
    startDate,
    endDate,
    cursor,
  );

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(productPurchases?.hasMore || false);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [universeId, setUniverseId] = useState<number>(0);

  useEffect(() => {
    async function getUniverseId() {
      const results = await universesClient.getUniverseContainingPlace(product.rootPlaceId ?? 0);
      setUniverseId(results.universeId ?? 0);
    }
    getUniverseId();
  }, [product.rootPlaceId]);

  useEffect(() => {
    // Reset navigation state when changing selected product or filters
    setIsNavigatingBackwards(false);
    setCursor('');
    setHasPrevious(false);
    setCurrentPage(0);
  }, [product, startDate, endDate]);

  useEffect(() => {
    if (isNavigatingBackwards) {
      setHasPrevious(productPurchases?.hasMore || false);
    } else {
      setHasNext(productPurchases?.hasMore || false);
    }
  }, [isNavigatingBackwards, productPurchases?.hasMore]);

  const onNextPage = useCallback(() => {
    setIsNavigatingBackwards(false);
    setCursor(productPurchases?.nextCursor || '');
    setHasNext(productPurchases?.hasMore || false);
    setHasPrevious(true);
    setCurrentPage(currentPage + 1);
  }, [productPurchases?.hasMore, productPurchases?.nextCursor, currentPage]);

  const onPreviousPage = useCallback(() => {
    setIsNavigatingBackwards(true);
    setCursor(productPurchases?.previousCursor || '');
    setHasNext(true);
    setHasPrevious(productPurchases?.hasMore || false);
    setCurrentPage(currentPage - 1);
  }, [productPurchases?.hasMore, productPurchases?.previousCursor, currentPage]);

  // If we change the page size, we need to reset the cursor and navigation state
  const onSetPageSize = useCallback((newNumber: number) => {
    setPageSize(newNumber);
    setIsNavigatingBackwards(false);
    setCursor('');
    setHasPrevious(false);
    setCurrentPage(0);
  }, []);

  const renderPurchasesData = useCallback(
    (data: PurchaseDetails, index: number) => {
      return (
        <TableRow key={index} data-testid='table-row-id'>
          {PaidAccessColumns.map((columnType: ColumnType) => {
            return (
              <PurchaseCell
                key={`${columnType}-${index}`}
                columnType={columnType}
                rowData={data}
                product={product}
                universeId={universeId}
              />
            );
          })}
        </TableRow>
      );
    },
    [product, universeId],
  );

  const renderedData = productPurchases?.purchases?.map(renderPurchasesData);

  const isLoading = !areTranslationsReady;

  if (isLoading) {
    return <CircularProgress />;
  }

  if (productPurchases?.purchases?.length === 0) {
    return <EmptyResultsCard />;
  }

  return (
    <TableContainer>
      <Table padding='normal' size='medium'>
        <TableHead>
          <TableRow>
            {PaidAccessColumns.map((columnType: ColumnType) => (
              <TableCell key={columnType} align='left'>
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
          page={currentPage}
          total={unknownDueToCursorBasedPagination}
        />
      </Table>
    </TableContainer>
  );
}

export default PaidAccessTransactionsTable;
