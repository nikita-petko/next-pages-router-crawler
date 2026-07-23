import React, { FC, useCallback, useMemo } from 'react';
import {
  Grid,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TablePagination,
  Typography,
  CircularProgress,
} from '@rbx/ui';
import { ChartHeader, GenericChartState } from '@modules/charts-generic';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  HorizontalScrollWrapper,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import useErrorLogTableStyles from './ErrorLogTable.styles';

type ErrorLogTableProps = GenericChartState & {
  titleKey: TranslationKey;
  page: number;
  total?: number;
  pageSize: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
};

const ErrorLogTable: FC<React.PropsWithChildren<ErrorLogTableProps>> = ({
  titleKey,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  total,
  page,
  pageSize,
  onNextPage,
  onPreviousPage,
  children,
}) => {
  const {
    classes: { loadingContainer, tableContainer, paginationContainer },
  } = useErrorLogTableStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const headers = useMemo(() => {
    const headerKeys = [
      'ErrorLogTable.Header.Count',
      'ErrorLogTable.Header.Severity',
      'ErrorLogTable.Header.Type',
      'ErrorLogTable.Header.Message',
    ].map((key) => translationKey(key, TranslationNamespace.Analytics));

    return headerKeys.map((headerKey) => (
      <TableCell key={headerKey.key}>{translate(headerKey)}</TableCell>
    ));
  }, [translate]);

  const onPageChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      if (newPage > page) {
        onNextPage();
      } else if (newPage < page) {
        onPreviousPage();
      }
    },
    [page, onNextPage, onPreviousPage],
  );

  const shouldDisplayContent = useMemo(() => {
    return (
      !isDataLoading && !isResponseFailed && !isUserForbidden && React.Children.count(children) > 0
    );
  }, [isDataLoading, isResponseFailed, isUserForbidden, children]);

  const content = useMemo(() => {
    return (
      <React.Fragment>
        {children}
        <TableRow>
          <TablePagination
            data-testid='tablePagination'
            className={paginationContainer}
            count={total ?? -1}
            page={page}
            rowsPerPage={pageSize}
            onPageChange={onPageChange}
            rowsPerPageOptions={[]}
          />
        </TableRow>
      </React.Fragment>
    );
  }, [children, paginationContainer, total, page, pageSize, onPageChange]);

  const placeholder = useMemo(() => {
    return (
      <TableRow>
        <TableCell colSpan={headers.length + 1}>
          <Grid container className={loadingContainer}>
            {isDataLoading ? (
              <CircularProgress color='secondary' data-testid='loadingIndicator' />
            ) : (
              <Typography>
                {translate(
                  translationKey(
                    'ErrorLogTable.Body.Placeholder.NoContent',
                    TranslationNamespace.Analytics,
                  ),
                )}
              </Typography>
            )}
          </Grid>
        </TableCell>
      </TableRow>
    );
  }, [isDataLoading, translate, headers, loadingContainer]);

  return (
    <Grid item XSmall={12} spacing={5}>
      <ChartHeader title={translate(titleKey)} exportButton={null} />
      <HorizontalScrollWrapper>
        <Table className={tableContainer}>
          <TableHead>
            <TableRow>
              {headers}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>{shouldDisplayContent ? content : placeholder}</TableBody>
        </Table>
      </HorizontalScrollWrapper>
    </Grid>
  );
};

export default ErrorLogTable;
