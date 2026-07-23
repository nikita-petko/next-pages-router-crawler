import {
  TableHeader as FoundationTableHeader,
  TableHeaderCell,
  TableRow,
} from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';

import GeneralTableTooltip from '@components/reporting/GenericTableTooltip';
import headerStyles from '@components/reporting/TableHeader.module.css';
import { defaultAlign } from '@constants/genericManagementTableStyles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  GenericSortableRowData,
  Order,
  SortableHeadCell,
  UnsortableHeadCell,
} from '@type/genericManagementTable';

const useFirstColumnHeadMinWidthStyles = makeStyles<{ minWidthPx?: number }>()(
  (_, { minWidthPx }) => ({
    headCell: minWidthPx != null && minWidthPx > 0 ? { minWidth: minWidthPx } : {},
  }),
);

interface TableHeaderProps {
  firstColumnMinWidthPx?: number;
  handleRequestSort: (property: keyof GenericSortableRowData) => void;
  headCells: (SortableHeadCell | UnsortableHeadCell)[];
  order: Order;
  orderBy: keyof GenericSortableRowData;
}

function isSortableHeadCell(
  headCell: SortableHeadCell | UnsortableHeadCell,
): headCell is SortableHeadCell {
  return (headCell as SortableHeadCell).sortKey !== undefined;
}

interface ManagementTableHeadCellProps {
  columnIndex: number;
  firstColumnMinWidthPx?: number;
  handleRequestSort: (property: keyof GenericSortableRowData) => void;
  order: Order;
  orderBy: keyof GenericSortableRowData;
  row: SortableHeadCell | UnsortableHeadCell;
}

const ManagementTableHeadCell = ({
  columnIndex,
  firstColumnMinWidthPx,
  handleRequestSort,
  order,
  orderBy,
  row,
}: ManagementTableHeadCellProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  // A few column labels (e.g. `Label.Plays`, `Heading.Audience`) are defined in
  // the Campaign namespace rather than Report. Resolve those from Campaign so
  // they don't render as raw keys; everything else stays on Report.
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { classes: firstColMinClasses } = useFirstColumnHeadMinWidthStyles({
    minWidthPx: columnIndex === 0 ? firstColumnMinWidthPx : undefined,
  });

  // Sticky header: pin to the top of the scroll container with an opaque background that
  // matches the page surface (`surface-0`) so the header doesn't read as a different shade
  // than the transparent table body; nowrap + z-index live in `stickyHeaderCell`.
  const mergedClassName = `sticky top-0 bg-surface-0 ${headerStyles.stickyHeaderCell} ${headerStyles[row.classNameKey]} ${firstColMinClasses.headCell}`;

  const align = row.align || defaultAlign;
  const translateLabel =
    row.labelNamespace === TranslationNamespace.Campaign ? translateCampaign : translate;
  const label = row.label ? translateLabel(row.label) : '';
  const activeSortDirection = order === 'asc' ? 'ascending' : 'descending';

  // Label first, then the info icon (its own `marginLeft` provides the gap). `inline-flex
  // items-center` keeps the icon vertically centered with the label — both when rendered
  // directly in the header cell (unsortable) and when Foundation nests children inside its
  // sort-button text span (sortable), where a bare icon would otherwise align to the baseline.
  const headerContent = (
    <span className='inline-flex items-center'>
      {label}
      <GeneralTableTooltip
        renderTooltip={row.renderTooltip}
        tooltipText={row.tooltipText ? translate(row.tooltipText) : ''}
      />
    </span>
  );

  return isSortableHeadCell(row) ? (
    <TableHeaderCell
      align={align}
      className={mergedClassName}
      onSort={() => handleRequestSort(row.sortKey)}
      sortDirection={orderBy === row.sortKey ? activeSortDirection : 'none'}
      sortLabel={label || undefined}>
      {headerContent}
    </TableHeaderCell>
  ) : (
    <TableHeaderCell align={align} className={mergedClassName}>
      {headerContent}
    </TableHeaderCell>
  );
};

const TableHeader = ({
  firstColumnMinWidthPx,
  handleRequestSort,
  headCells,
  order,
  orderBy,
}: TableHeaderProps) => (
  <FoundationTableHeader>
    <TableRow>
      {headCells.map((row, columnIndex) => (
        <ManagementTableHeadCell
          columnIndex={columnIndex}
          firstColumnMinWidthPx={firstColumnMinWidthPx}
          handleRequestSort={handleRequestSort}
          key={isSortableHeadCell(row) ? row.sortKey : row.id}
          order={order}
          orderBy={orderBy}
          row={row}
        />
      ))}
    </TableRow>
  </FoundationTableHeader>
);

export default TableHeader;
