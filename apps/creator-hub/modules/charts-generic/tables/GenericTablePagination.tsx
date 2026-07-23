import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TablePagination } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useGenericTablePaginationStyles from './GenericTablePagination.styles';

export const unknownDueToCursorBasedPagination = -1;

export type GenericTablePaginationSpec = {
  page: number;
  total?: number;
  pageSize: number;
  pageSizeOptions: number[];
  setPageSize: (newPageSize: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
};

/**
 * Wrapper around the webblox TablePagination component to provide for generic pagination controls
 * via callback integration with pagination request hooks (e.g. usePaginatedSearchUniverses). Also localizes table labels.
 *
 * Highly recommend using in it inside a Table component as the table footer for UI consistency but
 * technically there is no limitation to where this component can be used.
 */
const GenericTablePagination: FC<GenericTablePaginationSpec> = ({
  page,
  total,
  pageSize,
  pageSizeOptions,
  setPageSize,
  onNextPage,
  onPreviousPage,
  hasNext,
  hasPrevious,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { footerBottomBorder },
  } = useGenericTablePaginationStyles();

  const onPageChange = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      if (newPage > page) {
        onNextPage();
      } else if (newPage < page) {
        onPreviousPage();
      }
    },
    [page, onNextPage, onPreviousPage],
  );

  const onPageSizeChange = useCallback<
    NonNullable<React.ComponentProps<typeof TablePagination>['onRowsPerPageChange']>
  >(
    (event) => {
      const rowsPerPage = Number(event.target.value);
      if (!pageSizeOptions.includes(rowsPerPage)) {
        return;
      }
      setPageSize(rowsPerPage);
    },
    [pageSizeOptions, setPageSize],
  );

  const labelDisplayedRows = useCallback<
    NonNullable<React.ComponentProps<typeof TablePagination>['labelDisplayedRows']>
  >(
    ({ from, to, count: totalPageCount }) => {
      if (totalPageCount === unknownDueToCursorBasedPagination) {
        return `${from}-${to}`;
      }
      return translate(translationKey('Label.PageRange', TranslationNamespace.Table), {
        pageRange: `${from}-${to}`,
        totalPageCount: `${totalPageCount}`,
      });
    },
    [translate],
  );

  const paginationFooter = useMemo(() => {
    const effectiveTotal = total ?? unknownDueToCursorBasedPagination;
    return (
      <TablePagination
        className={footerBottomBorder}
        data-testid='tablePagination'
        count={effectiveTotal}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={onPageChange}
        rowsPerPageOptions={pageSizeOptions}
        onRowsPerPageChange={onPageSizeChange}
        labelRowsPerPage={translate(
          translationKey('Label.RowsPerPage', TranslationNamespace.Table),
        )}
        nextIconButtonProps={{ disabled: !hasNext }}
        backIconButtonProps={{ disabled: !hasPrevious }}
        labelDisplayedRows={labelDisplayedRows}
      />
    );
  }, [
    footerBottomBorder,
    total,
    page,
    pageSize,
    onPageChange,
    pageSizeOptions,
    onPageSizeChange,
    translate,
    hasNext,
    hasPrevious,
    labelDisplayedRows,
  ]);

  return paginationFooter;
};

export default withNamespaceSwitchedTranslation(GenericTablePagination, [
  TranslationNamespace.Table,
]);
