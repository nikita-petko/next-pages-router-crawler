import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetAssetDependencies } from '@modules/react-query/creatorAssetTooling/assetDependenciesQueries';
import { useCurrentDeveloperItem } from '../common/DeveloperItemProvider';

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [1, 10, 25, 50, 100];

const DependenciesContainer: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { developerItemDetails } = useCurrentDeveloperItem();
  const assetId = parseInt(developerItemDetails?.id ?? '0', 10);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [pageTokens, setPageTokens] = useState<Map<number, string | undefined>>(
    () => new Map([[0, undefined]]),
  );

  const currentPageToken = pageTokens.get(page);

  const { data, isLoading, isError, isPlaceholderData } = useGetAssetDependencies(
    assetId,
    undefined,
    rowsPerPage,
    currentPageToken,
    assetId > 0,
  );

  const results = data?.results ?? [];
  const hasNextPage = data?.hasMore ?? false;

  const handlePageChange = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    if (newPage > page && hasNextPage && data?.nextPageToken) {
      setPageTokens((prev) => {
        const next = new Map(prev);
        next.set(newPage, data.nextPageToken ?? undefined);
        return next;
      });
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setPageTokens(new Map([[0, undefined]]));
  };

  const labelDisplayedRows = useCallback(
    ({ from }: { from: number }) => `${from}–${from + results.length - 1}`,
    [results.length],
  );

  if (isLoading) {
    return (
      <Grid container justifyContent='center' style={{ padding: '40px' }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (isError) {
    return (
      <Grid container style={{ padding: '20px' }}>
        <Typography color='error'>{translate('Message.FailedToLoadDependencies')}</Typography>
      </Grid>
    );
  }

  if (results.length === 0 && page === 0) {
    return (
      <Grid container direction='column'>
        <Grid item style={{ marginBottom: '16px' }}>
          <Typography color='secondary' variant='body1'>
            {translate('Description.Dependencies')}
          </Typography>
        </Grid>
        <Typography>{translate('Message.NoDependenciesFound')}</Typography>
      </Grid>
    );
  }

  return (
    <Grid container direction='column'>
      <Grid item style={{ marginBottom: '16px' }}>
        <Typography color='secondary' variant='body1'>
          {translate('Description.Dependencies')}
        </Typography>
      </Grid>
      <TableContainer>
        <Table size='medium' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{translate('Heading.AssetId')}</TableCell>
              <TableCell>{translate('Heading.AssetName')}</TableCell>
              <TableCell>{translate('Heading.AssetType')}</TableCell>
              <TableCell>{translate('Heading.AssetVersion')}</TableCell>
              <TableCell>{translate('Heading.CreatorId')}</TableCell>
              <TableCell>{translate('Heading.CreatorType')}</TableCell>
              <TableCell>{translate('Heading.AccessStatus')}</TableCell>
              <TableCell>{translate('Heading.AccessReason')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
            {results.map((result) => (
              <TableRow key={`${result.assetId?.assetId}-${result.assetId?.versionNumber}`}>
                <TableCell>{result.assetId?.assetId}</TableCell>
                <TableCell>{result.assetId?.metadata?.assetName ?? '—'}</TableCell>
                <TableCell>{result.assetId?.metadata?.assetType ?? '—'}</TableCell>
                <TableCell>{result.assetId?.versionNumber ?? '—'}</TableCell>
                <TableCell>{result.assetId?.metadata?.creator?.creatorId ?? '—'}</TableCell>
                <TableCell>{result.assetId?.metadata?.creator?.creatorType ?? '—'}</TableCell>
                <TableCell>{result.accessStatus ?? '—'}</TableCell>
                <TableCell>{result.accessReason ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                count={-1}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleChangeRowsPerPage}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                labelDisplayedRows={labelDisplayedRows}
                labelRowsPerPage={translate('Label.RowsPerPage')}
                slotProps={{
                  actions: {
                    nextButton: { disabled: !hasNextPage || isPlaceholderData },
                    previousButton: { disabled: page === 0 || isPlaceholderData },
                  },
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Grid>
  );
};

export default withTranslation(DependenciesContainer, [
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Table,
]);
