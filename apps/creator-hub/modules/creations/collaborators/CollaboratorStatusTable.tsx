import type { ReactNode } from 'react';
import { useCallback, type FunctionComponent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CollaboratorPill } from './CollaboratorPill';
import { PAGE_SIZE_OPTIONS } from './constants';
import useLocallyPaginatedTable from './hooks/useLocallyPaginatedTable';
import type { CollaboratorData } from './types';
import { viewCollaboratorEvent } from './unifiedLoggerUtils';

export type CollaboratorStatus = {
  user: CollaboratorData;
  status: ReactNode;
};

export type CollaboratorStatusTableProps = {
  data: Array<CollaboratorStatus>;
  universeId?: number;
  isOwner: boolean;
  tab: string;
  emptyState: ReactNode;
  hideStatusColumn?: boolean; // Temporary, to make adding the Accessed - Status column easier instead of building a placeholder table
};

// Table with two columns: User and Status
const CollaboratorStatusTable: FunctionComponent<CollaboratorStatusTableProps> = ({
  data,
  universeId,
  isOwner,
  tab,
  emptyState,
  hideStatusColumn = false,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const { page, rowsPerPage, paginatedRows, handlePageChange, handleRowsPerPageChange } =
    useLocallyPaginatedTable(data, { universeId, isOwner, tab });

  const handleProfileClick = useCallback(
    (userId: number) => {
      unifiedLogger.logClickEvent(viewCollaboratorEvent(universeId ?? 0, isOwner, userId));
    },
    [unifiedLogger, universeId, isOwner],
  );

  return (
    <>
      <Table className='bg-over-media-0'>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className='[width:15%]'>
              <span className='content-emphasis'>
                {translateWithNamespace(TranslationNamespace.Creations, 'TableHeader.User')}
              </span>
            </TableHeaderCell>
            {!hideStatusColumn && (
              <TableHeaderCell>
                <span className='content-emphasis'>
                  {translateWithNamespace(TranslationNamespace.Creations, 'TableHeader.Status')}
                </span>
              </TableHeaderCell>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRows.map((rowData) => {
            return (
              <TableRow key={rowData.user.userId}>
                <TableCell>
                  <CollaboratorPill
                    onProfileClick={handleProfileClick}
                    collaborator={rowData.user}
                  />
                </TableCell>
                {!hideStatusColumn && <TableCell>{rowData.status}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {emptyState && paginatedRows.length === 0 ? (
        emptyState
      ) : (
        <TablePagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalRows={data.length}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </>
  );
};

export default CollaboratorStatusTable;
