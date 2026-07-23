import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@rbx/ui';
import React, { useState } from 'react';
import { rowsPageOptions } from '../../constants';
import Order from '../../enums/Order';
import SortableHeader from '../../enums/SortableHeader';
import { HeaderCell } from '../../types/TableAttributes';

export type MatchmakingTableContainerProps = {
  tableTitle: string;
  rows: React.JSX.Element[];
  headers: HeaderCell[];
  order: Order;
  orderBy: string;
  handleSortRequest: (header: string) => void;
};

const MatchmakingTableContainer = function MatchmakingTableContainer({
  tableTitle,
  rows,
  headers,
  order,
  orderBy,
  handleSortRequest,
}: MatchmakingTableContainerProps): React.JSX.Element {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(rowsPageOptions[0]);
  const isSortableHeader = (id: string) => {
    return Object.values(SortableHeader)
      .map((value) => value.toString())
      .includes(id);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Grid>
      <Typography variant='h6'>{tableTitle}</Typography>
      <TableContainer style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell align='left' key={header.id}>
                  {isSortableHeader(header.id) ? (
                    <TableSortLabel
                      active={orderBy === header.id}
                      direction={orderBy === header.id ? order : Order.Asc}
                      onClick={() => handleSortRequest(header.id)}>
                      {header.label}
                    </TableSortLabel>
                  ) : (
                    <Typography variant='tableHead'>{header.label}</Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                style={{ borderBottom: 'none' }}
                rowsPerPageOptions={rowsPageOptions}
                count={rows?.length ?? 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Grid>
  );
};

export default MatchmakingTableContainer;
