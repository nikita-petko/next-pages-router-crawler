import React, { FunctionComponent, useCallback, useState, useMemo } from 'react';
import {
  Grid,
  TableCell,
  Table,
  TableRow,
  TableBody,
  TableHead,
  Typography,
  Card,
  CardContent,
  TableFooter,
  TablePagination,
  CircularProgress,
} from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import UseAssetPermissionsStyles from './AssetPermissionsContainer.styles';
import UniverseAssetDetailsRow from './UniverseAssetDetailsRow';
import { TAssetDetails } from './types';
import { ASSET_HEADER, ASSET_TYPE_HEADER, ID_HEADER, OWNER_HEADER } from './common';

type UniverseAssetDetailsTableInput = {
  isLoading: boolean;
  existingAssetIdsList: Map<number, TAssetDetails>;
  pendingAssetIdsList: Map<number, TAssetDetails>;
  onItemRemove: (itemId: number) => void;
};

const defaultRowsPerPage = 10;

const UniverseAssetDetailsTable: FunctionComponent<
  React.PropsWithChildren<UniverseAssetDetailsTableInput>
> = ({ isLoading, existingAssetIdsList, pendingAssetIdsList, onItemRemove }) => {
  const {
    classes: { fixWidthColumn, tableHeadTitle, card, cardText, paginationStyle },
    cx,
  } = UseAssetPermissionsStyles();
  const { translate } = useTranslation();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);
  const handlePageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNum: number) => {
      setPage(pageNum);
    },
    [],
  );

  const [pendingItemsInCurrentPage, existingItemsInCurrentPage] = useMemo(() => {
    const currentStartIndex = page * rowsPerPage;
    const currentEndIndex = page * rowsPerPage + rowsPerPage;
    let totalEntriesInCurrentPage = 0;
    let pendingItems: TAssetDetails[] = [];
    let existingItems: TAssetDetails[] = [];
    if (pendingAssetIdsList.size > currentStartIndex) {
      const pendingAssetDetails = Array.from(pendingAssetIdsList.values());
      pendingItems =
        rowsPerPage > 0
          ? pendingAssetDetails.slice(currentStartIndex, currentEndIndex)
          : pendingAssetDetails;
      totalEntriesInCurrentPage = pendingItems.length;
    }

    if (totalEntriesInCurrentPage < rowsPerPage) {
      // still have slots in this page
      const existingAssetDetails = Array.from(existingAssetIdsList.values());
      // if pending list is in current page, start from beginning, else find the starting point including pending list size.
      const startIndexInExistingList =
        pendingItems.length > 0 ? 0 : currentStartIndex - pendingAssetIdsList.size;
      existingItems =
        rowsPerPage > 0
          ? existingAssetDetails.slice(
              startIndexInExistingList,
              currentEndIndex - pendingItems.length,
            )
          : existingAssetDetails;
    }

    return [pendingItems, existingItems];
  }, [existingAssetIdsList, pendingAssetIdsList, page, rowsPerPage]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, defaultRowsPerPage));
    setPage(0);
  }, []);

  const displayLabelRows = useCallback(
    ({ from, to, count }: { from: number; to: number; count: number }) =>
      translate('Label.PageRange', {
        pageRange: `${from}-${to}`,
        totalPageCount: `${count}`,
      }),
    [translate],
  );

  return (
    <Grid container item XSmall={12}>
      {isLoading ? (
        <EmptyGrid>
          <CircularProgress />
        </EmptyGrid>
      ) : (
        <Grid item XSmall={12}>
          {pendingItemsInCurrentPage.length > 0 || existingItemsInCurrentPage.length > 0 ? (
            <Table size='medium' stickyHeader>
              <TableHead className={tableHeadTitle}>
                <TableRow>
                  <TableCell className={cx(fixWidthColumn)}>
                    <Typography variant='h6'>{translate(ASSET_HEADER)}</Typography>
                  </TableCell>
                  <TableCell className={cx(fixWidthColumn)}>
                    <Typography variant='h6'>{translate(ID_HEADER)}</Typography>
                  </TableCell>
                  <TableCell className={cx(fixWidthColumn)}>
                    <Typography variant='h6'>{translate(OWNER_HEADER)}</Typography>
                  </TableCell>
                  <TableCell className={cx(fixWidthColumn)}>
                    <Typography variant='h6'>{translate(ASSET_TYPE_HEADER)}</Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingItemsInCurrentPage.length > 0 &&
                  pendingItemsInCurrentPage.map((entry) => (
                    <UniverseAssetDetailsRow
                      key={entry.assetId}
                      assetId={entry.assetId}
                      name={entry.name}
                      assetType={entry.assetType}
                      creatorName={entry.creatorName}
                      canBeRemoved
                      onItemRemove={onItemRemove}
                    />
                  ))}
                {existingItemsInCurrentPage.length > 0 &&
                  existingItemsInCurrentPage.map((entry) => (
                    <UniverseAssetDetailsRow
                      key={entry.assetId}
                      assetId={entry.assetId}
                      name={entry.name}
                      assetType={entry.assetType}
                      creatorName={entry.creatorName}
                      canBeRemoved={false}
                      alreadyAdded={entry.alreadyAdded}
                      onItemRemove={onItemRemove}
                    />
                  ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    id='tablePagination'
                    classes={{ root: paginationStyle }}
                    count={pendingAssetIdsList.size + existingAssetIdsList.size}
                    SelectProps={{
                      inputProps: {
                        'data-testid': 'rowsPerPageDropdown',
                      },
                    }}
                    labelDisplayedRows={displayLabelRows}
                    labelRowsPerPage={translate('Label.RowsPerPage')}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <Card data-testid='empty-permissions-card' square variant='filled' className={card}>
              <CardContent className={cardText}>
                <Typography color='secondary' variant='body2'>
                  {translate('Message.NoAssetsWithPermission')}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      )}
    </Grid>
  );
};

export default React.memo(UniverseAssetDetailsTable);
