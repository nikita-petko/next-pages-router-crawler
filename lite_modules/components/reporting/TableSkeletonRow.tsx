import { TableCell, TableRow, type TTableCellAlign } from '@rbx/foundation-ui';

import Skeleton from '@components/common/Skeleton';
import useTableSkeletonRowStyles from '@components/reporting/TableSkeletonRow.styles';
import { defaultAlign } from '@constants/genericManagementTableStyles';
import { SortableHeadCell, UnsortableHeadCell } from '@type/genericManagementTable';

interface TableSkeletonRowProps {
  headCells: (SortableHeadCell | UnsortableHeadCell)[];
}

const getAlignmentClass = (classes: Record<string, string>, align: TTableCellAlign) =>
  align && classes[align] ? classes[align] : classes.center;

/** Stable React key per column definition (matches table head identity). */
const headCellStableKey = (headCell: SortableHeadCell | UnsortableHeadCell): string =>
  'sortKey' in headCell ? headCell.sortKey : `${headCell.id}:${headCell.classNameKey}`;

const TableSkeletonRow = ({ headCells }: TableSkeletonRowProps) => {
  const { classes } = useTableSkeletonRowStyles();

  return (
    <TableRow data-testid='table-skeleton-row'>
      {headCells.map((headCell) => {
        const align = headCell.align || defaultAlign;
        const alignmentClass = getAlignmentClass(classes, align);
        const shouldRenderSkeleton = headCell.label !== '';

        return (
          <TableCell key={headCellStableKey(headCell)}>
            {shouldRenderSkeleton && (
              <div className={alignmentClass}>
                <Skeleton className='height-[20px] width-[80%]' />
              </div>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export default TableSkeletonRow;
