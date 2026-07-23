import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
} from '@rbx/ui';
import type { PermissionAccessLevel, SharedSubjectDetails } from '../../Shared/types';
import CollaboratorRow from './CollaboratorRow';
import useCollaboratorsTableStyles from './CollaboratorsTable.styles';
import CollaboratorsTableAccessMenu from './CollaboratorsTableAccessMenu';

export interface CollaboratorsTableProps {
  changedCount?: number;
  collaborators: SharedSubjectDetails[];
  editPermissionAccessLevelEnabled: boolean;
  handleCancelProposedCollaboratorsAccess?: () => void;
  handleUpdateProposedCollaboratorAccess: (
    collaborator: SharedSubjectDetails,
    proposedAccessLevel: PermissionAccessLevel,
  ) => void;
  handleUpdateStoredCollaboratorsAccess: (newCollaboratorsOnly: boolean) => void;
  handleRemoveCollaboratorAccess: (collaborator: SharedSubjectDetails) => void;
  isModalView: boolean;
}

const CollaboratorsTable: FunctionComponent<React.PropsWithChildren<CollaboratorsTableProps>> = ({
  changedCount,
  collaborators,
  editPermissionAccessLevelEnabled,
  handleCancelProposedCollaboratorsAccess,
  handleUpdateProposedCollaboratorAccess,
  handleUpdateStoredCollaboratorsAccess,
  handleRemoveCollaboratorAccess,
  isModalView,
}) => {
  const { translate } = useTranslation();
  const {
    classes: {
      accessMenu,
      accessMenuModalView,
      button,
      divider,
      paginationStyle,
      tableContainer,
      tableContainerModalView,
      tableRowModalView,
    },
  } = useCollaboratorsTableStyles();

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const collaboratorsDisplayList = useMemo(() => {
    return collaborators.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [collaborators, page, rowsPerPage]);

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
      translate('Label.PageRange', {
        pageRange: `${from}-${to}`,
        totalPageCount: `${count}`,
      }),
    [translate],
  );

  return (
    <Grid container>
      <TableContainer classes={{ root: isModalView ? tableContainerModalView : tableContainer }}>
        <Table size='medium' stickyHeader>
          {!isModalView && (
            <TableHead>
              <TableRow>
                <TableCell>{translate('Label.Collaborators')}</TableCell>
                <TableCell>{translate('Label.Access')}</TableCell>
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {collaboratorsDisplayList.map((collaborator) => (
              <TableRow
                key={collaborator.subjectId}
                classes={{ root: isModalView ? tableRowModalView : '' }}>
                <TableCell>
                  <CollaboratorRow collaborator={collaborator} />
                </TableCell>
                <TableCell classes={{ root: isModalView ? accessMenuModalView : accessMenu }}>
                  <CollaboratorsTableAccessMenu
                    areRemovalsLocal={isModalView}
                    collaborator={collaborator}
                    editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
                    handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
                    handleRemoveCollaboratorAccess={handleRemoveCollaboratorAccess}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {!isModalView && (
            <TableFooter>
              <TableRow>
                <TablePagination
                  classes={{ root: paginationStyle }}
                  count={collaborators.length}
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
          )}
        </Table>
      </TableContainer>
      {!isModalView && (
        <>
          <Divider variant='fullWidth' classes={{ root: divider }} />
          <Button
            color='secondary'
            variant='outlined'
            disabled={changedCount === 0}
            onClick={handleCancelProposedCollaboratorsAccess}
            classes={{ root: button }}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            color='primaryBrand'
            variant='contained'
            disabled={changedCount === 0}
            onClick={() => handleUpdateStoredCollaboratorsAccess(false)}
            classes={{ root: button }}>
            {translate('Action.SaveChanges')}
          </Button>
        </>
      )}
    </Grid>
  );
};

export default CollaboratorsTable;
