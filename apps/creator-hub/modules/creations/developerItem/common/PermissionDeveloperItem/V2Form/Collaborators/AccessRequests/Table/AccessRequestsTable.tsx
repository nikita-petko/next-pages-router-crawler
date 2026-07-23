import type { FC } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
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
import useAccessRequestsTableStyles from './AccessRequestsTable.styles';
import AccessRequestsTableRow from './AccessRequestsTableRow';

export type AccessRequestsTableProps = {
  assetId: number;
  requests: AssetPermissionRequest[];
};

const DEFAULT_ROWS_PER_PAGE = 5;

const AccessRequestsTable: FC<AccessRequestsTableProps> = ({ assetId, requests }) => {
  const { translate } = useTranslation();
  const {
    classes: { tableContainer, paginationCell, requesterCell, groupCell, dateCell, actionsCell },
  } = useAccessRequestsTableStyles();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);

  // Clamp page on every render so approve/reject shrinking the dataset never leaves
  // an empty table body while earlier pages still have rows.
  const maxPage = Math.max(0, Math.ceil(requests.length / rowsPerPage) - 1);
  const effectivePage = Math.min(page, maxPage);

  const displayedRequests = useMemo(
    () => requests.slice(effectivePage * rowsPerPage, effectivePage * rowsPerPage + rowsPerPage),
    [requests, effectivePage, rowsPerPage],
  );

  const handlePageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNum: number) => setPage(pageNum),
    [],
  );

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const displayLabelRows = useCallback(
    ({ from, to, count }: { from: number; to: number; count: number }) =>
      translate('Label.PageRange', { pageRange: `${from}-${to}`, totalPageCount: `${count}` }),
    [translate],
  );

  return (
    <TableContainer classes={{ root: tableContainer }}>
      <Table size='medium' stickyHeader style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableCell classes={{ root: requesterCell }}>{translate('Label.Requester')}</TableCell>
            <TableCell classes={{ root: groupCell }}>{translate('Label.Group')}</TableCell>
            <TableCell classes={{ root: dateCell }}>{translate('Label.DateRequested')}</TableCell>
            <TableCell classes={{ root: actionsCell }} align='right' />
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedRequests.map((request) => (
            <AccessRequestsTableRow key={request.requestId} assetId={assetId} request={request} />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              classes={{ root: paginationCell }}
              count={requests.length}
              labelDisplayedRows={displayLabelRows}
              labelRowsPerPage={translate('Label.RowsPerPage')}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
              page={effectivePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default AccessRequestsTable;
