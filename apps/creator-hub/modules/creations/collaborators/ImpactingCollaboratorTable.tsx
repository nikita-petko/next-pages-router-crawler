import type { ReactNode } from 'react';
import { useCallback, type FunctionComponent } from 'react';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PAGE_SIZE_OPTIONS } from './constants';
import useLocallyPaginatedTable from './hooks/useLocallyPaginatedTable';
import ImpactingCollaboratorTableRow from './ImpactingCollaboratorTableRow';
import type { ImpactingCollaboratorData } from './types';
import { expandTrustPillsEvent, viewCollaboratorEvent } from './unifiedLoggerUtils';

export type ImpactingCollaboratorTableProps = {
  data: Array<ImpactingCollaboratorData>;
  universeId?: number;
  isOwner: boolean;
  tab: string;
  emptyState: ReactNode;
};

// Table with three columns: User, Impacting, and Needs relationship of trust
const ImpactingCollaboratorTable: FunctionComponent<ImpactingCollaboratorTableProps> = ({
  data,
  universeId,
  isOwner,
  tab,
  emptyState,
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

  const handleExpandTrustPills = useCallback(() => {
    unifiedLogger.logClickEvent(expandTrustPillsEvent(universeId ?? 0, isOwner));
  }, [unifiedLogger, universeId, isOwner]);

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
            <TableHeaderCell className='[width:5%]'>
              <span className='content-emphasis'>
                {translateWithNamespace(TranslationNamespace.Creations, 'TableHeader.Impacting')}
              </span>
            </TableHeaderCell>
            <TableHeaderCell>
              <span className='content-emphasis'>
                {translateWithNamespace(TranslationNamespace.Creations, 'TableHeader.NeedsTrust')}
              </span>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRows.map((row) => {
            return (
              <ImpactingCollaboratorTableRow
                key={row.user.userId}
                data={row}
                onProfileClick={handleProfileClick}
                onExpandTrustPills={handleExpandTrustPills}
              />
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

export default ImpactingCollaboratorTable;
