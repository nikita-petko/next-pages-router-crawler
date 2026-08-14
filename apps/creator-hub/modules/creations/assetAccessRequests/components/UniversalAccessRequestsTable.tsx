import type { FC } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from '@rbx/ui';
import type { AssetPermissionRequest } from '@modules/clients/assetPermissions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useResolveRequesterNames } from '@modules/react-query/assetPermissions/assetPermissionsHelperQueries';
import { TRUNCATING_CELL_CLASS } from './UniversalAccessRequestsTable.styles';
import UniversalAccessRequestsTableRow from './UniversalAccessRequestsTableRow';

const DEFAULT_ROWS_PER_PAGE = 10;
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

export type UniversalAccessRequestsTableProps = {
  requests: AssetPermissionRequest[];
  selectedRequestIds: ReadonlySet<string>;
  onSelectionChange: (requestId: string, isSelected: boolean) => void;
  onSelectAll: (selectAll: boolean) => void;
};

const UniversalAccessRequestsTable: FC<UniversalAccessRequestsTableProps> = ({
  requests,
  selectedRequestIds,
  onSelectionChange,
  onSelectAll,
}) => {
  const { translateWithNamespace } = useTranslation();

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);

  const validRequests = useMemo(
    () =>
      requests.filter(
        (request): request is AssetPermissionRequest & { requestId: string; assetId: number } =>
          request.requestId !== undefined && request.assetId !== undefined,
      ),
    [requests],
  );

  // Clamp page so approve/reject shrinking the dataset never leaves an empty
  // table body while earlier pages still have rows.
  const maxPage = Math.max(0, Math.ceil(validRequests.length / rowsPerPage) - 1);
  const effectivePage = Math.min(page, maxPage);

  const displayedRequests = useMemo(
    () => validRequests.slice(effectivePage * rowsPerPage, (effectivePage + 1) * rowsPerPage),
    [validRequests, effectivePage, rowsPerPage],
  );

  const { data: requesterNames } = useResolveRequesterNames(displayedRequests);

  const allSelected =
    validRequests.length > 0 && validRequests.every((r) => selectedRequestIds.has(r.requestId));
  const someSelected =
    !allSelected && validRequests.some((r) => selectedRequestIds.has(r.requestId));

  const handleSelectAll = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => onSelectAll(checked),
    [onSelectAll],
  );

  const handlePageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNum: number) => setPage(pageNum),
    [],
  );

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const displayLabelRows = useCallback(
    ({ from, to, count }: { from: number; to: number; count: number }) =>
      translateWithNamespace(TranslationNamespace.Table, 'Label.PageRange', {
        pageRange: `${from}-${to}`,
        totalPageCount: `${count}`,
      }),
    [translateWithNamespace],
  );

  return (
    <TableContainer className='[border-color:theme(colors.components.divider)] [border-radius:10px] [border-style:solid] [border-width:1px] [padding:0] width-full'>
      <Table size='medium' stickyHeader className='[table-layout:fixed] width-full'>
        <TableHead>
          <TableRow>
            <TableCell className='[width:5%]' padding='checkbox'>
              <Checkbox
                indeterminate={someSelected}
                checked={allSelected}
                onChange={handleSelectAll}
                inputProps={{
                  'aria-label': translateWithNamespace(
                    TranslationNamespace.AssetPermissions,
                    'Label.SelectAllRequests',
                  ),
                }}
              />
            </TableCell>
            <TableCell className={`[width:30%] ${TRUNCATING_CELL_CLASS}`}>
              {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.Requester')}
            </TableCell>
            <TableCell className={`[width:25%] ${TRUNCATING_CELL_CLASS}`}>
              {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.AssetName')}
            </TableCell>
            <TableCell className='[width:20%]'>
              {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.DateRequested')}
            </TableCell>
            <TableCell className='[width:20%]' align='right' />
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedRequests.map((request) => (
            <UniversalAccessRequestsTableRow
              key={request.requestId}
              request={request}
              requesterDisplay={requesterNames?.get(request.requestId) ?? ''}
              isSelected={selectedRequestIds.has(request.requestId)}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              className='[border-bottom:0]'
              count={validRequests.length}
              labelDisplayedRows={displayLabelRows}
              labelRowsPerPage={translateWithNamespace(
                TranslationNamespace.Table,
                'Label.RowsPerPage',
              )}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              page={effectivePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export { DEFAULT_ROWS_PER_PAGE };
export default UniversalAccessRequestsTable;
