import { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
  Typography,
  TableFooter,
  TablePagination,
  CircularProgress,
  Button,
} from '@rbx/ui';
import {
  DEFAULT_OAUTH_SCOPES_TABLE_ROWS_PER_PAGE,
  OAUTH_SCOPES_TABLE_ROWS_PER_PAGE_OPTIONS,
} from '../constants/oAuthConstants';
import type ScopeOption from '../interfaces/ScopeOptions';
import getDeveloperFacingScopes from '../utils/scopesUtil';
import useScopeSelectionTableStyles from './ScopeSelectionTable.styles';

interface ScopeSelectionTableProps {
  isEditActive?: boolean;
  isLoading: boolean;
  selectedScopeOptions: ScopeOption[];
  onScopeDelete: (option: ScopeOption) => void;
}

const ScopeSelectionTable = ({
  isEditActive,
  isLoading,
  selectedScopeOptions,
  onScopeDelete,
}: ScopeSelectionTableProps) => {
  const { translate } = useTranslation();
  const {
    classes: { table, pagination, paginationToolbar },
  } = useScopeSelectionTableStyles();

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_OAUTH_SCOPES_TABLE_ROWS_PER_PAGE);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return isLoading ? (
    <Grid container alignItems='center' justifyContent='center'>
      <CircularProgress />
    </Grid>
  ) : (
    <TableContainer className={table}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell align='left'>{translate('Label.Scope')}</TableCell>
            <TableCell align='left'>{translate('Label.Description')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {selectedScopeOptions
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((option) => (
              <TableRow key={getDeveloperFacingScopes(option.scopeType, option.operation)}>
                <TableCell align='left'>
                  <Typography variant='smallLabel2' color='primary'>
                    {getDeveloperFacingScopes(option.scopeType, option.operation)}
                  </Typography>
                </TableCell>
                <TableCell align='left'>
                  <Typography variant='body2' color='secondary'>
                    {option.description}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Button
                    color='destructive'
                    disabled={!isEditActive}
                    onClick={() => onScopeDelete(option)}
                    variant='text'>
                    {translate('Action.Remove')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TableFooter>
        <TablePagination
          className={pagination}
          classes={{ toolbar: paginationToolbar }}
          rowsPerPageOptions={OAUTH_SCOPES_TABLE_ROWS_PER_PAGE_OPTIONS}
          count={selectedScopeOptions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableFooter>
    </TableContainer>
  );
};

export default ScopeSelectionTable;
