import { memo } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { Table, TableContainer } from '@rbx/ui';
import { useRoundedTableStyles } from './roundedTable.styles';

type Props = {
  children: React.ReactNode;
  /** Whether to render the table without the surrounding rounded border */
  borderless?: boolean;
  className?: string;
};

/**
 * Table base with applied styling based on @rbx/ui `Table` component.
 * Renders as a <table> by default.
 *
 * NOTE: rbx/ui tables by default use table-layout: fixed
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { TableBase } from '@modules/monetization-shared/table-v1';
 * import { TableHead, TableRow, TableCell, TableBody } from '@rbx/ui';
 *
 * return (
 *   <TableBase>
 *     <TableHead>
 *       <TableRow>
 *         <TableCell>Name</TableCell>
 *         <TableCell>Age</TableCell>
 *       </TableRow>
 *     </TableHead>
 *     <TableBody>
 *       <TableRow>
 *         <TableCell>John Doe</TableCell>
 *         <TableCell>25</TableCell>
 *       </TableRow>
 *     </TableBody>
 *   </TableBase>
 * );
 * ```
 */
function TableBase({ children, borderless, className }: Props) {
  const { classes: rounded } = useRoundedTableStyles();

  return (
    <TableContainer className={clsx('scroll-x', className)}>
      <Table className={clsx(!borderless && rounded.table)}>{children}</Table>
    </TableContainer>
  );
}

export default memo(TableBase);
